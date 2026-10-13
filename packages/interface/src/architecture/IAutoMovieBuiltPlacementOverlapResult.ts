import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic box-level answer for two named building bodies.
 *
 * An element operand is tested as its drawn part boxes, or as its resolved box
 * when it draws no part; a population is tested as its one placement envelope.
 * Boxes that only touch on a face do not overlap, and a body measured as an
 * `element-origin-point` has no volume, so it never overlaps anything.
 *
 * @evidence contracts/common.md#principled-implementation Overlap is any part-box pair passing the strict axis-aligned interval test on all three axes, so face contact is not intrusion; the premise is that part boxes bound the drawn solids, so a `separate` answer is exact and an `overlapping` one may come from empty box corners.
 * @evidence contracts/common.md#clear-and-simple-design A three-way status, the unresolved sides, and both bases cover what a caller needs to read a verdict, and no shared volume is computed because the named-pair query answers only whether the bodies meet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved operand yields `unresolved` and names its side instead of throwing or reading as `separate`, and both bases are narrowed to body bases because neither operand can be a surface.
 * @evidence contracts/common.md#meaningful-documentation States how each operand kind is boxed, that face contact and point bodies never overlap, what each status means, when `unresolved` is empty, and when a basis is null.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapResult {
  /**
   * `overlapping` when some part box of one operand shares positive volume
   * with some part box of the other, `separate` when none does, and
   * `unresolved` when either operand has no extent.
   */
  status: "overlapping" | "separate" | "unresolved";

  /** Unresolved operands, empty when overlap was measured. */
  unresolved: ("left" | "right")[];

  /** Left operand's measurement basis, or null when it is unresolved. */
  leftBasis: Exclude<
    AutoMovieBuiltPlacementBasis,
    "surface-height-rule"
  > | null;

  /** Right operand's measurement basis, or null when it is unresolved. */
  rightBasis: Exclude<
    AutoMovieBuiltPlacementBasis,
    "surface-height-rule"
  > | null;
}
