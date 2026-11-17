import type { IAutoMovieMotionHumanInterruptRow } from "@automovie/interface";

/**
 * Companion data of {@link HumanInterruptRow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each list holds.
 * @evidence contracts/development/design.md#principled-representation Closed runtime lists are checked against the canonical kind and keep-element types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two lists a page and a test generator read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace HumanInterruptRow {
  /** The transitions a cut runs, as data. */
  export const KINDS = [
    "inertialize",
    "redirect",
    "phase",
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanInterruptRow["kind"]
  >[];

  /** What a transition may carry unchanged, as data. */
  export const KEEPS = [
    "stanceFoot",
    "guard",
    "grip",
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanInterruptRow["keep"]
  >[number][];
}
