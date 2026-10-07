"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowRight, FileSpreadsheet } from "lucide-react";

export const CHATGPT_CATALOG_PROMPT = `Generate a realistic product catalog CSV for testing a marketplace catalog validation system.

Create 15–20 product rows using these columns:

sku,name,category,price,inventory,brand,currency,image_url

Important requirements:

- Make the CSV syntactically valid.
- Use realistic product names, categories, prices, and inventory values.
- Use a mixture of valid and intentionally problematic records so a catalog validation system can detect different types of issues.
- Include several completely valid products.
- Include some products with missing brand values.
- Include some products with missing image_url values.
- Include at least one invalid or non-positive price.
- Include at least one negative inventory value.
- Include at least one duplicate SKU.
- Include at least one duplicate product name.
- Include at least one unsupported currency such as JPY or AUD.
- Keep the remaining records valid.
- Do not add extra columns.
- Do not include formulas.
- Do not include markdown.
- Return ONLY the CSV content.
- Make sure the first row is the exact column header.
- Do not wrap the CSV in a code block.

After generating the CSV, save/download it as a .csv file so it can be uploaded directly to CatalogGuard.`;

interface TryYourOwnDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TryYourOwnDataModal({
  isOpen,
  onClose,
}: TryYourOwnDataModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(CHATGPT_CATALOG_PROMPT);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = CHATGPT_CATALOG_PROMPT;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy prompt to clipboard:", err);
    }
  };

  const handleGoToIngestion = () => {
    onClose();
    router.push("/uploads");
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Try Your Own Data"
      description="Generate a realistic product catalog with ChatGPT, then upload the CSV to see how CatalogGuard detects data-quality issues."
      maxWidth="max-w-[720px]"
    >
      {/* Section: How it works */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          How it works
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="text-xs font-medium text-slate-800">
              Copy the prompt
            </span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="text-xs font-medium text-slate-800">
              Generate a CSV with ChatGPT
            </span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold text-[11px] flex items-center justify-center shrink-0">
              3
            </span>
            <span className="text-xs font-medium text-slate-800">
              Upload it through Catalog Ingestion
            </span>
          </div>
        </div>
      </div>

      {/* Section: Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Prompt for ChatGPT
          </label>
          <Button
            type="button"
            variant={copied ? "secondary" : "outline"}
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 mr-1" />
                <span>Copy Prompt</span>
              </>
            )}
          </Button>
        </div>

        <div className="relative rounded-lg border border-slate-200 bg-slate-50/90 overflow-hidden">
          <pre
            tabIndex={0}
            className="p-3.5 max-h-[220px] sm:max-h-[250px] overflow-y-auto font-mono text-[11px] sm:text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
          >
            {CHATGPT_CATALOG_PROMPT}
          </pre>
        </div>
      </div>

      {/* Section: Next Step & Actions */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-600 font-medium">
          Next: Upload your generated CSV in Catalog Ingestion.
        </p>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleGoToIngestion}
            className="h-8 text-xs"
          >
            Go to Catalog Ingestion
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
