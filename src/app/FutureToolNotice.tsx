import { workspaceCopy } from "../config/copy";

export function FutureToolNotice() {
  return (
    <span className="run-lab-calculator__future">
      {workspaceCopy.futureMilestone}
    </span>
  );
}
