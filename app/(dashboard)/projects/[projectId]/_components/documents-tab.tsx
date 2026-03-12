import { Download, Paperclip, Plus } from "lucide-react";
import type { DocumentItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { formatDocumentCategory } from "./utils";

type DocumentsTabProps = {
  documents: DocumentItem[];
  onUploadDocument: () => void;
};

export function DocumentsTab({ documents, onUploadDocument }: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onUploadDocument}>
          <Plus className="mr-2 h-5 w-5" /> Upload Documents
        </Button>
      </div>

      <div className="space-y-2">
        {documents.length === 0 ? (
          <Card className="bg-white p-4 text-black">
            <p className="text-body-16 text-black/70">No documents uploaded yet.</p>
          </Card>
        ) : (
          documents.map((doc) => {
            const documentUrl = doc.document?.url || "";

            return (
              <Card
                key={doc._id}
                className="flex items-center justify-between bg-white p-3 text-black"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="h-5 w-5 text-[#8a732e]" />
                  <div>
                    <p className="text-body-16 font-medium">{doc.title || "-"}</p>
                    <p className="text-body-16 text-black/70">
                      {formatDocumentCategory(doc.category)} |{" "}
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                {documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8a732e]"
                    aria-label={`Download ${doc.title || "document"}`}
                  >
                    <Download className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="cursor-not-allowed text-black/30">
                    <Download className="h-5 w-5" />
                  </span>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
