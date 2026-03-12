import type { Message } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConversationTabProps = {
  messages: Message[];
  chatText: string;
  onChatTextChange: (value: string) => void;
  onSendMessage: () => void;
};

export function ConversationTab({
  messages,
  chatText,
  onChatTextChange,
  onSendMessage,
}: ConversationTabProps) {
  return (
    <Card className="border-[#7f6a2c] p-4">
      <h3 className="text-title-24">
        Approve updated bathroom tile layout for ensuite
      </h3>
      <p className="text-body-16 mb-5 mt-2 text-white/70">
        Please review the herringbone pattern transition and the grout color
        selection
      </p>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-body-16 text-white/70">No messages yet.</p>
        ) : (
          messages.map((item) => (
            <div key={item._id}>
              <p className="text-body-16 font-semibold text-white/80">
                {item.sender?.name || "Unknown"}
              </p>
              <p className="text-body-16 text-white">{item.message || "-"}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Input
          value={chatText}
          onChange={(event) => onChatTextChange(event.target.value)}
          placeholder="Write a Comment..."
          className="h-12"
        />
        <Button className="h-12 px-6" onClick={onSendMessage}>
          Send
        </Button>
      </div>
    </Card>
  );
}
