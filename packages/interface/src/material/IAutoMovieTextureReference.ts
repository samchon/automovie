import { AutoMovieTextureCoordinateSource } from "./AutoMovieTextureCoordinateSource";

/** One renderer-resolved texture and its deterministic sampling intent. */
export interface IAutoMovieTextureReference {
  /** Project asset id. */
  asset: string;

  /**
   * UV set index. Generated automovie meshes that emit texture coordinates
   * provide set zero and no other.
   *
   * A second set would be a packed atlas: the promise that a named `[0, 1]`
   * island of one image belongs to one named part of one surface. That is a
   * decided exclusion rather than pending work. Packing islands is a layout
   * decision no authoring agent can state in natural language, the layout only
   * becomes useful once it leaves the engine as an artifact an image model can
   * paint into, which is the scene export the product does not have, and
   * painted-to-fit artwork is finished-look work the repaint lane owns rather
   * than blocking-pass work. It reopens when an authoring agent can drive a
   * packing rule and the product has somewhere for the layout to go.
   *
   * A set index above zero therefore addresses geometry this repository did not
   * generate: an ingested mesh that arrived carrying its own extra set.
   */
  texCoord: number;

  /**
   * What one unit of the addressed UV set means. Omission preserves legacy raw
   * UV sampling without making a new claim about the set's unit or extent.
   *
   * Declare `"surface-metres"` for an atlas-bearing procedural surface, which
   * is what the geometry kernel emits and what most generated members carry;
   * omitting the field there leaves the unit unstated rather than defaulted.
   * Declare `"normalized"` for a lattice surface, a module prototype, or an
   * imported set whose selected UV layout is known to span `[0, 1]`. Declare
   * `"source-uv"` when an imported set keeps its arbitrary authored layout;
   * importing a mesh does not normalize that layout by itself.
   * `transform.scale` is read against whichever source this names, and the
   * three cannot be told apart from the material record without it.
   */
  coordinateSource?: AutoMovieTextureCoordinateSource;

  /** How stored texels must be decoded before shading. */
  colorSpace: "srgb" | "linear";

  /**
   * Optional UV transform applied around the origin, in texture turns.
   *
   * `scale` is turns of the image per unit of the addressed coordinate source,
   * so it is `1 / tile` against `"surface-metres"` and `extent / tile` against
   * `"normalized"`. A `"source-uv"` set has no general physical-scale formula;
   * read its source layout or adoption receipt. Read {@link coordinateSource}
   * before authoring it.
   */
  transform?: {
    offset: { x: number; y: number };
    scale: { x: number; y: number };
    rotationDeg: number;
  };

  /** Optional texture filtering and wrap policy. */
  sampler?: {
    wrapS: "clamp" | "repeat" | "mirror";
    wrapT: "clamp" | "repeat" | "mirror";
    minFilter:
      | "nearest"
      | "linear"
      | "nearestMipmapLinear"
      | "linearMipmapLinear";
    magFilter: "nearest" | "linear";
  };
}
