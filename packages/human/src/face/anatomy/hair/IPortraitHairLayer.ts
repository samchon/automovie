import { IPortraitHairShape } from "./IPortraitHairShape";

/**
 * An independently authored static groom layer. Density, guides, pigment mask
 * and normals belong to this profile, not to another layer or a camera angle.
 * Layer names are author-owned identities, not built-in hairstyle selectors.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates inner coverage and outer locks into independently owned surface populations.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Gives each additional hair layer a complete profile and unique identity.
 * @author Samchon
 */
export interface IPortraitHairLayer {
  /** Nonblank identity, unique among additional layers, including empty ones. */
  id: string;
  /** Complete guide and finish profile; empty cards emit neither mesh nor material. */
  profile: IPortraitHairShape;
}
