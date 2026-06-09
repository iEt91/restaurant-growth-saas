"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductThumbnailProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
};

export function ProductThumbnail({
  imageUrl,
  alt,
  className,
}: ProductThumbnailProps) {
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);
  const hasImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)] text-slate-400",
        className
      )}
    >
      <ImageIcon className="h-4 w-4" />
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl ?? ""}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedUrl(imageUrl ?? null)}
        />
      ) : null}
    </div>
  );
}
