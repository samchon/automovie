import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/** Prepared source and measured length, before inspection-only observations. */
export type IAutoMovieSource = Pick<
  IAutoMovieViewSection.ISection,
  "box" | "shoulders" | "guides" | "conics" | "girth"
>;
