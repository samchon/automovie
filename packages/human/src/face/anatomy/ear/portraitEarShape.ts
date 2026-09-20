import { IPortraitEarShape } from "./IPortraitEarShape";

/**
 * Provisional ear placement and dimensions, replaceable by the caller's profile.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies a reusable provisional pinna profile without embedding a particular head surface.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Provides default placement, outline scales, posterior projection and anterior embedding consumed by the temporal-surface attachment builder.
 */
export const portraitEarShape: IPortraitEarShape = {
  centerY: 8,
  centerZ: -45,
  heightScale: 1.15,
  depthScale: 0.75,
  projection: 12,
  embedding: 1.2,
};
