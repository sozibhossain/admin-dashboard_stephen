"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteProject,
  getManagers,
  getProjects,
  updateProject,
  type Project,
} from "@/lib/api";
import { DASHBOARD_CATEGORY } from "@/lib/constants";
import {
  calculateProjectBudget,
  parseAmountInput,
  toDateInputValue,
} from "@/lib/project-form";
import UpdateProjectModal, {
  type EditablePhase,
  type ExistingProjectImage,
  type NewProjectImage,
} from "./_components/Update_project";
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
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { formatCurrency, formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 9;

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [siteManagerId, setSiteManagerId] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [existingImages, setExistingImages] = useState<ExistingProjectImage[]>([]);
  const [removedImagePublicIds, setRemovedImagePublicIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewProjectImage[]>([]);
  const newImagesRef = useRef<Array<NewProjectImage & { file: File }>>([]);
  const [phases, setPhases] = useState<EditablePhase[]>([
    { phaseName: "", amount: "", dueDate: "" },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => getProjects(search || undefined),
  });
  const { data: managers } = useQuery({
    queryKey: ["managers-list"],
    queryFn: getManagers,
  });

  const paged = useMemo(
    () => paginate(data ?? [], page, PAGE_SIZE),
    [data, page],
  );
  const totalProjectBudget = useMemo(
    () => calculateProjectBudget(phases),
    [phases],
  );

  const updateProjectMutation = useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: FormData;
    }) => updateProject(projectId, payload),
    onSuccess: (_response, variables) => {
      toast.success("Project updated successfully");
      closeEditModal();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      toast.success("Project deleted successfully");
      setDeletingProject(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  function openEditModal(project: Project) {
    setEditingProject(project);
    setClientName(project.clientName ?? "");
    setProjectName(project.projectName ?? "");
    setSiteManagerId(project.siteManager?._id ?? "");
    setAddress(project.address ?? "");
    setStartDate(toDateInputValue(project.startDate));
    setEndDate(toDateInputValue(project.endDate));
    setPhases(
      project.phases?.length
        ? project.phases.map((phase) => ({
            phaseName: phase.phaseName ?? "",
            amount: String(phase.amount ?? ""),
            dueDate: toDateInputValue(phase.dueDate),
          }))
        : [{ phaseName: "", amount: "", dueDate: "" }],
    );
    setExistingImages(
      (project.images ?? [])
        .filter((image) => image.public_id && image.url)
        .map((image) => ({
          public_id: String(image.public_id),
          url: image.url,
        })),
    );
    setRemovedImagePublicIds([]);
    newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    newImagesRef.current = [];
    setNewImages([]);
  }

  function closeEditModal() {
    setEditingProject(null);
    setPhases([{ phaseName: "", amount: "", dueDate: "" }]);
    setExistingImages([]);
    setRemovedImagePublicIds([]);
    newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    newImagesRef.current = [];
    setNewImages([]);
  }

  function handlePhaseChange(
    index: number,
    field: keyof EditablePhase,
    value: string,
  ) {
    setPhases((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function handleAddPhase() {
    setPhases((prev) => [...prev, { phaseName: "", amount: "", dueDate: "" }]);
  }

  function handleRemovePhase(index: number) {
    setPhases((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleNewImagesChange(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    const nextItems = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    newImagesRef.current = [...newImagesRef.current, ...nextItems];
    setNewImages(newImagesRef.current.map(({ id, preview }) => ({ id, preview })));
  }

  function handleRemoveExistingImage(publicId: string) {
    setExistingImages((prev) =>
      prev.filter((image) => image.public_id !== publicId),
    );
    setRemovedImagePublicIds((prev) =>
      prev.includes(publicId) ? prev : [...prev, publicId],
    );
  }

  function handleRemoveNewImage(imageId: string) {
    const removed = newImagesRef.current.find((image) => image.id === imageId);
    if (removed) {
      URL.revokeObjectURL(removed.preview);
    }
    newImagesRef.current = newImagesRef.current.filter(
      (image) => image.id !== imageId,
    );
    setNewImages(newImagesRef.current.map(({ id, preview }) => ({ id, preview })));
  }

  function handleUpdateProject() {
    if (!editingProject) {
      return;
    }

    const missingFields = [
      !clientName.trim() ? "Client Name" : null,
      !projectName.trim() ? "Projects Name" : null,
      !startDate ? "Projects Start Date" : null,
      !endDate ? "Projects End Date" : null,
      !address.trim() ? "Address" : null,
      !siteManagerId ? "Site Manager" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    const hasIncompletePhase = phases.some((phase) =>
      phase.phaseName.trim() || phase.amount.trim() || phase.dueDate
        ? !(phase.phaseName.trim() && phase.amount.trim() && phase.dueDate)
        : false,
    );

    if (hasIncompletePhase) {
      toast.error("Complete or remove each phase before updating the project");
      return;
    }

    const normalizedPhases = phases
      .filter(
        (phase) => phase.phaseName.trim() && phase.amount.trim() && phase.dueDate,
      )
      .map((phase) => ({
        phaseName: phase.phaseName.trim(),
        amount: parseAmountInput(phase.amount),
        dueDate: phase.dueDate,
      }));

    if (normalizedPhases.length === 0) {
      toast.error("Add at least one phase to the project");
      return;
    }

    const phaseNames = normalizedPhases.map((phase) =>
      phase.phaseName.toLowerCase(),
    );
    if (new Set(phaseNames).size !== phaseNames.length) {
      toast.error("Phase names must be unique within a project");
      return;
    }

    if (
      normalizedPhases.some(
        (phase) => Number.isNaN(phase.amount) || phase.amount < 0,
      )
    ) {
      toast.error("Phase amount must be a valid number");
      return;
    }

    const payload = new FormData();
    payload.set("clientName", clientName.trim());
    payload.set("projectName", projectName.trim());
    payload.set("category", DASHBOARD_CATEGORY);
    payload.set("phases", JSON.stringify(normalizedPhases));
    payload.set("startDate", startDate);
    payload.set("endDate", endDate);
    payload.set("address", address.trim());
    payload.set("siteManagerId", siteManagerId);
    payload.set("removedImagePublicIds", JSON.stringify(removedImagePublicIds));

    newImagesRef.current.forEach((image) => {
      payload.append("images", image.file);
    });

    updateProjectMutation.mutate({
      projectId: editingProject._id,
      payload,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-heading-40">Projects</h2>
          <p className="text-body-16 mt-1 text-white/80">
            Create and manage your projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="h-12">
            <Plus className="mr-2 h-5 w-5" /> Add New Project
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name"
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="text-body-16 font-semibold text-white">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Projects Name</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Total Paid Amount</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((project) => (
                  <tr
                    key={project._id}
                    className="text-body-16 border-t border-white/10 text-white/90"
                  >
                    <td className="px-6 py-5">{project.clientName}</td>
                    <td className="px-6 py-5">{project.projectName}</td>
                    <td className="px-6 py-5">
                      {formatCurrency(project.projectBudget)}
                    </td>
                    <td className="px-6 py-5">
                      {formatCurrency(project.totalPaid)}
                    </td>
                    <td className="px-6 py-5">
                      {formatDate(project.startDate)}
                    </td>
                    <td className="px-6 py-5">{formatDate(project.endDate)}</td>
                    <td className="px-6 py-5 min-w-[220px]">
                      <ProgressBar value={project.progress} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Link href={`/projects/${project._id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                          aria-label={`Edit ${project.projectName}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProject(project)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                          aria-label={`Delete ${project.projectName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-body-16 text-white/85">
          Showing {paged.total === 0 ? 0 : (paged.page - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(paged.page * PAGE_SIZE, paged.total)} of {paged.total}{" "}
          results
        </p>
        <PaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          onChange={setPage}
        />
      </div>

      <UpdateProjectModal
        open={Boolean(editingProject)}
        onClose={closeEditModal}
        onSubmit={(event) => {
          event.preventDefault();
          handleUpdateProject();
        }}
        clientName={clientName}
        onClientNameChange={setClientName}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        siteManagerId={siteManagerId}
        onSiteManagerIdChange={setSiteManagerId}
        managers={managers?.map((manager) => ({
          _id: manager._id,
          name: manager.name,
        }))}
        phases={phases}
        onPhaseChange={handlePhaseChange}
        onAddPhase={handleAddPhase}
        onRemovePhase={handleRemovePhase}
        totalProjectBudget={totalProjectBudget}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        address={address}
        onAddressChange={setAddress}
        existingImages={existingImages}
        newImages={newImages}
        onNewImagesChange={handleNewImagesChange}
        onRemoveExistingImage={handleRemoveExistingImage}
        onRemoveNewImage={handleRemoveNewImage}
        isPending={updateProjectMutation.isPending}
      />

      <Dialog
        open={Boolean(deletingProject)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteProjectMutation.isPending) {
            setDeletingProject(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {deletingProject?.projectName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setDeletingProject(null)}
              disabled={deleteProjectMutation.isPending}
            >
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              onClick={() => {
                if (deletingProject?._id) {
                  deleteProjectMutation.mutate(deletingProject._id);
                }
              }}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
