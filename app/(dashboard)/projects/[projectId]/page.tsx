"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  Download,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectPhase,
  addProjectProgress,
  addUpdateComment,
  createProjectUpdate,
  createTask,
  getChatMessages,
  getDocuments,
  getProjectChat,
  getProjectDetails,
  getUpdateComments,
  getProjectUpdates,
  getTasks,
  sendChatMessage,
  toggleUpdateLike,
  updatePhasePaymentStatus,
  updateTaskStatus,
  uploadDocument,
} from "@/lib/api";
import type { Message as ChatMessageItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getSocketClient } from "@/lib/socket";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ActiveTab = "task" | "updates" | "documents" | "phase" | "conversation";

const DOCUMENT_CATEGORY_OPTIONS = [
  { label: "Drawings", value: "drawings" },
  { label: "Invoices", value: "invoices" },
  { label: "Reports", value: "reports" },
  { label: "Contracts", value: "contracts" },
] as const;

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  drawings: "Drawings",
  invoices: "Invoices",
  reports: "Reports",
  contracts: "Contracts",
};

const formatDocumentCategory = (category: string) =>
  DOCUMENT_CATEGORY_LABELS[category] ?? category;

const getInitials = (name?: string) => {
  const raw = String(name || "").trim();
  if (!raw) return "NA";

  const parts = raw.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const formatRelativeTime = (dateValue?: string) => {
  if (!dateValue) return "";

  const parsed = new Date(dateValue).getTime();
  if (Number.isNaN(parsed)) return "";

  const diffMs = Math.max(Date.now() - parsed, 0);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "JUST NOW";
  if (diffMinutes < 60) return `${diffMinutes}M AGO`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}H AGO`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}D AGO`;
};

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("task");
  const [taskModal, setTaskModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [addPhaseModal, setAddPhaseModal] = useState(false);
  const [phaseModal, setPhaseModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [updateCommentText, setUpdateCommentText] = useState("");
  const [chatText, setChatText] = useState("");
  const [progressValue, setProgressValue] = useState("");
  const [progressEdit, setProgressEdit] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDueDate, setNewPhaseDueDate] = useState("");
  const [newPhaseAmount, setNewPhaseAmount] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [phaseStatus, setPhaseStatus] = useState<"paid" | "unpaid">("paid");

  function resetNewPhaseForm() {
    setNewPhaseName("");
    setNewPhaseDueDate("");
    setNewPhaseAmount("");
  }

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => getTasks(projectId),
    enabled: !!projectId,
  });

  const updatesQuery = useQuery({
    queryKey: ["updates", projectId],
    queryFn: () => getProjectUpdates(projectId),
    enabled: !!projectId,
  });

  const docsQuery = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getDocuments(projectId),
    enabled: !!projectId,
  });

  const chatQuery = useQuery({
    queryKey: ["chat", projectId],
    queryFn: () => getProjectChat(projectId),
    enabled: !!projectId,
  });

  const chatId = chatQuery.data?._id;

  const messagesQuery = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getChatMessages(chatId!),
    enabled: !!chatId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (payload: {
      progressName: string;
      percent: number;
      note?: string;
    }) => addProjectProgress(projectId, payload),
    onSuccess: () => {
      toast.success("Progress updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProgressEdit(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setTaskModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: "not-started" | "in-progress" | "completed";
    }) => updateTaskStatus(taskId, { status }),
    onSuccess: () => {
      toast.success("Task status updated");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const createUpdateMutation = useMutation({
    mutationFn: createProjectUpdate,
    onSuccess: () => {
      toast.success("Update posted");
      setUpdateText("");
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const likeMutation = useMutation({
    mutationFn: toggleUpdateLike,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] }),
  });

  const commentMutation = useMutation({
    mutationFn: ({
      updateId,
      comment,
    }: {
      updateId: string;
      comment: string;
    }) => addUpdateComment(updateId, { comment }),
    onSuccess: (_, variables) => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
      queryClient.invalidateQueries({
        queryKey: ["update-comments", variables.updateId],
      });
      setUpdateCommentText("");
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
      setDocModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const createPhaseMutation = useMutation({
    mutationFn: (payload: {
      phaseName: string;
      amount: number;
      dueDate: string;
    }) => addProjectPhase(projectId, payload),
    onSuccess: () => {
      toast.success("Phase created");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      resetNewPhaseForm();
      setAddPhaseModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const phaseMutation = useMutation({
    mutationFn: () =>
      updatePhasePaymentStatus(projectId, {
        phaseName,
        paymentStatus: phaseStatus,
      }),
    onSuccess: () => {
      toast.success("Phase updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      setPhaseModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      const trimmed = String(message || "").trim();
      if (!chatId) {
        throw new Error("Chat is not ready");
      }
      if (!trimmed) {
        throw new Error("Message is required");
      }
      return sendChatMessage(chatId, { message: trimmed });
    },
    onSuccess: () => {
      setChatText("");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];
  const updates = updatesQuery.data ?? [];
  const activeUpdateId =
    selectedUpdateId && updates.some((update) => update._id === selectedUpdateId)
      ? selectedUpdateId
      : updates[0]?._id ?? null;

  const commentsQuery = useQuery({
    queryKey: ["update-comments", activeUpdateId],
    queryFn: () => getUpdateComments(activeUpdateId!),
    enabled: !!activeUpdateId,
  });

  const comments = commentsQuery.data ?? [];
  const documents = docsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const selectedUpdate =
    updates.find((update) => update._id === activeUpdateId) ?? null;

  const loading = projectQuery.isLoading;
  const lastProgress = useMemo(
    () => project?.progress ?? 0,
    [project?.progress],
  );

  const handleSendMessage = () => {
    const trimmed = chatText.trim();
    if (!trimmed || sendMessageMutation.isPending) {
      return;
    }
    sendMessageMutation.mutate(trimmed);
  };

  const handleSendUpdateComment = () => {
    const trimmed = updateCommentText.trim();
    if (!activeUpdateId || !trimmed || commentMutation.isPending) {
      return;
    }

    commentMutation.mutate({
      updateId: activeUpdateId,
      comment: trimmed,
    });
  };

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const socket = getSocketClient();
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinProjectRoom", projectId);
    if (chatId) {
      socket.emit("joinChatRoom", chatId);
    }

    const refreshUpdates = () => {
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
    };
    const refreshSelectedUpdateComments = (payload?: { updateId?: string }) => {
      if (!activeUpdateId) {
        return;
      }

      if (payload?.updateId && payload.updateId !== activeUpdateId) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["update-comments", activeUpdateId],
      });
    };
    const refreshDocuments = () => {
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
    };
    const refreshMessages = (payload?: { chatId?: string }) => {
      if (payload?.chatId && chatId && payload.chatId !== chatId) {
        return;
      }
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
    };
    const handleChatMessage = (
      incoming: ChatMessageItem & {
        chatRoom?: string | { _id?: string };
        chatId?: string;
      },
    ) => {
      if (!chatId) {
        return;
      }

      const incomingChatId =
        typeof incoming.chatRoom === "string"
          ? incoming.chatRoom
          : incoming.chatRoom?._id || incoming.chatId;

      if (incomingChatId && incomingChatId !== chatId) {
        return;
      }

      queryClient.setQueryData<ChatMessageItem[]>(
        ["messages", chatId],
        (current = []) => {
          if (current.some((item) => item._id === incoming._id)) {
            return current;
          }
          return [...current, incoming];
        },
      );
    };

    socket.on("project:updateCreated", refreshUpdates);
    socket.on("project:updateLiked", refreshUpdates);
    socket.on("project:updateCommented", refreshUpdates);
    socket.on("project:updateCommented", refreshSelectedUpdateComments);
    socket.on("project:documentUploaded", refreshDocuments);
    socket.on("chat:message", handleChatMessage);
    socket.on("chat:read", refreshMessages);

    return () => {
      socket.off("project:updateCreated", refreshUpdates);
      socket.off("project:updateLiked", refreshUpdates);
      socket.off("project:updateCommented", refreshUpdates);
      socket.off("project:updateCommented", refreshSelectedUpdateComments);
      socket.off("project:documentUploaded", refreshDocuments);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:read", refreshMessages);
      socket.disconnect();
    };
  }, [projectId, chatId, queryClient, activeUpdateId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/projects"
        className="text-heading-40 inline-flex items-center gap-2"
      >
        <ChevronLeft className="h-6 w-6" /> View Details
      </Link>
      <p className="text-body-16 text-white/80">
        Create and manage your projects
      </p>

      <Card className="max-w-md p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-body-16">Progress</p>
          <Button size="sm" onClick={() => setProgressEdit((prev) => !prev)}>
            {progressEdit ? "Close" : "Update"}
          </Button>
        </div>
        <ProgressBar value={lastProgress} />
        {progressEdit ? (
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              placeholder="80"
              className="h-10"
            />
            <Button
              size="sm"
              onClick={() =>
                updateProgressMutation.mutate({
                  progressName: "Manual Update",
                  percent: Number(progressValue),
                })
              }
            >
              Save
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-3">
        {(
          [
            ["task", "Task"],
            ["updates", "Updates"],
            ["documents", "Documents"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`text-title-24 rounded-md border px-4 py-2 ${activeTab === key ? "bg-[#8a732e]" : "bg-black"}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "task" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTaskModal(true)}>
              <Plus className="mr-2 h-5 w-5" /> Add New Task
            </Button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card
                key={task._id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-title-24">{task.taskName}</p>
                  <p className="text-body-16 text-white/80">
                    {task.description}
                  </p>
                  <p className="text-body-16 text-white/70">
                    Date: {formatDate(task.taskDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      task.status === "completed"
                        ? "bg-[#c4ffe0] text-[#0f944f]"
                        : task.status === "in-progress"
                          ? "bg-[#d8ecff] text-[#2b56df]"
                          : "bg-[#e8f0ff] text-[#2c58d8]"
                    }
                  >
                    {task.status}
                  </Badge>
                  <Select
                    value={task.status}
                    onChange={(e) =>
                      updateTaskStatusMutation.mutate({
                        taskId: task._id,
                        status: e.target.value as
                          | "not-started"
                          | "in-progress"
                          | "completed",
                      })
                    }
                    className="h-10"
                  >
                    <option value="not-started">not-started</option>
                    <option value="in-progress">in-progress</option>
                    <option value="completed">completed</option>
                  </Select>
                  <button className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
      {/* ============================== updates ============================== */}
      {activeTab === "updates" ? (
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
                const uploaderRole = String(
                  update.uploadedBy?.role || "site_manager",
                )
                  .replace("-", " ")
                  .toUpperCase();
                const avatarUrl = update.uploadedBy?.avatar?.url;

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
                        {update.description}
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
                            {uploaderRole} •{" "}
                            {formatRelativeTime(update.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-xs text-white/70 transition hover:text-white"
                          onClick={() => likeMutation.mutate(update._id)}
                        >
                          {update.stats.likeCount} Like
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-[#e8d38b] transition hover:text-[#f4e5af]"
                          onClick={() => {
                            setSelectedUpdateId(update._id);
                            const input = document.getElementById(
                              "update-comment-input",
                            ) as HTMLInputElement | null;
                            input?.focus();
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
                  {selectedUpdate.stats.commentCount} comments
                </p>
              ) : null}
            </div>
            <div className="max-h-[430px] flex-1 space-y-3 overflow-y-auto pr-1">
              {!selectedUpdate ? (
                <div className="rounded-lg border border-[#2a3943] bg-[#0f171c] p-3 text-sm text-white/65">
                  Click an update card to view comments.
                </div>
              ) : commentsQuery.isLoading ? (
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
                          <p className="text-xs font-semibold">
                            {commenterName}
                          </p>
                          <p className="text-[10px] text-black/45">
                            {formatRelativeTime(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-black/80">
                          {comment.comment}
                        </p>
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
                id="update-comment-input"
                value={updateCommentText}
                onChange={(e) => setUpdateCommentText(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendUpdateComment();
                  }
                }}
                placeholder="Start typing..."
                className="h-11 border-[#2a3a45] bg-[#0e1519] text-white placeholder:text-white/45"
              />
              <Button
                size="icon"
                className="h-11 w-11 bg-[#1b9e72] text-white hover:bg-[#168b64]"
                onClick={handleSendUpdateComment}
                disabled={
                  !activeUpdateId ||
                  commentMutation.isPending ||
                  !updateCommentText.trim()
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "documents" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setDocModal(true)}>
              <Plus className="mr-2 h-5 w-5" /> Upload Documents
            </Button>
          </div>

          <div className="space-y-2">
            {documents.map((doc) => (
              <Card
                key={doc._id}
                className="flex items-center justify-between bg-white p-3 text-black"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="h-5 w-5 text-[#8a732e]" />
                  <div>
                    <p className="text-body-16 font-medium">{doc.title}</p>
                    <p className="text-body-16 text-black/70">
                      {formatDocumentCategory(doc.category)} •{" "}
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8a732e]"
                >
                  <Download className="h-5 w-5" />
                </a>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "conversation" ? (
        <Card className="border-[#7f6a2c] p-4">
          <h3 className="text-title-24">
            Approve updated bathroom tile layout for ensuite
          </h3>
          <p className="text-body-16 mb-5 mt-2 text-white/70">
            Please review the herringbone pattern transition and the grout color
            selection
          </p>

          <div className="space-y-4">
            {messages.map((item) => (
              <div key={item._id}>
                <p className="text-body-16 font-semibold text-white/80">
                  {item.sender?.name}
                </p>
                <p className="text-body-16 text-white">{item.message}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Write a Comment..."
              className="h-12"
            />
            <Button className="h-12 px-6" onClick={handleSendMessage}>
              Send
            </Button>
          </div>
        </Card>
      ) : null}

      <Dialog open={taskModal} onOpenChange={setTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task for this project.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            action={(formData) =>
              createTaskMutation.mutate({
                projectId,
                taskName: String(formData.get("taskName") || ""),
                taskDate: String(formData.get("taskDate") || ""),
                dueDate: String(formData.get("taskDate") || ""),
                priority: String(formData.get("priority") || "medium") as
                  | "high"
                  | "medium"
                  | "low",
                description: String(formData.get("description") || ""),
              })
            }
          >
            <div>
              <Label>Task name</Label>
              <Input name="taskName" placeholder="task" required />
            </div>
            <div>
              <Label>Task Date</Label>
              <Input name="taskDate" type="date" required />
            </div>
            <div>
              <Label>Priority</Label>
              <Select name="priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
            <div>
              <Label>Task Description</Label>
              <Textarea
                name="description"
                placeholder="task description......"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaskModal(false)}
              >
                Cancel
              </Button>
              <Button disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={docModal} onOpenChange={setDocModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new project document for the client and team.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            action={(formData) => {
              formData.append("projectId", projectId);
              uploadDocumentMutation.mutate(formData);
            }}
          >
            <div>
              <Label>Select Category</Label>
              <Select name="category" required>
                {DOCUMENT_CATEGORY_OPTIONS.map((categoryOption) => (
                  <option
                    key={categoryOption.value}
                    value={categoryOption.value}
                  >
                    {categoryOption.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input name="title" placeholder="Document title" required />
            </div>
            <div className="rounded-lg border border-dashed border-white/50 p-8 text-center">
              <Label htmlFor="document" className="cursor-pointer text-body-16">
                Upload Photo
                <p className="text-body-16 text-white/70">png,jpeg,jpg</p>
              </Label>
              <Input
                id="document"
                name="document"
                type="file"
                className="hidden"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDocModal(false)}
              >
                Cancel
              </Button>
              <Button disabled={uploadDocumentMutation.isPending}>
                {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
