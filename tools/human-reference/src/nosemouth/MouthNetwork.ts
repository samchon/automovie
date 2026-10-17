import type { fitCurve } from "../fit/fitCurve.ts";
import type { MouthRibbonObservations } from "./MouthRibbonObservations.ts";

/**
 * Source-bound cubic mouth ribbons and a common exterior collar.
 * A polygon approximation certificate describes observed curve reproduction;
 * it proves neither the surface between ribbons nor clinical feature identity.
 *
 * @evidence contracts/common.md#principled-implementation Separate outer and pocket curves preserve the observed sheet order and source collision distinction.
 * @evidence contracts/common.md#clear-and-simple-design Generation and diagnostic overlays consume the same cubic definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This result carries no preselected body coefficients or accepted anatomy claim.
 * @evidence contracts/common.md#meaningful-documentation States the certificate scope and distinguishes source replay from corrected neutral skin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface MouthNetwork {
  /** Version of the generated curve network, independent from a source vendor. */
  schema: "human-reference-mouth-network-v1";

  /** Original measured frame, source hashes, sections and unresolved gaps. */
  observations: MouthRibbonObservations;

  /** Cubics reproduce each source polyline within this dimensional bound. */
  toleranceMm: number;

  /** Contact sheets remain separate even where their evaluated positions coincide. */
  ribbons: {
    id: string;
    xMm: number;
    cubic: ReturnType<typeof fitCurve>;
    upperOuter: ReturnType<typeof fitCurve>;
    lowerOuter: ReturnType<typeof fitCurve>;
    oralCavity?: ReturnType<typeof fitCurve>;
    split: {
      upperFraction: number;
      lowerFraction: number;
      sourceCollision: boolean;
    };
  }[];

  /** Exact shared corner endpoints give positional continuity, not transverse smoothness. */
  collar: {
    top: ReturnType<typeof fitCurve>;
    bottom: ReturnType<typeof fitCurve>;
    right: ReturnType<typeof fitCurve>;
    left: ReturnType<typeof fitCurve>;
  };

  /** Explicit limits survive transport into the local patch consumer. */
  limits: string[];
}
