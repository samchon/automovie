import type { IAutoMovieMotionHumanInterruptRow } from "@automovie/interface";

/** Companion data of {@link HumanInterruptRow}. */
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
