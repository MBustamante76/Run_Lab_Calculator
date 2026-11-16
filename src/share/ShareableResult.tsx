import { useRef, useState, type ReactNode, type RefObject } from "react";
import { appendShareCardLines, buildShareUrl, type ShareState } from "./shareState";

type ShareableResultProps = {
  state: ShareState;
  className?: string;
  children: ReactNode;
};

export function ShareableResult({ state, className, children }: ShareableResultProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const url = buildShareUrl(state);
  const resultClass = className
    ? `run-lab-calculator__result ${className}`
    : "run-lab-calculator__result";

  return (
    <>
      <div ref={cardRef} className={resultClass} aria-live="polite">
        {children}
        <p className="run-lab-calculator__share-footer">RUN-LAB · {url}</p>
      </div>
      <ShareResultButton cardRef={cardRef} url={url} />
    </>
  );
}

function previewLines(node: HTMLElement): string[] {
  return node.innerText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("RUN-LAB ·"));
}

function ShareResultButton({
  cardRef,
  url,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  url: string;
}) {
  const [status, setStatus] = useState("");

  async function share() {
    setStatus("");
    const node = cardRef.current;
    if (!node) {
      return;
    }
    const lines = previewLines(node);
    const shareUrl = appendShareCardLines(url, lines);
    const title = lines[0] ?? "RUN-LAB result";
    const text = lines.slice(1, 3).join(" · ");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ url: shareUrl, title, text });
        setStatus("Link shared");
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setStatus("Could not share this result");
    }
  }

  return (
    <div className="run-lab-calculator__share-actions">
      <button type="button" className="run-lab-calculator__reset" onClick={() => void share()}>
        Share result
      </button>
      {status ? <p role="status">{status}</p> : null}
    </div>
  );
}
