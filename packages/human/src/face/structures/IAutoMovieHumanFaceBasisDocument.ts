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

  /**
   * Optional overrides by existing material ID: linear RGB `color` and
   * `roughness`, each in [0,1]. A material whose base-colour texture carries
   * fibre coverage in its alpha (a brow or lash card cut by a mask or
   * blended) also takes `pigment`, the fibres' linear RGB albedo in [0,1],
   * and `density`, a factor on that coverage in [0,4]; both are painted into
   * the texture by the shared fibre rule.
   */
  materials?: Record<
    string,
    {
      color?: { r: number; g: number; b: number };
      roughness?: number;
      pigment?: [number, number, number];
      density?: number;
    }
  >;
}
