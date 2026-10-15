import { introCopy } from "../config/copy";
import { CalculatorWorkspace } from "./CalculatorWorkspace";

export function RunLabCalculatorApp() {
  return (
    <>
      <section className="run-lab-calculator__intro">
        <div>
          <p className="run-lab-calculator__eyebrow">{introCopy.eyebrow}</p>
          <h1>
            {introCopy.headlineLead}
            <br />
            <span>{introCopy.headlineAccent}</span>
          </h1>
          <p className="run-lab-calculator__summary">{introCopy.summary}</p>
        </div>
        <aside className="run-lab-calculator__side-note">
          <strong>{introCopy.sideTitle}</strong>
          <p>{introCopy.sideBody}</p>
        </aside>
      </section>
      <CalculatorWorkspace />
    </>
  );
}
