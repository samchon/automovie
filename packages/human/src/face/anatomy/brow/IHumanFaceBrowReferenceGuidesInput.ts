import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * Native reference band and numerical shaft traits shared by source preparation
 * and runtime. These source positions are not a person's sculpting resource.
 *
 * @evidence contracts/common.md#principled-implementation Same native band and reference geometry accompany the unchanged admitted shaft traits.
 * @evidence contracts/common.md#clear-and-simple-design One input names reference geometry, source binding, count and profile without another guide definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies original native addressing rather than a personal replacement curve.
 * @evidence contracts/common.md#meaningful-documentation States source ownership, head frame and original profile units.
 * @evidence contracts/modeling.md#spatial-conventions Reference coordinates are head-frame metres; the profile retains its millimetre and fraction meanings.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The shaft mesh owner defines displayed parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries the existing profile rather than defining authoring channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Supplies input geometry and emits no mesh.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The registration and walker owners construct native joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled brow owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The profile and source binding owners retain anatomical qualifications.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing profile admission owns parameter bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Existing source and admitted traits enter through their owning interfaces.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowReferenceGuidesInput {
  /** Complete shape-only reference skin positions in head-frame metres. */
  positions: readonly number[];

  /** Source-native upper and lower implantation boundaries and side. */
  binding: IPortraitEyebrowBinding;

  /** Requested count before end-fade thinning. */
  count: number;

  /** Shaft traits with their existing millimetre and fraction meanings. */
  profile: IPortraitEyebrowProfile;
}
