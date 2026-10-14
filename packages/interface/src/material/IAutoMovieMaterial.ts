import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { AutoMovieTextureBinding } from "./AutoMovieTextureBinding";
import { IAutoMovieMaterialOverlay } from "./IAutoMovieMaterialOverlay";

/**
 * A physically-based (PBR) surface material: the "what it's made of and how it catches light" of a character or object surface.
 *
 * The base fields follow glTF's metallic-roughness model, and the optional transmission, volume, clearcoat, anisotropy, sheen and specular fields follow the corresponding glTF `KHR_materials_*` extensions; the viewer builds a `MeshPhysicalMaterial` from them, with optional subsurface, detail-normal and overlay shader approximations that have no glTF counterpart. Engine model admission owns coefficient domains, while direct viewer callers must supply admitted values.
 *
 * Texture images are referenced by id: an image the enclosing model carries, else a project asset. Their decoding and GPU lifetime belong to the renderer's texture resolver, rather than this authoring record.
 *
 * Reference: glTF 2.0 `pbrMetallicRoughness` (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials); Khronos `KHR_materials_anisotropy`, `KHR_materials_sheen`, `KHR_materials_specular` and `KHR_materials_volume`.
 *
 * @evidence contracts/common.md#principled-implementation Metallic, roughness and linear colour describe the base reflectance model and the anisotropy, sheen, specular and volume lobes restate their glTF extension parameters; `validateModel` admits their domains, and `buildMaterial` maps the admitted fields to physical material parameters and separately composes the optional shader effects.
 * @evidence contracts/common.md#clear-and-simple-design One optical record owns reflectance, alpha, lobes and texture slots, each multi-parameter lobe grouped in one optional record; physical density and construction layers use separate substance and assembly types, and image bytes stay behind image or asset references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finish name selects a numerical preset; explicit alpha mode overrides opacity-derived defaults. Shader approximations make no measured subsurface-response claim, and lobe omission keeps the renderer's neutral value rather than a guessed finish.
 * @evidence contracts/common.md#meaningful-documentation States coefficient bounds, linear colour, texture slot colour and channel roles, alpha defaults, normal-map composition, lobe directions and omission defaults, metre-valued transmission and subsurface properties, image resolution order and resolver ownership.
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
   * Emissive RGB multiplier, or `null`. The viewer uses white when null and an emissive image resolves, otherwise its non-emitting default; this adds surface radiance without creating a scene light.
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

  /** Emissive texture multiplied by authored emissive RGB, or white when that field is null. */
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

  /**
   * Linear texture whose green channel, `[0, 1]`, multiplies {@link thickness} per texel, so one surface can vary in volume thickness. Like `thickness`, it changes the render only where `transmission` is above zero.
   */
  thicknessTexture?: AutoMovieTextureBinding | null;

  /** Fractional clear-coat lobe strength, `[0, 1]`. */
  clearcoat?: number;

  /**
   * Anisotropic specular lobe, which stretches highlights along one surface direction. The direction lies in the tangent frame of texture coordinates UV0, so a surface needs UV0 for it; when a normal map is bound, the viewer derives that frame from the normal map's transformed coordinates. Omitted, the specular lobe is isotropic.
   */
  anisotropy?: {
    /** Strength in `[0, 1]`; zero is isotropic. */
    strength: number;

    /**
     * Finite direction in degrees, counterclockwise from the +u texture direction toward +v; 90 runs the highlight streak along +v.
     */
    rotationDeg: number;

    /**
     * Linear texture whose red and green channels encode a tangent-space direction mapped from `[0, 1]` to `[-1, 1]` and then rotated by `rotationDeg`, and whose blue channel multiplies `strength`; null, the direction is `rotationDeg` everywhere.
     */
    texture: AutoMovieTextureBinding | null;
  };

  /**
   * Sheen lobe: a microfibre layer that adds back-scattered light at grazing angles. Omitted, there is no sheen.
   */
  sheen?: {
    /** Linear sheen tint at full intensity; alpha is ignored. Black is no sheen. */
    color: IAutoMovieColor;

    /** Sheen roughness in `[0, 1]`, from a narrow grazing rim to a broad soft glow. */
    roughness: number;
  };

  /**
   * Strength of the dielectric specular reflection in `[0, 1]`, scaling the Fresnel reflectance that {@link ior} implies; omitted, one. Metals ignore it.
   */
  specularIntensity?: number;

  /**
   * Nonnegative finite RGB radius parameters in metres for the viewer's direct-diffuse subsurface approximation. Screen-space normal curvature and a shared Gaussian-response lookup modify diffuse lighting; this does not transport light through a measured medium or establish an observed appearance. Omission keeps the ordinary physical material response; glTF has no counterpart.
   */
  subsurfaceRadius?: { r: number; g: number; b: number };

  /**
   * Optional second tangent-space normal map, blended over `normalTexture` (whiteout: the two maps' slopes add), usually a fine relief tiled with its own transform over a coarser map bound once across the surface. glTF has one normal slot, so this map has no glTF counterpart. Without a `normalTexture` it stands in as the normal map.
   */
  detailNormalTexture?: AutoMovieTextureBinding | null;

  /**
   * Strength of `detailNormalTexture`'s slopes, a nonnegative finite factor; omitted, one.
   */
  detailNormalScale?: number;

  /**
   * At most four ordered surface layers, each sampling a colour image and optionally a normal image. Colour/roughness and replacement normals use image coverage; multiply normals follow the separate formula on `IAutoMovieMaterialOverlay`. glTF has no counterpart. Omitted or empty, no overlay shader is installed.
   */
  overlays?: IAutoMovieMaterialOverlay[];
}
