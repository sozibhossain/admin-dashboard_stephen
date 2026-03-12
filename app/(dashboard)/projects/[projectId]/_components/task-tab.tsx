import { ArrowRight, Plus } from "lucide-react";
import type { Task } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type TaskTabProps = {
  tasks: Task[];
  onCreateTask: () => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
};

export function TaskTab({ tasks, onCreateTask, onStatusChange }: TaskTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateTask}>
          <Plus className="mr-2 h-5 w-5" /> Add New Task
        </Button>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="p-4">
            <p className="text-body-16 text-white/70">No tasks yet.</p>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card
              key={task._id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="text-title-24 truncate">{task.taskName || "-"}</p>
                <p className="text-body-16 text-white/80">{task.description || "-"}</p>
                <p className="text-body-16 text-white/70">
                  Date: {formatDate(task.taskDate)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge
                  className={
                    task.status === "completed"
                      ? "bg-[#c4ffe0] text-[#0f944f]"
                      : task.status === "in-progress"
                        ? "bg-[#d8ecff] text-[#2b56df]"
                        : "bg-[#e8f0ff] text-[#2c58d8]"
                  }
                >
                  {task.status || "not-started"}
                </Badge>
                <Select
                  value={task.status}
                  onChange={(event) =>
                    onStatusChange(
                      task._id,
                      event.target.value as
                        | "not-started"
                        | "in-progress"
                        | "completed",
                    )
                  }
                  className="h-10"
                >
                  <option value="not-started">not-started</option>
                  <option value="in-progress">in-progress</option>
                  <option value="completed">completed</option>
                </Select>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
