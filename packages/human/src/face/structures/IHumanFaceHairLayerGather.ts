import type { IHumanFaceHairLayerGatherAnchor } from "./IHumanFaceHairLayerGatherAnchor";
import type { IHumanFaceHairLayerGatherTail } from "./IHumanFaceHairLayerGatherTail";

/**
 * Shared gathering operation of a connected metre/radian hair layer.
 * Angular attachment precedes the free-tail stage on every integrated lock.
 * This is the existing numerical representation, not the degree/mm trait API.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerGather {
  /** Ray attached to the current shared scalp. */
  anchor: IHumanFaceHairLayerGatherAnchor;

  /** Positive tie neighbourhood radius, metres. */
  radius: number;

  /** Attraction relative to the ordinary comb field, in (0,1]. */
  strength: number;

  /** Direction and optional cross-section after entering the tie. */
  tail: IHumanFaceHairLayerGatherTail;
}
