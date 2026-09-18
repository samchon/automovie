import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic broad-phase answer for two named building bodies.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Lets project source ask whether a placed element or population intrudes on one named neighbour.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Carries positive-volume bounds overlap, unresolved sides, and each operand's measurement basis.
 * @author Samchon
 */
export interface IAutoMovieBuiltPlacementOverlapResult {
  /** Whether the resolved world boxes overlap by positive volume. */
  status: "overlapping" | "separate" | "unresolved";
  /** Unresolved operands, empty when overlap was measured. */
  unresolved: ("left" | "right")[];
  /** Left operand's measurement basis, or null when unresolved. */
  leftBasis: AutoMovieBuiltPlacementBasis | null;
  /** Right operand's measurement basis, or null when unresolved. */
  rightBasis: AutoMovieBuiltPlacementBasis | null;
}
