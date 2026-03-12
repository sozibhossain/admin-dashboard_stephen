"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectProgress,
  addUpdateComment,
  createTask,
  getChatMessages,
  getDocuments,
  getProjectChat,
  getProjectDetails,
  getProjectUpdates,
  getTasks,
  getUpdateComments,
  sendChatMessage,
  toggleUpdateLike,
  updateTaskStatus,
  uploadDocument,
  type CommentItem,
  type DocumentItem,
  type Message as ChatMessageItem,
  type Task,
  type UpdateItem,
} from "@/lib/api";
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
import { toast } from "sonner";
import { ConversationTab } from "./_components/conversation-tab";
import { DocumentsTab } from "./_components/documents-tab";
import { ProjectTabs } from "./_components/project-tabs";
import { TaskTab } from "./_components/task-tab";
import type { ActiveTab } from "./_components/types";
import { DOCUMENT_CATEGORY_OPTIONS, ensureArray } from "./_components/utils";
import { UpdatesTab } from "./_components/updates-tab";

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const projectId = Array.isArray(projectIdParam)
    ? (projectIdParam[0] ?? "")
    : (projectIdParam ?? "");
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("task");
  const [taskModal, setTaskModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [updateCommentText, setUpdateCommentText] = useState("");
  const [chatText, setChatText] = useState("");
  const [progressValue, setProgressValue] = useState("");
  const [progressEdit, setProgressEdit] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => getTasks(projectId),
    enabled: !!projectId,
    select: (data) => ensureArray<Task>(data),
  });

  const updatesQuery = useQuery({
    queryKey: ["updates", projectId],
    queryFn: () => getProjectUpdates(projectId),
    enabled: !!projectId,
    select: (data) => ensureArray<UpdateItem>(data),
  });

  const docsQuery = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getDocuments(projectId),
    enabled: !!projectId,
    select: (data) => ensureArray<DocumentItem>(data),
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
    select: (data) => ensureArray<ChatMessageItem>(data),
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

  const likeMutation = useMutation({
    mutationFn: toggleUpdateLike,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] }),
    onError: (error) => toast.error(error.message),
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
      : (updates[0]?._id ?? null);

  const commentsQuery = useQuery({
    queryKey: ["update-comments", activeUpdateId],
    queryFn: () => getUpdateComments(activeUpdateId!),
    enabled: !!activeUpdateId,
    select: (data) => ensureArray<CommentItem>(data),
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
          : (incoming.chatRoom?._id ?? incoming.chatId);

      if (incomingChatId && incomingChatId !== chatId) {
        return;
      }

      queryClient.setQueryData(["messages", chatId], (current: unknown) => {
        const currentItems = ensureArray<ChatMessageItem>(current);
        if (currentItems.some((item) => item._id === incoming._id)) {
          return currentItems;
        }
        return [...currentItems, incoming];
      });
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

  if (!projectId) {
    return (
      <Card className="p-4">
        <p className="text-body-16 text-white/80">
          Unable to resolve project id from URL.
        </p>
      </Card>
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
      <p className="text-body-16 text-white/80">Create and manage your projects</p>

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
              onChange={(event) => setProgressValue(event.target.value)}
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

      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "task" ? (
        <TaskTab
          tasks={tasks}
          onCreateTask={() => setTaskModal(true)}
          onStatusChange={(taskId, status) =>
            updateTaskStatusMutation.mutate({ taskId, status })
          }
        />
      ) : null}

      {activeTab === "updates" ? (
        <UpdatesTab
          updates={updates}
          activeUpdateId={activeUpdateId}
          selectedUpdate={selectedUpdate}
          comments={comments}
          commentsLoading={commentsQuery.isLoading}
          updateCommentText={updateCommentText}
          commentInputRef={commentInputRef}
          isSendingComment={commentMutation.isPending}
          onUpdateCommentTextChange={setUpdateCommentText}
          onSelectUpdate={setSelectedUpdateId}
          onLike={(updateId) => likeMutation.mutate(updateId)}
          onSendComment={handleSendUpdateComment}
        />
      ) : null}

      {activeTab === "documents" ? (
        <DocumentsTab
          documents={documents}
          onUploadDocument={() => setDocModal(true)}
        />
      ) : null}

      {activeTab === "conversation" ? (
        <ConversationTab
          messages={messages}
          chatText={chatText}
          onChatTextChange={setChatText}
          onSendMessage={handleSendMessage}
        />
      ) : null}

      <Dialog open={taskModal} onOpenChange={setTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task for this project.</DialogDescription>
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
                  <option key={categoryOption.value} value={categoryOption.value}>
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
