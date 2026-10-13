import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { AutoMovieTextureBinding } from "./AutoMovieTextureBinding";
import { IAutoMovieMaterialOverlay } from "./IAutoMovieMaterialOverlay";

/**
 * A physically-based (PBR) surface material: the "what it's made of and how it
 * catches light" of a character or object surface.
 *
 * Fields mirror the glTF 2.0 metallic-roughness model so a generated material
 * maps 1:1 onto `three.js` `MeshStandardMaterial`, VRM/MToon inputs, and glTF
 * export. Every coefficient is a scalar documented to `[0, 1]` or an
 * {@link IAutoMovieColor}; the whole material is a small numeric record, which
 * is exactly why an LLM can author or tweak it ("make it more metallic",
 * "rougher", "warmer base color") through structured output; the engine
 * range-checks the coefficients.
 *
 * Texture _maps_ (image-based base color / normal / roughness) are referenced
 * by id rather than embedded: the pixel payload is an asset the engine
 * resolves, not something the LLM emits.
 *
 * Reference: glTF 2.0 `pbrMetallicRoughness`
 * (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials).
 *
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

  /** Surface roughness, `[0, 1]`. `0` = mirror-smooth, `1` = fully diffuse. */
  roughness: number;

  /**
   * Emissive (self-illumination) color, or `null` for a non-emitting surface.
   * Distinct from a black base color: this surface _adds_ light.
   */
  emissive: IAutoMovieColor | null;

  /**
   * Opacity, `[0, 1]`. `1` = opaque. Below `1` the engine enables alpha
   * blending. (Mirrors `baseColor.a`; kept explicit for the common author
   * gesture "make it 50% transparent".)
   */
  opacity: number;

  /**
   * Id of an optional base-color texture map. `null` = flat `baseColor` only.
   * The image is an engine-resolved asset, never LLM-emitted pixels.
   */
  baseColorTexture: AutoMovieTextureBinding | null;

  /** GlTF-style combined metallic (B) and roughness (G) texture id. */
  metallicRoughnessTexture?: AutoMovieTextureBinding | null;

  /** Tangent-space normal-map texture id. */
  normalTexture?: AutoMovieTextureBinding | null;

  /**
   * Finite multiplier applied to the normal map's XY channels; negative flips
   * them.
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
   * Explicit alpha handling. Omitted derives legacy blend behavior from
   * opacity.
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
   * Distance light travels under the surface before it leaves again, per
   * primary, in metres: the diffuse mean free path of a translucent tissue
   * such as skin (red farthest). A renderer blurs the diffuse response over
   * the surface by it, so a lit side bleeds soft and red into the shadowed
   * one where the surface curves within that distance and a flat surface
   * stays Lambertian. glTF has no ratified extension for it, so an exported
   * asset omits it. Omitted, the diffuse response is Lambertian.
   */
  subsurfaceRadius?: { r: number; g: number; b: number };

  /**
   * Optional second tangent-space normal map, blended over `normalTexture`
   * (whiteout: the two maps' slopes add), usually a fine relief tiled with its
   * own transform over a coarser map bound once across the surface. glTF has
   * one normal slot, so an exported asset keeps `normalTexture` and omits this
   * one. Without a `normalTexture` it stands in as the normal map.
   */
  detailNormalTexture?: AutoMovieTextureBinding | null;

  /**
   * Strength of `detailNormalTexture`'s slopes, a nonnegative finite factor;
   * omitted, one.
   */
  detailNormalScale?: number;

  /**
   * Surface layers composited over this material in order, each where its
   * own image covers (veins under a skin, the nail plates at its
   * fingertips), at most four: a renderer samples up to two images for each
   * on top of the material's own. glTF has no ratified extension for them, so
   * an exported asset omits them. Omitted or empty, the material shows alone.
   */
  overlays?: IAutoMovieMaterialOverlay[];
}
