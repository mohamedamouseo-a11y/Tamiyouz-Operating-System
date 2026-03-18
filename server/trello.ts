import { getTrelloSettings, updateLastSync, getEmployeeById, createTask, updateTask, logActivity, getTasksByEmployee } from './db';
import { TRPCError } from '@trpc/server';

interface TrelloBoard {
  id: string;
  name: string;
  url: string;
  closed: boolean;
}

interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  pos: number;
  closed: boolean;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  url: string;
  idList: string;
  dateLastActivity: string;
  due: string | null;
  labels: { id: string; name: string; color: string | null }[];
}

interface TrelloAction {
  id: string;
  type: 'createCard' | 'updateCard';
  date: string;
  data: {
    card: { id: string; name: string };
    board: { id: string; name: string };
    list?: { id: string; name: string };
    listBefore?: { id: string; name: string };
    listAfter?: { id: string; name: string };
    old?: { idList?: string };
  };
}

export class TrelloService {
  private apiKey: string;
  private apiToken: string;

  constructor(apiKey: string, apiToken: string) {
    if (!apiKey || !apiToken) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Trello API Key and Token are required.' });
    }
    this.apiKey = apiKey;
    this.apiToken = apiToken;
  }

  private async trelloFetch(endpoint: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`https://api.trello.com/1${endpoint}`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('token', this.apiToken);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      const errorText = await res.text();
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Trello API error: ${res.status} - ${errorText}`,
      });
    }
    return res.json();
  }

  async testConnection(): Promise<{ success: boolean; memberName?: string }> {
    try {
      const member = await this.trelloFetch('/members/me');
      return { success: true, memberName: member.fullName };
    } catch {
      return { success: false };
    }
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return this.trelloFetch('/members/me/boards', { fields: 'name,url,closed', filter: 'open' });
  }

  async getBoardLists(boardId: string): Promise<TrelloList[]> {
    return this.trelloFetch(`/boards/${boardId}/lists`, { filter: 'open' });
  }

  async getCardsInBoard(boardId: string): Promise<TrelloCard[]> {
    return this.trelloFetch(`/boards/${boardId}/cards`, {
      fields: 'name,desc,url,idList,dateLastActivity,due,labels',
    });
  }

  async getCardActions(cardId: string): Promise<TrelloAction[]> {
    return this.trelloFetch(`/cards/${cardId}/actions`, {
      filter: 'updateCard:idList,createCard',
      limit: '50',
    });
  }
}

export async function getTrelloService(): Promise<TrelloService> {
  const settings = await getTrelloSettings();
  if (!settings) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Trello settings not configured. Please configure in Settings.' });
  }
  return new TrelloService(settings.apiKey, settings.apiToken);
}

// Map Trello list names to TOS task statuses
function mapListToStatus(listName: string): 'todo' | 'in_progress' | 'review' | 'done' {
  const lower = listName.toLowerCase();
  if (lower.includes('done') || lower.includes('complete') || lower.includes('finished')) return 'done';
  if (lower.includes('review') || lower.includes('testing') || lower.includes('qa')) return 'review';
  if (lower.includes('progress') || lower.includes('doing') || lower.includes('working')) return 'in_progress';
  return 'todo';
}

export async function syncEmployeeBoard(employeeId: number): Promise<{ synced: number; created: number; updated: number }> {
  const employee = await getEmployeeById(employeeId);
  if (!employee || !employee.trelloBoardId) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Employee ${employeeId} has no Trello board configured.` });
  }

  const trelloService = await getTrelloService();
  const boardId = employee.trelloBoardId;

  const lists = await trelloService.getBoardLists(boardId);
  const cards = await trelloService.getCardsInBoard(boardId);

  const listStatusMap: Record<string, 'todo' | 'in_progress' | 'review' | 'done'> = {};
  const listNameMap: Record<string, string> = {};
  lists.forEach(list => {
    listStatusMap[list.id] = mapListToStatus(list.name);
    listNameMap[list.id] = list.name;
  });

  let created = 0;
  let updated = 0;

  for (const card of cards) {
    const currentStatus = listStatusMap[card.idList] || 'todo';
    const today = new Date().toISOString().split('T')[0];

    // Check if task already exists by trelloCardId
    const existingTasks = await getTasksByEmployee(employeeId);
    const existingTask = existingTasks.find(t => t.trelloCardId === card.id);

    if (existingTask) {
      const oldStatus = existingTask.status;
      await updateTask(existingTask.id, {
        title: card.name,
        description: card.desc,
        trelloCardUrl: card.url,
        status: currentStatus,
      });
      if (oldStatus !== currentStatus) {
        await logActivity({
          employeeId,
          taskId: existingTask.id,
          action: 'card_moved',
          details: JSON.stringify({ cardName: card.name, from: oldStatus, to: currentStatus }),
          trelloCardId: card.id,
          fromStatus: oldStatus,
          toStatus: currentStatus,
        });
      }
      updated++;
    } else {
      const newTask = await createTask({
        employeeId,
        trelloCardId: card.id,
        trelloCardUrl: card.url,
        title: card.name,
        description: card.desc || null,
        status: currentStatus,
        date: today,
      });
      await logActivity({
        employeeId,
        taskId: newTask.id,
        action: 'card_created',
        details: JSON.stringify({ cardName: card.name, list: listNameMap[card.idList] }),
        trelloCardId: card.id,
        toStatus: currentStatus,
      });
      created++;
    }
  }

  await updateLastSync();
  return { synced: cards.length, created, updated };
}
