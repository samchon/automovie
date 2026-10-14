import type { IHumanFaceHairLayerGatherAnchor } from "./IHumanFaceHairLayerGatherAnchor";
import type { IHumanFaceHairLayerGatherTail } from "./IHumanFaceHairLayerGatherTail";

/**
 * Shared gathering operation of a connected metre/radian hair layer.
 * Angular attachment precedes the free-tail stage on every integrated lock.
 * This is the existing numerical representation, not the degree/mm trait API.
 *
 * @evidence contracts/common.md#principled-implementation A current-surface angular anchor supplies a shared gathering field; entering its positive-radius neighbourhood changes the integrated lock to the authored tail field.
 * @evidence contracts/common.md#clear-and-simple-design Anchor, approach strength and tail coefficients remain one layer operation; the gather-stage owner resolves the transition rather than storing personal station arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gathering requires full-root integration and refuses a lock that never reaches its tie; it does not shorten that lock into a completed hairstyle.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the current scalp ray, metre tie radius, dimensionless approach strength and post-entry tail.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This gathering description computes neither scalp geodesics nor tie-entry integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared operation record defines no gather-field result cache; the builder owns per-layer preparation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Anchor and tail values create no scalp index or lock history; actual gather readers belong to their owning build.
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
