import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic answer to one authored building-support claim.
 *
 * Both bases travel with the verdict, so a caller can tell a `floating` answer
 * about a drawn underside from one about an `element-origin-point` subject,
 * whose gap is measured from its stated origin.
 *
 * @evidence contracts/common.md#principled-implementation The gap is the minimum over retained footprint/ring-corner probes. With a finite gap, absolute value within tolerance is resting, positive is floating and otherwise sunk; no probes means not-over-support. Finite, usable height/box arithmetic is a premise: the current classifier does not independently reject NaN gaps, whose failed comparisons fall through to sunk. Thin edge overlap and deeper points between probes can remain unseen.
 * @evidence contracts/common.md#clear-and-simple-design One status union plus the numeric gap, the unresolved sides, and the two bases, with each null documented by the case that produces it, so no second result shape exists for suspension or unresolved claims.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved side yields `unresolved` with a null gap rather than a guessed default, and the subject basis is narrowed to body bases because only a support can be a surface.
 * @evidence contracts/common.md#meaningful-documentation States when each status is chosen, the gap's metre unit, sign, deepest-probe rule and null cases, when `unresolved` is empty, and when each basis is null.
 * @author Samchon
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
   * Signed underside gap in metres for bearing, or null with no retained probe, suspension or an unresolved side. For usable finite arithmetic, positive means above the sampled face and negative means below it; the deepest retained probe answers. A nonfinite computed value is not converted to null or unresolved by this classifier.
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
