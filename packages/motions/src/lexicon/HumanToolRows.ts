import { HumanActionRow } from "../law/HumanActionRow";
import { useTool } from "../tasks/useTool";

/**
 * The tool strokes as rows (#3361): each tool of `useTool` under a name of its own, the held prop, the work site, the hand, the cycles and the manner open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanToolRows {
  /** `useTool` working with a `hammer`. */
  export const toolHammer = HumanActionRow.of("toolHammer", useTool, {
    tool: "hammer",
  });

  /** `useTool` working with a `saw`. */
  export const toolSaw = HumanActionRow.of("toolSaw", useTool, { tool: "saw" });

  /** `useTool` working with a `stir`. */
  export const toolStir = HumanActionRow.of("toolStir", useTool, {
    tool: "stir",
  });

  /** `useTool` working with a `screwdriver`. */
  export const toolScrewdriver = HumanActionRow.of("toolScrewdriver", useTool, {
    tool: "screwdriver",
  });
}
