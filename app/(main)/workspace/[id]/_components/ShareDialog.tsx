"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, FileText, LayoutGrid, Lock, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { setWorkspaceSharing } from "@/actions/workspace";
import { useFetch } from "@/hooks/use-fetch";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { useUpgradeDialog } from "@/components/UpgradeDialog";
import { UPGRADE_REASONS, type LimitError } from "@/lib/plan-limits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// window only exists in the browser, so read the site origin through React's external-store API,
// which renders "" on the server and the real origin once hydrated.
const noopSubscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ShareDialog({
  workspaceId,
  workspaceName,
  initialShareToken,
  canShare,
  canExportPdf,
}: {
  workspaceId: string;
  workspaceName: string;
  initialShareToken: string | null;
  // From the workspace owner's plan, checked on the server (sharing is enforced there too).
  canShare: boolean;
  canExportPdf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [exporting, setExporting] = useState<"doc" | "canvas" | null>(null);
  const { canvasEditor, docEditor } = useWorkspaceEditors();
  const { fn: setSharingFn, loading } = useFetch(setWorkspaceSharing);
  const origin = useSyncExternalStore(noopSubscribe, getOrigin, getServerOrigin);
  const shareUrl = `${origin}/shared/${shareToken}`;

  const openUpgrade = useUpgradeDialog();

  // Close this dialog first: two modal dialogs at once fight over focus.
  const showUpgrade = (reason: LimitError) => {
    setOpen(false);
    openUpgrade(UPGRADE_REASONS[reason]);
  };

  const updateSharing = async (enabled: boolean) => {
    if (enabled && !canShare) return showUpgrade("sharing");
    const result = await setSharingFn(workspaceId, enabled);
    if (!result) return;
    if ("limit" in result) return showUpgrade(result.limit);
    setShareToken(result.shareToken);
  };


  // BlockNote's own exporter builds a real text PDF from the live doc. Both libraries are
  // loaded only on click, since they're too big to ship with the page.
  const exportDoc = async () => {
    if (!docEditor) return;
    setExporting("doc");
    try {
      const [{ PDFExporter, pdfDefaultSchemaMappings }, { pdf }] = await Promise.all([
        import("@blocknote/xl-pdf-exporter/react-pdf"),
        import("@react-pdf/renderer"),
      ]);
      const exporter = new PDFExporter(docEditor.schema, pdfDefaultSchemaMappings);
      const pdfDocument = await exporter.toReactPDFDocument(docEditor.document);
      downloadBlob(await pdf(pdfDocument).toBlob(), `${workspaceName} - doc.pdf`);
    } catch {
      toast.error("Couldn't export the doc");
    } finally {
      setExporting(null);
    }
  };

  // Renders the canvas to a high-res PNG, then wraps it in a single PDF page of the same size.
  const exportCanvas = async () => {
    if (!canvasEditor) return;
    const shapeIds = [...canvasEditor.getCurrentPageShapeIds()];
    if (shapeIds.length === 0) {
      toast.error("The canvas is empty");
      return;
    }

    setExporting("canvas");
    try {
      const { url, width, height } = await canvasEditor.toImageDataUrl(shapeIds, {
        format: "png",
        background: true,
        padding: 32,
        scale: 2,
      });
      const { jsPDF } = await import("jspdf");
      // Page size is half the image's pixels, so the 2x render stays crisp when zoomed.
      const [pageWidth, pageHeight] = [width / 2, height / 2];
      const pdf = new jsPDF({
        orientation: pageWidth > pageHeight ? "landscape" : "portrait",
        unit: "px",
        format: [pageWidth, pageHeight],
        hotfixes: ["px_scaling"],
      });
      pdf.addImage(url, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${workspaceName} - canvas.pdf`);
    } catch {
      toast.error("Couldn't export the canvas");
    } finally {
      setExporting(null);
    }
  };

  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-8 px-3.5 bg-[#f59e0b] hover:bg-[#ea580c] text-black font-semibold text-xs rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Share2 className="size-3.5" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="border border-white/10 bg-[#121319]/95 backdrop-blur-2xl sm:max-w-md shadow-2xl rounded-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-100">
            Share &ldquo;{workspaceName}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Everyone in your organization can already edit this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-white/8 bg-[#171821] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="share-link" className="flex flex-col items-start gap-1 cursor-pointer">
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                  Public link
                  {!canShare && <Lock className="size-3 text-muted-foreground" />}
                </span>
                <span className="text-xs font-normal text-zinc-400">
                  Read-only doc and canvas, no sign-in required.
                </span>
              </Label>
              <Switch
                id="share-link"
                checked={shareToken !== null}
                onCheckedChange={updateSharing}
                disabled={loading ?? false}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            {shareToken && (
              <div className="flex items-center gap-2 pt-1 animate-fade-in">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs font-mono h-8 bg-black/30 border-white/10 text-zinc-300 selection:bg-amber-500/25"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  aria-label="Copy link"
                  className={`h-8 px-2.5 text-xs transition-all ${
                    copied
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-white/12 bg-white/5 hover:bg-white/10 text-zinc-200"
                  }`}
                >
                  {copied ? (
                    <span className="font-semibold text-emerald-300">Copied ✓</span>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateSharing(true)}
                  disabled={loading ?? false}
                  aria-label="Reset link"
                  title="Reset link (the old link stops working)"
                  className="size-8 shrink-0 border-white/12 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/8 bg-[#171821] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                  Export doc & canvas
                  {!canExportPdf && <Lock className="size-3 text-muted-foreground" />}
                </Label>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Download high-resolution PDFs for your team.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                className="h-9 gap-2 border-white/10 bg-white/5 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-medium text-xs text-zinc-200"
                onClick={canExportPdf ? exportDoc : () => showUpgrade("pdfExport")}
                disabled={canExportPdf && (!docEditor || exporting !== null)}
              >
                <FileText className="size-3.5" />
                {exporting === "doc" ? "Exporting..." : "↓ Download Doc PDF"}
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-2 border-white/10 bg-white/5 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-medium text-xs text-zinc-200"
                onClick={canExportPdf ? exportCanvas : () => showUpgrade("pdfExport")}
                disabled={canExportPdf && (!canvasEditor || exporting !== null)}
              >
                <LayoutGrid className="size-3.5" />
                {exporting === "canvas" ? "Exporting..." : "↓ Download Canvas PDF"}
              </Button>
            </div>
            {canExportPdf && (!docEditor || !canvasEditor) && (
              <p className="text-[11px] text-zinc-500">
                Switch to Both view to export {!docEditor ? "the doc" : "the canvas"}.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
