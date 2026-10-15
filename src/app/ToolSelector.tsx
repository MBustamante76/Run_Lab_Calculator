import { useRef } from "react";
import { workspaceCopy } from "../config/copy";
import type { ToolDefinition, ToolId } from "../tools/toolTypes";
import { FutureToolNotice } from "./FutureToolNotice";

type ToolSelectorProps = {
  tools: readonly ToolDefinition[];
  selectedId: ToolId;
  onSelect: (id: ToolId) => void;
};

export function ToolSelector({ tools, selectedId, onSelect }: ToolSelectorProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(fromIndex: number, direction: 1 | -1) {
    const nextIndex = (fromIndex + direction + tools.length) % tools.length;
    const nextTool = tools[nextIndex];
    if (!nextTool) {
      return;
    }
    buttonRefs.current[nextIndex]?.focus();
    if (nextTool.enabled) {
      onSelect(nextTool.id);
    }
  }

  return (
    <div className="run-lab-calculator__choices">
      <div
        role="radiogroup"
        aria-label={workspaceCopy.heading}
        onKeyDown={(event) => {
          const currentIndex = tools.findIndex((tool) => tool.id === selectedId);
          if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            moveFocus(currentIndex, 1);
          }
          if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            moveFocus(currentIndex, -1);
          }
        }}
      >
        {tools.map((tool, index) => {
          const selected = tool.id === selectedId;
          return (
            <button
              key={tool.id}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              className="run-lab-calculator__choice"
              aria-checked={selected}
              aria-disabled={!tool.enabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                if (tool.enabled) {
                  onSelect(tool.id);
                }
              }}
            >
              <span className="run-lab-calculator__choice-number">{tool.number}</span>
              <span className="run-lab-calculator__choice-copy">
                <strong>{tool.title}</strong>
                <small>{tool.description}</small>
                {tool.enabled ? null : <FutureToolNotice />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
