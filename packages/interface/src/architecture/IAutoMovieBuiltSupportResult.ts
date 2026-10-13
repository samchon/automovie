import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic answer to one authored building-support claim.
 *
 * Both bases travel with the verdict, so a caller can tell a `floating` answer
 * about a drawn underside from one about an `element-origin-point` subject,
 * whose gap is measured from its stated origin.
 *
 * @evidence contracts/common.md#principled-implementation The gap is the minimum of underside-minus-face heights over two-sided footprint probes, and the status compares its absolute value with the tolerance; the premise is axis-aligned boxes and a face read only at the probe points, so relief between probes is not seen.
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
   * Signed underside gap in metres for a resolved bearing relation, or null
   * when no probe lies over the support, the relation is suspended, or either
   * side is unresolved. Positive means the underside stands above the support
   * face and negative that it sinks into it; the deepest probe answers.
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
