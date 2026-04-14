import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ClientNotesTab({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clientNotes.list.useQuery({ clientId });
  const [content, setContent] = useState("");

  const createNote = trpc.clientNotes.create.useMutation({
    onSuccess: async () => {
      await utils.clientNotes.list.invalidate({ clientId });
      setContent("");
      toast.success("Note added");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteNote = trpc.clientNotes.delete.useMutation({
    onSuccess: async () => {
      await utils.clientNotes.list.invalidate({ clientId });
      toast.success("Note deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write an internal note for the team..."
            rows={4}
          />
          <div className="flex justify-end">
            <Button disabled={!content.trim() || createNote.isPending} onClick={() => createNote.mutate({ clientId, content })}>
              Add note
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading notes...</div>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No notes yet.
          </div>
        ) : (
          (data ?? []).map((note) => (
            <Card key={note.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{note.authorName ?? `User #${note.authorId}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm leading-6">{note.content}</div>
                <div className="flex justify-end">
                  <Button variant="destructive" size="sm" onClick={() => deleteNote.mutate({ id: note.id })}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
