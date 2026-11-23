import type { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic box-level answer for two named building bodies.
 *
 * Element operands use static CPU part boxes or their origin fallback;
 * populations use one compact envelope. The strict endpoint predicate excludes
 * exterior face contact for ordered boxes but can accept a zero-width plane or
 * origin point strictly inside another box. This pair query therefore differs
 * from the sweep's positive shared-volume policy.
 */
export interface IAutoMovieBuiltPlacementOverlapResult {
  /**
   * `overlapping` when some part-box pair passes strict endpoint inequalities
   * on every axis, including an internal degenerate point/plane; `separate`
   * when none passes, and `unresolved` when either locator cannot be resolved.
   * A reported point has a basis and is resolved despite zero volume.
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
