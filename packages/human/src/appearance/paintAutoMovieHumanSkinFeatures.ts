import { encodeAutoMoviePng } from "@automovie/engine";
import {
  IAutoMovieImage,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHumanSkinDomain } from "../junction/IAutoMovieHumanSkinDomain";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanSkinFeatureField } from "./AutoMovieHumanSkinFeatureField";
import { AutoMovieHumanSkinTextureAtlas } from "./AutoMovieHumanSkinTextureAtlas";
import { pigmentAutoMovieHumanSkin } from "./pigmentAutoMovieHumanSkin";
import { writeAutoMovieHumanSkinNormal } from "./writeAutoMovieHumanSkinNormal";

/**
 * Bake seeded physical marks to the actual skin's UV atlas, not its vertex colors.
 *
 * Each texel intersects its incident actual UV triangles before integrating the continuous compact-polynomial rest-mm field over those physical pieces. Equal-radius nearest-site cells and radial boundary integrals include tiny sphere sections without a fixed point-sampling grid. The field has no LOD or vertex identity; a different approximation of a curved surface can change the inverse map, so byte equality across curved LODs is not promised. The fixed 2048² atlas can leave millimetre marks below two texels in stretched regions. Bounded candidate preparation can refuse a triangle, which is counted rather than replaced by a centre approximation. Sizes use actual positions, not the atlas's nominal 1.8 m density. Image quantization/filtering can soften or elongate marks; counts do not certify isotropic displayed footprints or complete seam coverage.
 *
 * Texels outside every triangle use two-texel edge padding with clamped, normalized barycentric point queries. This extension is not an integrated physical footprint. Separate chart aliases therefore sample the same physical field at their shared edge; finite texel/filter error remains. The padding bound is the maximum crossed edge distance, not Euclidean distance to a corner. Overlapping interiors mapping more than 0.1 mm apart at any actual overlap polygon vertex become transparent rather than choosing an unrelated skin sheet. Eligibility disagreement also refuses an overlapping pixel. Role metadata comes from the source cage, not UV boxes. Zero-area UV triangles have no inverse and remain unsupported. Counts expose these limitations; no alternate chart or surface is invented.
 *
 * Freckles use one RGBA replacement-color layer. Acne uses a separate RGBA color and RGB normal layer so freckles cannot flatten the existing relief. At 2048², raw images occupy at most 44 MiB; the stored-deflate PNG encoder emits about 58.7 MiB base64. Call-owned triangle/bucket/filter records and PNG intermediates add temporary storage. The Human instance caches at most one feature state per assembly. No image or normal is emitted for disabled marks.
 */
export function paintAutoMovieHumanSkinFeatures(props: {
  parts: readonly IAutoMovieModelPart[];
  skin: IAutoMovieHumanAppearance.ISkin;
  pigmentation: IAutoMovieHumanIdentity.IPigmentation;
  /** Atlas resolution, 16 to 2048 texels per edge; the Human composition uses 2048. */
  size?: number;
  /** Exact coarse-face roles for these emitted rest triangles; omitted retains the legacy uniform engineering field. */
  domains?: ReadonlyMap<string, IAutoMovieHumanSkinDomain>;
}): paintAutoMovieHumanSkinFeatures.IOutput | null {
  const field: AutoMovieHumanSkinFeatureField =
    new AutoMovieHumanSkinFeatureField(props.skin);
  if (!field.active) return null;
  const size: number = props.size ?? 2048;
  if (!Number.isInteger(size) || size < 16 || size > 2048)
    throw new Error(
      "Skin feature atlas edge must be an integer from 16 to 2048",
    );
  const frecklePixels: Uint8Array | null = field.pigmented
    ? new Uint8Array(size * size * 4)
    : null;
  const acnePixels: Uint8Array | null = field.papules
    ? new Uint8Array(size * size * 4)
    : null;
  const normals: Uint8Array | null = field.papules
    ? new Uint8Array(size * size * 3)
    : null;
  if (normals !== null)
    for (let i: number = 0; i < size * size; ++i) {
      normals[3 * i] = 128;
      normals[3 * i + 1] = 128;
      normals[3 * i + 2] = 255;
    }
  const atlas: AutoMovieHumanSkinTextureAtlas =
    new AutoMovieHumanSkinTextureAtlas({
      parts: props.parts,
      size,
      field,
      domains: props.domains,
    });
  const stats: paintAutoMovieHumanSkinFeatures.IOutput["stats"] = {
    edge: size,
    sampledTexels: 0,
    ambiguousTexels: 0,
    degenerateUvTriangles: 0,
    unsupportedTexels: 0,
    excludedTexels: 0,
    paddingTexels: 0,
  };
  const freckle: IAutoMovieVector3 = asVector(
    pigmentAutoMovieHumanSkin({
      ...props.pigmentation,
      melanin: Math.min(0.5, props.pigmentation.melanin * 2 + 0.02),
    }),
  );
  const inflamed: IAutoMovieVector3 = asVector(
    pigmentAutoMovieHumanSkin({
      ...props.pigmentation,
      haemoglobin: Math.min(0.32, props.pigmentation.haemoglobin * 6 + 0.02),
    }),
  );
  const freckleRgb: number[] = [freckle.x, freckle.y, freckle.z].map(srgb);
  const acneRgb: number[] = [inflamed.x, inflamed.y, inflamed.z].map(srgb);
  for (let pixel: number = 0; pixel < size * size; ++pixel) {
    // Constant unpremultiplied pigment also fills transparent pixels, preventing
    // dark filtering fringes without changing alpha or inventing surface coverage.
    for (let c: number = 0; c < 3; ++c) {
      if (frecklePixels !== null) frecklePixels[4 * pixel + c] = freckleRgb[c]!;
      if (acnePixels !== null) acnePixels[4 * pixel + c] = acneRgb[c]!;
    }
    const footprint: AutoMovieHumanSkinTextureAtlas.IOutput | null =
      atlas.sample(pixel % size, Math.floor(pixel / size));
    if (footprint === null) continue;
    if (footprint.ambiguous) {
      ++stats.ambiguousTexels;
      continue;
    }
    ++stats.sampledTexels;
    const triangle: AutoMovieHumanSkinTextureAtlas.ITriangle =
      footprint.triangle;
    const sample: ReturnType<AutoMovieHumanSkinFeatureField["sample"]> =
      footprint.value;
    if (frecklePixels !== null)
      frecklePixels[4 * pixel + 3] = Math.round(255 * sample.freckles);
    if (acnePixels !== null)
      acnePixels[4 * pixel + 3] = Math.round(255 * sample.acne);
    if (normals !== null && sample.acne > 0)
      writeAutoMovieHumanSkinNormal(
        normals,
        pixel,
        triangle.p,
        triangle.uv,
        sample.gradient,
      );
  }
  Object.assign(stats, atlas.stats);
  const layers: paintAutoMovieHumanSkinFeatures.ILayer[] = [];
  if (frecklePixels !== null)
    layers.push({
      feature: "freckles",
      color: image(frecklePixels, size, 4, "freckles"),
      normal: null,
    });
  if (acnePixels !== null)
    layers.push({
      feature: "acne",
      color: image(acnePixels, size, 4, "acne"),
      normal: image(normals!, size, 3, "normal"),
    });
  return { layers, stats };
}

