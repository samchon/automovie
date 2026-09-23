import type { IPortraitColourField } from "../anatomy/skin/structures/IPortraitColourField";
import type { IAutoMovieHumanFaceHair } from "./IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceIris } from "./IAutoMovieHumanFaceIris";

/**
 * Compact edits against a separately supplied immutable facial basis.
 * Zero is the source neutral; omitted channels are zero. Negative controls use
 * their authored negative endpoint, not an extrapolated positive endpoint.
 * The document contains no photo, mesh cache, renderer or Blender dependency.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Separates compact shape and performance edits from reusable source geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Binds deterministic edits to one exact basis revision and preserves material overrides independently.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisDocument {
  /** Stable identity of this authored face. */
  id: string;

  /** Display name, independent of basis selection. */
  name: string;

  /** Must equal the supplied basis identity; no implicit migration occurs. */
  basis: string;

  /** Persistent identity edits against the basis's named shape endpoints. */
  shape: Record<string, number>;

  /** Current transient expression; omitted channels mean source neutral. */
  expression: Record<string, number>;

  /**
   * Optional numerical scalp populations on the basis's shared growth domains.
   * Omission, null or empty layers is bald. Every lock is generated from fields;
   * no identity-dependent groom resource or personal guide coordinates resolve.
   */
  hair?: IAutoMovieHumanFaceHair | null;

  /**
   * Numerical pigmentation by basis surface identity. Field centres and radii
   * use metres in the immutable neutral basis, so shape and expression carry
   * the same tissue colours. Omission, null and an empty record add no fields.
   * These compact envelopes carry no image or per-vertex colour array.
   * Global colour and roughness remain in materials. A surface's fields apply
   * across its material regions with their common vertex correspondence.
   */
  skin?: Record<string, IPortraitColourField[]> | null;

  /**
   * Optional iris pigmentation of each articulated eye, painted by one shared
   * rule into the basis eye texture's anatomical iris disc. Omission and null
   * keep the basis texture byte for byte.
   */
  iris?: IAutoMovieHumanFaceIris | null;

  /** Optional linear RGB and roughness, each in [0,1], by existing material ID. */
  materials?: Record<
    string,
    { color?: { r: number; g: number; b: number }; roughness?: number }
  >;
}
