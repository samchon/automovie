import { IPortraitHairShape } from "./IPortraitHairShape";

/**
 * An independently authored static groom layer. Density, guides, pigment mask and normals belong to this profile, not to another layer or a camera angle. Layer names are author-owned identities, not built-in hairstyle selectors.
 *
 * @evidence contracts/common.md#principled-implementation A nonblank author-owned identity pairs with one independently specified legacy static groom profile.
 * @evidence contracts/common.md#clear-and-simple-design Layer separation keeps guide, density and finish controls independent without a preset hairstyle registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This profile retains legacy guide authoring and is not claimed as a biological measurement or camera-derived geometry.
 * @evidence contracts/common.md#meaningful-documentation Empty cards produce no mesh or material and additional-layer ids remain unique.
 * @evidenceExclude contracts/performance.md#efficient-algorithms buildPortraitHairGroom owns layer construction and tessellation work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each layer delegates to the same card and material owners without sharing mutable appearance profiles.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns profile arrays; generated layer resources are held by the resulting face construction.
 *
 * @author Samchon
 */
export interface IPortraitHairLayer {
  /** Nonblank identity, unique among additional layers, including empty ones. */
  id: string;

  /** Complete guide and finish profile; empty cards emit neither mesh nor material. */
  profile: IPortraitHairShape;
}
