import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/**
 * Prepared source and measured length, before inspection-only observations.
 *
 * @evidence contracts/development/design.md#principled-representation The picked fields retain the actual support box, shoulders, guide jets, conic source and measured girth in mm without display observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewSection owns ISection; ViewSectionConic and ViewSectionRange reuse its source subset for candidate measurement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The subset preserves conic admission failures and measured girth semantics rather than implying a successful target solve.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies retained source fields and their separation from inspection samples.
 */
export type IAutoMovieSource = Pick<
  IAutoMovieViewSection.ISection,
  "box" | "shoulders" | "guides" | "conics" | "girth"
>;
