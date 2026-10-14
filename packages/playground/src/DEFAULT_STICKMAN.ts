import type { IStickmanParams } from "./IStickmanParams";

/**
 * Conventional starting metre dimensions shared by the stick figure, knight and boxer examples. Values are authored demonstration choices without measured population or final-height qualification; head/feet primitive extents contribute beyond the skeleton's origin offsets.
 *
 * Consumers copy or read this sixteen-field record and the canonical builder owns geometry/constraint assembly. Reusing initial data does not cache a numerical model, validate physiology or supply missing Human source assets.
 *
 * One module-level record lives with the page or model-export process and owns no GPU handle, worker or timer. Returned models and later uploaded resources retain their ordinary page/viewer owners.
 *
 * @author Samchon
 */
export const DEFAULT_STICKMAN: IStickmanParams = {
  hipHeight: 0.92,
  pelvisToSpine: 0.2,
  spineToChest: 0.22,
  chestToNeck: 0.15,
  neckLength: 0.035,
  shoulderHalf: 0.17,
  shoulderRise: 0.14,
  hipHalf: 0.05,
  upperArm: 0.29,
  lowerArm: 0.26,
  thigh: 0.47,
  shin: 0.45,
  rodRadius: 0.045,
  torsoRadius: 0.07,
  fistRadius: 0.055,
  headRadius: 0.12,
};
