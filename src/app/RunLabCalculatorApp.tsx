import { ShareProvider } from "../share/ShareProvider";
import { CalculatorWorkspace } from "./CalculatorWorkspace";
import { useEditableCopy } from "./editableCopyContext";
import { EditableCopyProvider } from "./EditableCopyProvider";

export function RunLabCalculatorApp() {
  return (
    <ShareProvider>
      <EditableCopyProvider>
        <CalculatorIntro />
      </EditableCopyProvider>
    </ShareProvider>
  );
}

function CalculatorIntro() {
  const { intro } = useEditableCopy();

  return (
    <>
      <section className="run-lab-calculator__intro">
        <div>
          <p className="run-lab-calculator__eyebrow">{intro.eyebrow}</p>
          <h1>
            {intro.headlineLead}
            <br />
            <span>{intro.headlineAccent}</span>
          </h1>
          <p className="run-lab-calculator__summary">{intro.summary}</p>
        </div>
        <aside className="run-lab-calculator__side-note">
          <strong>{intro.sideTitle}</strong>
          <p>{intro.sideBody}</p>
        </aside>
      </section>
      <CalculatorWorkspace />
    </>
  );
}
