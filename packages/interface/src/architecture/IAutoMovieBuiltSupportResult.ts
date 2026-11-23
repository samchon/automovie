import type { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic answer to one authored building-support claim.
 *
 * Both bases travel with the verdict, so a caller can tell a `floating` answer
 * about a drawn underside from one about an `element-origin-point` subject,
 * whose gap is measured from its stated origin.
 */
export interface IAutoMovieBuiltSupportResult {
  /**
   * The classified relationship between the subject and its named support.
   *
   * `resting` when the gap's magnitude is within the tolerance, `floating`
   * above it, `sunk` below it, `not-over-support` when no probe of the subject
   * lies over the support face, `suspended` for a resolved suspension claim,
   * and `unresolved` when either side cannot be resolved.
   */
  status:
    | "resting"
    | "floating"
    | "sunk"
    | "not-over-support"
    | "suspended"
    | "unresolved";

  /**
   * Signed underside gap in metres for bearing, or null with no retained probe,
   * suspension or an unresolved side. For usable finite arithmetic, positive
   * means above the sampled face and negative means below it; the deepest
   * retained probe answers. A nonfinite computed value is not converted to null
   * or unresolved by this classifier.
   */
  gap: number | null;

  /** Unresolved inputs, empty for every conclusive result. */
  unresolved: ("subject" | "support")[];

  /** Subject measurement basis, or null when its bounds cannot be resolved. */
  subjectBasis: Exclude<
    AutoMovieBuiltPlacementBasis,
    "surface-height-rule"
  > | null;

  /**
   * Support measurement basis, or null when its face cannot be resolved;
   * `surface-height-rule` for a surface support.
   */
  supportBasis: AutoMovieBuiltPlacementBasis | null;
}
