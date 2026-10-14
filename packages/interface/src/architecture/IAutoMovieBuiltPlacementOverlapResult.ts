import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic box-level answer for two named building bodies.
 *
 * Element operands use static CPU part boxes or their origin fallback; populations use one compact envelope. The strict endpoint predicate excludes exterior face contact for ordered boxes but can accept a zero-width plane or origin point strictly inside another box. This pair query therefore differs from the sweep's positive shared-volume policy.
 *
 * @evidence contracts/common.md#principled-implementation Any part-box pair passing `propBoundsOverlap` yields overlapping. Static AABB/prototype proxies can include empty mesh/member gaps and exclude deformation or external geometry; binary64 transforms and degenerate endpoint semantics prevent treating separate as a universal exact rendered-geometry certificate. This query computes no intersection volume.
 * @evidence contracts/common.md#clear-and-simple-design A three-way status, the unresolved sides, and both bases cover what a caller needs to read a verdict, and no shared volume is computed because the named-pair query answers only whether the bodies meet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved operand yields `unresolved` and names its side instead of throwing or reading as `separate`, and both bases are narrowed to body bases because neither operand can be a surface.
 * @evidence contracts/common.md#meaningful-documentation States operand boxing, exterior contact versus internal degenerate-box behavior, the pair/sweep distinction, static numerical limits, missing-side reporting and nullable bases.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapResult {
  /**
   * `overlapping` when some part-box pair passes strict endpoint inequalities on every axis, including an internal degenerate point/plane; `separate` when none passes, and `unresolved` when either locator cannot be resolved. A reported point has a basis and is resolved despite zero volume.
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
