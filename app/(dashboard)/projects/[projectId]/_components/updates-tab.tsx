import type { RefObject } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { CommentItem, UpdateItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelativeTime, getInitials } from "./utils";

type UpdatesTabProps = {
  updates: UpdateItem[];
  activeUpdateId: string | null;
  selectedUpdate: UpdateItem | null;
  comments: CommentItem[];
  commentsLoading: boolean;
  updateCommentText: string;
  commentInputRef: RefObject<HTMLInputElement | null>;
  isSendingComment: boolean;
  onUpdateCommentTextChange: (value: string) => void;
  onSelectUpdate: (updateId: string) => void;
  onLike: (updateId: string) => void;
  onSendComment: () => void;
};

export function UpdatesTab({
  updates,
  activeUpdateId,
  selectedUpdate,
  comments,
  commentsLoading,
  updateCommentText,
  commentInputRef,
  isSendingComment,
  onUpdateCommentTextChange,
  onSelectUpdate,
  onLike,
  onSendComment,
}: UpdatesTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-3">
        {updates.length === 0 ? (
          <Card className="border-[#24313a] bg-[#111a20] p-4">
            <p className="text-body-16 text-white/70">No updates yet.</p>
          </Card>
        ) : (
          updates.map((update) => {
            const previewImage = update.images?.[0]?.url;
            const uploaderName = update.uploadedBy?.name || "Unknown User";
            const uploaderRole = String(update.uploadedBy?.role || "site_manager")
              .replace("-", " ")
              .toUpperCase();
            const avatarUrl = update.uploadedBy?.avatar?.url;
            const likeCount = Number(update.stats?.likeCount ?? 0);

            return (
              <Card
                key={update._id}
                className={`cursor-pointer border p-3 transition ${
                  activeUpdateId === update._id
                    ? "border-[#3f6176] bg-[#14212a]"
                    : "border-[#24313a] bg-[#111a20]"
                }`}
              >
                <div className="flex gap-3">
                  <div className="h-24 w-24 overflow-hidden rounded-md border border-[#2f404a] bg-[#1c2830]">
                    {previewImage ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${previewImage})` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                        No Image
                      </div>
                    )}
                  </div>
                  <p className="text-body-16 flex-1 leading-relaxed text-white/90">
                    {update.description || "-"}
                  </p>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <div
                        className="h-9 w-9 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${avatarUrl})` }}
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d404b] text-xs font-semibold text-white">
                        {getInitials(uploaderName)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white/90">
                        {uploaderName}
                      </p>
                      <p className="text-[10px] tracking-wide text-white/55">
                        {uploaderRole} | {formatRelativeTime(update.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-xs text-white/70 transition hover:text-white"
                      onClick={() => onLike(update._id)}
                    >
                      {likeCount} Like
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-[#e8d38b] transition hover:text-[#f4e5af]"
                      onClick={() => {
                        onSelectUpdate(update._id);
                        commentInputRef.current?.focus();
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card className="flex flex-col border-[#24313a] bg-[#111a20] p-3">
        <div className="mb-3 border-b border-[#24313a] pb-2">
          <p className="text-sm font-semibold text-white/90">
            {selectedUpdate ? "Update Comments" : "Select an update"}
          </p>
          {selectedUpdate ? (
            <p className="text-xs text-white/55">
              {Number(selectedUpdate.stats?.commentCount ?? comments.length)} comments
            </p>
          ) : null}
        </div>
        <div className="max-h-[430px] flex-1 space-y-3 overflow-y-auto pr-1">
          {!selectedUpdate ? (
            <div className="rounded-lg border border-[#2a3943] bg-[#0f171c] p-3 text-sm text-white/65">
              Click an update card to view comments.
            </div>
          ) : commentsLoading ? (
            <div className="rounded-lg border border-[#2a3943] bg-[#0f171c] p-3 text-sm text-white/65">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-lg border border-[#2a3943] bg-[#0f171c] p-3 text-sm text-white/65">
              No comments yet.
            </div>
          ) : (
            comments.map((comment) => {
              const commenterName = comment.user?.name || "Unknown";
              const commenterRole = String(comment.user?.role || "")
                .replace("-", " ")
                .toUpperCase();
              const commenterAvatar = comment.user?.avatar?.url;

              return (
                <div key={comment._id} className="flex items-start gap-2">
                  {commenterAvatar ? (
                    <div
                      className="mt-1 h-8 w-8 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${commenterAvatar})` }}
                    />
                  ) : (
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#2d404b] text-[10px] font-semibold text-white">
                      {getInitials(commenterName)}
                    </div>
                  )}
                  <div className="flex-1 rounded-md bg-white/90 p-3 text-[#111]">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{commenterName}</p>
                      <p className="text-[10px] text-black/45">
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-black/80">{comment.comment || "-"}</p>
                    {commenterRole ? (
                      <p className="mt-1 text-[10px] text-black/45">
                        {commenterRole}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t border-[#24313a] pt-3">
          <Input
            ref={commentInputRef}
            id="update-comment-input"
            value={updateCommentText}
            onChange={(event) => onUpdateCommentTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSendComment();
              }
            }}
            placeholder="Start typing..."
            className="h-11 border-[#2a3a45] bg-[#0e1519] text-white placeholder:text-white/45"
          />
          <Button
            size="icon"
            className="h-11 w-11 bg-[#1b9e72] text-white hover:bg-[#168b64]"
            onClick={onSendComment}
            disabled={
              !activeUpdateId || isSendingComment || !updateCommentText.trim()
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
