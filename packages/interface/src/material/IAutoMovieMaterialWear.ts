import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * How a used object's surface has worn: paint chipped off its convex edges and
 * grime gathered in its concave creases, placed per fragment by the distance to
 * the mesh's feature edges (`measureFeatureEdges`), so a face
 * subdivided into many triangles wears like one quad.
 *
 * Each layer's weight at a fragment is `smoothstep(1 − amount, 1, clamp(1 − d /
 * width, 0, 1)) × n`, with `d` the distance to the nearest feature edge of the
 * layer's sign and `n` the procedural surfaces' four-octave noise mapped to [0,
 * 1], at the bind-pose point over `width` under `seed`, so wear breaks up
 * instead of tracing every edge evenly. The layer then mixes the base colour
 * and roughness toward its own, edge first and grime second. A skinned mesh
 * measures and samples its bind pose, so wear stays on the same surface points
 * as it bends. Contact darkening between separate objects belongs to ambient
 * occlusion, not here.
 *
 * Engine model admission refuses a record without either layer and every range
 * stated below.
 */
export interface IAutoMovieMaterialWear {
  /** Seed of the breakup noise, a safe integer within [0, 2³² − 1]. */
  seed: number;

  /** Wear along convex feature edges. */
  edge?: IAutoMovieMaterialWear.ILayer;

  /** Grime in concave feature creases. */
  grime?: IAutoMovieMaterialWear.ILayer;
}

/** The layer both wear kinds state. */
export namespace IAutoMovieMaterialWear {
  /** One wear layer's look and extent. */
  export interface ILayer {
    /** Linear colour the layer shows at full weight. */
    color: IAutoMovieColor;

    /** Roughness the layer shows at full weight, within [0, 1]. */
    roughness: number;

    /**
     * Distance from the feature edge in metres at which the layer fades out,
     * finite and above zero.
     */
    width: number;

    /**
     * How much of the band the layer covers, within (0, 1]: one reaches the
     * band's outer limit, smaller values keep it near the edge.
     */
    amount: number;
  }
}
