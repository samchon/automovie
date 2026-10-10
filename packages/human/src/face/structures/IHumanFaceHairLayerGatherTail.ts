import type { IHumanFaceHairLayerGatherSpread } from "./IHumanFaceHairLayerGatherSpread";

/**
 * Free-tail styling after a connected lock reaches its shared scalp tie.
 * Direction uses the neutral head frame; omitted spread supplies no target
 * cross-section or spread transition.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerGatherTail {
  /** Nonzero dimensionless direction in the head frame. */
  direction: [number, number, number];

  /** Optional metre-space cross-section target and transition reach. */
  spread?: IHumanFaceHairLayerGatherSpread;
}
