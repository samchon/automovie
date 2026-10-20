import { AutoMovieTextureCoordinateSource } from "./AutoMovieTextureCoordinateSource";

/**
 * One renderer-resolved texture and its deterministic sampling intent.
 *
 * @evidence contracts/common.md#principled-implementation Asset identity, decoding colour space and UV sampling are declared independently; `validateTextureBinding` requires UV0 and the slot's colour space, finite transforms with nonzero scales, and supported wrap and filter literals.
 * @evidence contracts/common.md#clear-and-simple-design Transform and sampler each group one optional sampling concern next to the asset citation; physical UV units are a separate optional declaration consumed by texture-scale validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No image dimensions or asset name imply UV units; omitting coordinateSource makes no scale claim, and requesting another UV set is refused because this mesh representation carries only UV0.
 * @evidence contracts/common.md#meaningful-documentation Describes asset ownership, decoding, UV0 and the packed-atlas exclusion with reopening conditions, coordinate-source omission, physical repeat formulas, and origin-based transform units.
 */
export interface IAutoMovieTextureReference {
  /** Project asset id. */
  asset: string;

  /**
   * UV set index. Generated automovie meshes that emit texture coordinates provide set zero and no other.
   *
   * The supported mesh representation carries UV0 only; a second coordinate set is not inherently a packed atlas. Packed-atlas authoring and multiple UV sets remain excluded by this contract. Reopening requires an authorable layout rule and a supported artifact/consumer path for that layout, rather than selecting an unavailable channel here.
   *
   * The current runtime admits only zero, including imported appearances.
   */
  texCoord: number;

  /**
   * What one unit of the addressed UV set means. Omission preserves legacy raw UV sampling without making a new claim about the set's unit or extent.
   *
   * Declare `"surface-metres"` for an atlas-bearing procedural surface, which is what the geometry kernel emits and what most generated members carry; omitting the field there leaves the unit unstated rather than defaulted. Declare `"normalized"` for a lattice surface, a module prototype, or an imported set whose selected UV layout is known to span `[0, 1]`. Declare `"source-uv"` when an imported set keeps its arbitrary authored layout; importing a mesh does not normalize that layout by itself. `transform.scale` is read against whichever source this names, and the three cannot be told apart from the material record without it.
   */
  coordinateSource?: AutoMovieTextureCoordinateSource;

  /** How stored texels must be decoded before shading. */
  colorSpace: "srgb" | "linear";

  /**
   * Optional UV transform applied around the origin, in texture turns.
   *
   * `scale` is turns of the image per unit of the addressed coordinate source, so it is `1 / tile` against `"surface-metres"` and `extent / tile` against `"normalized"`. A `"source-uv"` set has no general physical-scale formula; read its source layout or adoption receipt. Read {@link coordinateSource} before authoring it.
   */
  transform?: {
    /** Finite image-turn offset applied after rotation and scale. */
    offset: { x: number; y: number };

    /** Finite nonzero image turns per coordinate unit; negative mirrors. */
    scale: { x: number; y: number };

    /** Finite counterclockwise rotation in degrees about the UV origin. */
    rotationDeg: number;
  };

  /** Optional texture filtering and wrap policy. */
  sampler?: {
    /** Addressing beyond the horizontal unit interval. */
    wrapS: "clamp" | "repeat" | "mirror";

    /** Addressing beyond the vertical unit interval. */
    wrapT: "clamp" | "repeat" | "mirror";

    /** Filtering when the image occupies fewer pixels than its source. */
    minFilter:
      | "nearest"
      | "linear"
      | "nearestMipmapLinear"
      | "linearMipmapLinear";

    /** Filtering when source texels are enlarged. */
    magFilter: "nearest" | "linear";
  };
}
