import type { IHumanSourceIncisorRelation } from "./IHumanSourceIncisorRelation.ts";
import type { IHumanSourceOcclusionToothReading } from "./IHumanSourceOcclusionToothReading.ts";
import type { IHumanSourceOralPairReading } from "./IHumanSourceOralPairReading.ts";

/**
 * Exact represented-source predicates and numerical feature gaps of one candidate.
 *
 * @author Samchon
 */
export interface IHumanSourcePosteriorOcclusionEvaluation {
  /** Forty-eight paired full-crown width/depth/height scales, in the problem's order. */
  scales: number[];

  /** Sum of squared relative source changes, counting each paired parameter once. */
  objective: number;

  /** Every antagonist pair with an inside vertex or triangle crossing. */
  overlaps: IHumanSourceOralPairReading[];

  /** Squared negative signed-distance readings used only for search ordering, square metres. */
  penetrationSquaredMetres: number;

  /** Full-surface gaps for all ten posterior lower crowns. */
  posteriorContacts: IHumanSourceOcclusionToothReading[];

  /** Full-surface gaps for all six anterior/canine lower crowns. */
  anteriorClearances: IHumanSourceOcclusionToothReading[];

  /** Gap/overlap-interval excess used only for search ordering, square metres. */
  excessSquaredMetres: number;

  /** Central-incisor relations on the candidate in the frozen frame. */
  incisors: IHumanSourceIncisorRelation;

  /** True only when every original source geometric predicate and authored interval passes. */
  feasible: boolean;
}