/** Output images and observed UV-inverse coverage of the actual skin mesh. */
export namespace paintAutoMovieHumanSkinFeatures {
  /**
   * Generated assets are owned by their Human instance and returned models.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Freckle color first, then acne color/normal, each with independent coverage. */
    layers: ILayer[];
    /** Diagnostics, not an assertion that the atlas is injective or every mark is resolved. */
    stats: {
      /** Atlas edge in texels. */
      edge: number;
      /** Texels owned by one supported triangle or its padding. */
      sampledTexels: number;
      /** Overlapping texels suppressed because physical inverse positions disagree. */
      ambiguousTexels: number;
      /** Zero-area UV triangles omitted because they have no inverse. */
      degenerateUvTriangles: number;
      /** Texels suppressed because an incident triangle exceeded the bounded field preparation. */
      unsupportedTexels: number;
      /** Texels whose source roles exclude ordinary pits and marks. */
      excludedTexels: number;
      /** Boundary-extension pixels, outside actual intersected triangle pieces. */
      paddingTexels: number;
    };
  }
  /**
   * One independently covered feature; freckles never contain a normal map.
   *
   * @author Samchon
   */
  export interface ILayer {
    /** Physical field whose coverage this image carries. */
    feature: "freckles" | "acne";
    /** sRGB replacement pigment with this feature's alpha. */
    color: IAutoMovieImage;
    /** Linear papule slopes for acne, otherwise null. */
    normal: IAutoMovieImage | null;
  }
}

/** Linear RGB as a three-coordinate value. */
function asVector(c: { r: number; g: number; b: number }): IAutoMovieVector3 {
  return { x: c.r, y: c.g, z: c.b };
}

/** Linear albedo encoded for an sRGB texture binding. */
function srgb(v: number): number {
  return Math.round(
    255 *
      Math.min(
        1,
        Math.max(
          0,
          v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055,
        ),
      ),
  );
}

/** Deterministic pixel fingerprint for local asset identity, not an integrity certificate. */
function image(
  pixels: Uint8Array,
  size: number,
  channels: 3 | 4,
  role: string,
): IAutoMovieImage {
  let a: number = 0x811c9dc5;
  let b: number = 0x9e3779b9;
  for (const value of pixels) {
    a = Math.imul(a ^ value, 0x01000193);
    b = Math.imul(b ^ value, 0x85ebca6b);
  }
  return {
    id: `human.skin.features.${role}.${size}.${(a >>> 0).toString(16)}.${(b >>> 0).toString(16)}`,
    mimeType: "image/png",
    data: encodeAutoMoviePng({ width: size, height: size, channels, pixels }),
  };
}
