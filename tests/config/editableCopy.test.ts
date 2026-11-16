import { describe, expect, it } from "vitest";
import { calculatorDisclaimer } from "../../src/config/copy";
import { defaultEditableCopy, mergeEditableCopy } from "../../src/config/editableCopy";
import { findTool } from "../../src/tools/toolDefinitions";

describe("editable copy", () => {
  it("keeps the built-in purpose and disclaimer when WordPress sends nothing", () => {
    const copy = mergeEditableCopy(undefined);

    expect(copy.disclaimer).toBe(calculatorDisclaimer);
    expect(copy.tools.predict.purpose).toBe(findTool("predict").purpose);
    expect(copy.tools.predict.formLead).toBe(
      "Enter a PB, optionally add another PB, then choose the target distance.",
    );
    expect(copy.intro.headlineLead).toBe(defaultEditableCopy.intro.headlineLead);
  });

  it("treats an empty localize array as no override", () => {
    expect(mergeEditableCopy([]).disclaimer).toBe(calculatorDisclaimer);
  });

  it("replaces purpose and disclaimer and leaves blank fields on the built-in wording", () => {
    const copy = mergeEditableCopy({
      disclaimer: "Custom disclaimer from WordPress.",
      intro: { eyebrow: "   ", headlineLead: "Custom headline." },
      tools: {
        predict: { purpose: "Custom Sarah example from WordPress.", title: "" },
      },
    });

    expect(copy.disclaimer).toBe("Custom disclaimer from WordPress.");
    expect(copy.intro.headlineLead).toBe("Custom headline.");
    expect(copy.intro.eyebrow).toBe(defaultEditableCopy.intro.eyebrow);
    expect(copy.tools.predict.purpose).toBe("Custom Sarah example from WordPress.");
    expect(copy.tools.predict.title).toBe(findTool("predict").title);
    expect(copy.tools.pace.purpose).toBe(findTool("pace").purpose);
  });
});
