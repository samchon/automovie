import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { AutoMovieTextureBinding } from "./AutoMovieTextureBinding";
import { IAutoMovieMaterialOverlay } from "./IAutoMovieMaterialOverlay";

/**
 * A physically-based (PBR) surface material: the "what it's made of and how it catches light" of a character or object surface.
 *
 * The base fields follow glTF's metallic-roughness model; the viewer builds a `MeshPhysicalMaterial` and adds the documented subsurface, detail-normal and overlay effects. glTF export omits those three extensions. The engine validates coefficient domains before rendering.
 *
 * Texture images are referenced assets. Their payload and GPU lifetime belong to the renderer's texture resolver, rather than this authoring record.
 *
 * Reference: glTF 2.0 `pbrMetallicRoughness` (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials).
 *
 * @evidence contracts/common.md#principled-implementation Metallic, roughness and linear colour describe the base reflectance model; `validateModel` admits their domains, and `buildMaterial` maps the admitted fields to physical material parameters and separately composes the optional shader effects.
 * @evidence contracts/common.md#clear-and-simple-design One optical record owns reflectance, alpha and texture slots; physical density and construction layers use separate substance and assembly types, and image bytes stay behind asset references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finish name selects a shader or numerical preset; explicit alpha mode overrides opacity-derived defaults, and unsupported glTF subsurface, detail-normal and overlay effects are documented as omitted rather than claimed as exported.
 * @evidence contracts/common.md#meaningful-documentation States coefficient bounds, linear colour, texture slot colour roles, alpha defaults, normal-map composition and metre-valued transmission and subsurface properties, including export omissions and resolver ownership.
 * @author Samchon
 */
export interface IAutoMovieMaterial {
  /** Stable id so meshes / scene nodes can cite this material. */
  id: string;

  /**
   * Human / LLM readable label (e.g. `"glossy red plastic"`). Null if unnamed.
   */
  name: string | null;

  /** Diffuse / albedo base color (linear). */
  baseColor: IAutoMovieColor;

  /** Metalness, `[0, 1]`. `0` = dielectric, `1` = metal. */
  metallic: number;

  /** PBR microfacet roughness in `[0, 1]`, from smooth to maximally rough; one does not remove the specular lobe. */
  roughness: number;

  /**
   * Emissive (self-illumination) color, or `null` for a non-emitting surface. Adds surface radiance without creating a scene light.
   */
  emissive: IAutoMovieColor | null;

  /**
   * Surface alpha in `[0, 1]`, independent of `baseColor.a` in the viewer. Without `alphaMode`, values below one select alpha blending.
   */
  opacity: number;

  /**
   * Id of an optional base-color texture map. `null` = flat `baseColor` only. The image is an engine-resolved asset, never LLM-emitted pixels.
   */
  baseColorTexture: AutoMovieTextureBinding | null;

  /** GlTF-style combined metallic (B) and roughness (G) texture id. */
  metallicRoughnessTexture?: AutoMovieTextureBinding | null;

  /** Tangent-space normal-map texture id. */
  normalTexture?: AutoMovieTextureBinding | null;

  /**
   * Finite multiplier applied to the normal map's XY channels; negative flips them.
   */
  normalScale?: number;

  /** Ambient-occlusion texture id. */
  occlusionTexture?: AutoMovieTextureBinding | null;

  /** Occlusion strength in `[0, 1]`. */
  occlusionStrength?: number;

  /** Emissive texture id multiplied by {@link emissive}. */
  emissiveTexture?: AutoMovieTextureBinding | null;

  /** Whether both sides of the surface are visible. */
  doubleSided?: boolean;

  /**
   * Explicit alpha handling. Omitted derives legacy blend behavior from opacity.
   */
  alphaMode?: "opaque" | "mask" | "blend";

  /** Alpha threshold used only by `mask`; defaults to 0.5. */
  alphaCutoff?: number;

  /** Fraction of light transmitted through a physical dielectric, `[0, 1]`. */
  transmission?: number;

  /** Index of refraction, finite and `>= 1`. */
  ior?: number;

  /** Non-negative transmission volume thickness in metres. */
  thickness?: number;

  /** Fractional clear-coat lobe strength, `[0, 1]`. */
  clearcoat?: number;

  /**
   * Distance light travels under the surface before it leaves again, per primary, in metres: the diffuse mean free path of a translucent tissue such as skin (red farthest). A renderer blurs the diffuse response over the surface by it, so a lit side bleeds soft and red into the shadowed one where the surface curves within that distance and a flat surface stays Lambertian. glTF has no ratified extension for it, so an exported asset omits it. Omitted, the diffuse response is Lambertian.
   */
  subsurfaceRadius?: { r: number; g: number; b: number };

  /**
   * Optional second tangent-space normal map, blended over `normalTexture` (whiteout: the two maps' slopes add), usually a fine relief tiled with its own transform over a coarser map bound once across the surface. glTF has one normal slot, so an exported asset keeps `normalTexture` and omits this one. Without a `normalTexture` it stands in as the normal map.
   */
  detailNormalTexture?: AutoMovieTextureBinding | null;

  /**
   * Strength of `detailNormalTexture`'s slopes, a nonnegative finite factor; omitted, one.
   */
  detailNormalScale?: number;

  /**
   * Surface layers composited over this material in order, each where its own image covers (veins under a skin, the nail plates at its fingertips), at most four: a renderer samples up to two images for each on top of the material's own. glTF has no ratified extension for them, so an exported asset omits them. Omitted or empty, the material shows alone.
   */
  overlays?: IAutoMovieMaterialOverlay[];
}
