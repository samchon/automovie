/**
 * What one pattern of a drawn cell resolved to: the role it plays in the request, the pattern as written, and the paths it matched, so the record shows whether each selection, label, colour and focus matched what was meant.
 *
 * `.agents/skills/visual-debugging/capture.md` asks a reader to confirm from the record that each selection matched what was meant, because an empty selection draws a still with no defect in it. A pattern takes the subtree under every path it matches, so only the topmost matched paths are listed, with the count of every path matched beneath them; the record lists names, never geometry, and grows with the number of distinct subtrees a pattern reaches.
 *
 * @evidence contracts/development/design.md#principled-representation A pattern's role, its text and the identity paths it reached, in the scene's order: the inputs of the selection and their outcome, enough to tell a mistyped pattern from a meant one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Written by `resolveAutoMovieCapturePatterns` on the draw page, carried by the draw result and the capture drawing, and read in the record. The roles are the request's pattern-bearing members and a view's focus.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Paths beneath a listed path are counted, not listed, so a pattern such as `**` costs one entry, not one per object.
 * @evidence contracts/development/common.md#meaningful-documentation States what is listed, why, the bound on its size and who writes and reads it.
 */
export interface IAutoMovieCaptureResolution {
  /** Which part of the request the pattern belongs to: `parts`, `hide`, `label`, `color`, or the view's `focus`. */
  role: "parts" | "hide" | "label" | "color" | "focus";

  /** The pattern as the request writes it. */
  pattern: string;

  /** The topmost paths it matched, objects and marks alike, in the order the scene lists them; empty when it matched nothing. */
  paths: string[];

  /** Every path it matched, the listed ones and those beneath them. */
  count: number;
}
