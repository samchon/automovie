import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic broad-phase answer for two named building bodies.
 *
 * An element operand is tested as its drawn part boxes, or as its resolved box
 * when it draws one part or none; a population is tested as its one placement
 * envelope. Boxes that only touch on a face do not overlap.
 *
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapResult {
  /** Whether the resolved operands share positive volume. */
  status: "overlapping" | "separate" | "unresolved";

  /** Unresolved operands, empty when overlap was measured. */
  unresolved: ("left" | "right")[];

  /** Left operand's measurement basis, or null when unresolved. */
  leftBasis: AutoMovieBuiltPlacementBasis | null;

  /** Right operand's measurement basis, or null when unresolved. */
  rightBasis: AutoMovieBuiltPlacementBasis | null;
}
