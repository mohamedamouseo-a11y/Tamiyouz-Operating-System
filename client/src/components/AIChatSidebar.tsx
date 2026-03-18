import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Streamdown } from 'streamdown';

export function AIChatSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory, isLoading: historyLoading, refetch: refetchHistory } = trpc.aiChat.history.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && isOpen }
  );

  const sendMessageMutation = trpc.aiChat.send.useMutation({
    onSuccess: () => {
      setMessage('');
      refetchHistory();
    },
  });

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refetchHistory();
    }
  }, [isOpen, isAuthenticated, refetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sendMessageMutation.isPending]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ message });
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-background border-l shadow-xl flex flex-col md:w-[400px]"
        >
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" /> TOS AI Assistant
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] p-3 rounded-lg text-sm",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <Streamdown>{msg.content}</Streamdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/40" />
                  <p className="font-medium">Welcome to TOS AI Assistant</p>
                  <p className="text-xs mt-1">Ask me anything about your work data</p>
                </div>
              )}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-muted text-muted-foreground rounded-bl-none">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2 bg-background">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendMessageMutation.isPending}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
            <Button type="submit" size="icon" disabled={!message.trim() || sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
