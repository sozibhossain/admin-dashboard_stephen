"use client";

import type { FormEvent } from "react";
import { Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type EditablePhase = {
  phaseName: string;
  amount: string;
  dueDate: string;
};

export type ExistingProjectImage = {
  public_id: string;
  url: string;
};

export type NewProjectImage = {
  id: string;
  preview: string;
};

type ManagerOption = {
  _id: string;
  name: string;
};

type UpdateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  siteManagerId: string;
  onSiteManagerIdChange: (value: string) => void;
  managers?: ManagerOption[];
  phases: EditablePhase[];
  onPhaseChange: (
    index: number,
    field: keyof EditablePhase,
    value: string,
  ) => void;
  onAddPhase: () => void;
  onRemovePhase: (index: number) => void;
  totalProjectBudget: number;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  existingImages: ExistingProjectImage[];
  newImages: NewProjectImage[];
  onNewImagesChange: (files: FileList | null) => void;
  onRemoveExistingImage: (publicId: string) => void;
  onRemoveNewImage: (imageId: string) => void;
  isPending: boolean;
};

export default function UpdateProjectModal({
  open,
  onClose,
  onSubmit,
  clientName,
  onClientNameChange,
  projectName,
  onProjectNameChange,
  siteManagerId,
  onSiteManagerIdChange,
  managers,
  phases,
  onPhaseChange,
  onAddPhase,
  onRemovePhase,
  totalProjectBudget,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  address,
  onAddressChange,
  existingImages,
  newImages,
  onNewImagesChange,
  onRemoveExistingImage,
  onRemoveNewImage,
  isPending,
}: UpdateProjectModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex h-[80vh] min-h-[520px] max-h-[80vh] max-w-5xl flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Update Project</DialogTitle>
          <DialogDescription>
            Edit the project information, assigned manager, phases, and dates.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={onSubmit}
        >
          <div className="app-scrollbar min-h-0 flex-1 space-y-4 overflow-y-scroll pr-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Client Name</Label>
                <Input
                  value={clientName}
                  onChange={(event) => onClientNameChange(event.target.value)}
                />
              </div>
              <div>
                <Label>Projects Name</Label>
                <Input
                  value={projectName}
                  onChange={(event) => onProjectNameChange(event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Site Manager</Label>
              <Select
                value={siteManagerId}
                onChange={(event) => onSiteManagerIdChange(event.target.value)}
              >
                <option value="">Select a manager</option>
                {(managers ?? []).map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </Select>
            </div>

            {phases.map((phase, index) => (
              <div key={index} className="rounded-lg border border-white/10 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-body-16 font-medium text-white">
                    Phase {index + 1}
                  </p>
                  {phases.length > 1 ? (
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                      onClick={() => onRemovePhase(index)}
                      aria-label={`Remove phase ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Phase Name</Label>
                    <Input
                      value={phase.phaseName}
                      onChange={(event) =>
                        onPhaseChange(index, "phaseName", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Phase Amount</Label>
                    <Input
                      value={phase.amount}
                      onChange={(event) =>
                        onPhaseChange(index, "amount", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={phase.dueDate}
                      onChange={(event) =>
                        onPhaseChange(index, "dueDate", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded border border-white/40"
              onClick={onAddPhase}
              aria-label="Add project phase"
            >
              <Plus className="h-4 w-4" />
            </button>

            <div>
              <Label>Total Projects Budget</Label>
              <Input
                value={String(totalProjectBudget)}
                readOnly
                className="cursor-not-allowed"
              />
            </div>

            <div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Projects Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => onStartDateChange(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Projects End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => onEndDateChange(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(event) => onAddressChange(event.target.value)}
              />
            </div>

            <div>
              <Label>Project Images</Label>
              <div className="mt-2 rounded-lg border border-dashed border-white/30 p-4">
                <label
                  htmlFor="update-project-images"
                  className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/25 px-3 py-2 text-sm text-white/90"
                >
                  <Upload className="h-4 w-4" />
                  Add Images
                </label>
                <Input
                  id="update-project-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => onNewImagesChange(event.target.files)}
                />

                {existingImages.length === 0 && newImages.length === 0 ? (
                  <p className="text-sm text-white/60">
                    No project images yet. Upload one or more images.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {existingImages.map((image) => (
                      <div
                        key={image.public_id}
                        className="relative h-28 overflow-hidden rounded-md border border-white/20"
                      >
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${image.url})` }}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                          onClick={() => onRemoveExistingImage(image.public_id)}
                          aria-label="Remove existing image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {newImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative h-28 overflow-hidden rounded-md border border-[#1b9e72]/40"
                      >
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${image.preview})` }}
                        />
                        <div className="absolute left-2 top-2 rounded bg-[#1b9e72]/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                          NEW
                        </div>
                        <button
                          type="button"
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                          onClick={() => onRemoveNewImage(image.id)}
                          aria-label="Remove new image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button className="h-12" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
