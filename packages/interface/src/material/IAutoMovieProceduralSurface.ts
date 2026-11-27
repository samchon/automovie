import type { IAutoMoviePatternTextureTransform } from "../architecture/IAutoMoviePatternTextureTransform";
import type { IAutoMovieColor } from "../color/IAutoMovieColor";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A surface whose colour, roughness and relief are generated in code from a
 * seed: a solid texture, evaluated at a point in space rather than read from an
 * image (Peachey 1985, "Solid texturing of complex surfaces", SIGGRAPH).
 *
 * Every kind computes one pattern value `v` within [0, 1] at the sample point.
 * Base colour and roughness interpolate linearly from the first to the second
 * entry of {@link colors} and {@link roughness} by `v`, and the surface height is
 * `v × relief`, which the renderer turns into a normal perturbation (Blinn
 * 1978, "Simulation of wrinkled surfaces", SIGGRAPH). Lattice values come from
 * the PCG3D integer hash of the seed and the cell (Jarzynski and Olano 2020,
 * "Hash functions for GPU rendering", JCGT 9(3)), so the engine's CPU reference
 * `sampleProceduralSurfaceImplementation` and the renderer's fragment shader compute
 * the same values.
 *
 * Without {@link piece} the sample point is the object-space position in metres,
 * so no UVs are needed; a skinned mesh samples its bind-pose position, and the
 * pattern moves with the skin. With `piece` the sample point is in the
 * surface-pattern sheet's own space, as
 * {@link IAutoMovieProceduralSurface.IPiece} states.
 *
 * Engine model admission refuses it together with `baseColorTexture` or
 * `metallicRoughnessTexture`, which would state the same channels, and owns
 * every range stated below.
 */
export interface IAutoMovieProceduralSurface {
  /**
   * The pattern generator:
   *
   * - `"plaster"` and `"clay"`: four octaves of gradient noise (Perlin 2002,
   *   "Improving noise", SIGGRAPH), lacunarity 2 and gain 0.5, at `scale`;
   * - `"stone"`: the cellular `F2 − F1` distance (Worley 1996, "A cellular
   *   texture basis function", SIGGRAPH) over cubes of side `scale`, zero on
   *   the joints between stones, mixed three to one with the same noise;
   * - `"wood"`: rings by distance from the `axis` line through the sampling
   *   origin, `scale` apart, displaced by noise of amplitude `0.3 × scale`;
   * - `"fabric"`: a plain weave of warp threads along `axis` and weft threads
   *   across it, `scale` apart, each thread a squared-sine profile that passes
   *   over and under by thread parity, with a colour jitter per thread;
   * - `"brushedMetal"`: the same four-octave noise stretched 100 times along
   *   `axis`, so its streaks are `scale` long.
   */
  kind: "wood" | "stone" | "plaster" | "clay" | "fabric" | "brushedMetal";

  /** Pattern seed, a safe integer within [0, 2³² − 1]. */
  seed: number;

  /**
   * The kind's feature size in metres, finite and above zero: ring spacing for
   * wood, stone cell size, blotch size for plaster and clay, thread spacing for
   * fabric and streak length for brushed metal.
   */
  scale: number;

  /** Linear base colours at pattern values zero and one. */
  colors: [IAutoMovieColor, IAutoMovieColor];

  /** Roughness at pattern values zero and one, each within [0, 1]. */
  roughness: IAutoMovieProceduralSurface.IRoughness;

  /** Bump height in metres at pattern value one, finite and at least zero. */
  relief: number;

  /**
   * The grain, warp or brushing direction in the sampling space, nonzero and
   * finite; it need not be unit length. Required for `"wood"`, `"fabric"` and
   * `"brushedMetal"`, and refused for the other kinds.
   *
   * Fabric's weft runs along `normalize(axis × Z)`, the sampling space's third
   * axis, or along `normalize(axis × X)` when `axis` lies within 1e-6 of Z, so
   * a cloth modelled in its object XY plane, or a pattern piece, weaves in its
   * own plane.
   */
  axis?: IAutoMovieVector3;

  /**
   * Present only on the material of one occurrence of a surface pattern laid by
   * `generateSurfacePattern`: how that piece cuts the sheet. Absent,
   * the surface samples object space.
   */
  piece?: IAutoMovieProceduralSurface.IPiece;
}

/** A laid piece's place on the surface's sheet. */
export namespace IAutoMovieProceduralSurface {
  /** Roughness endpoints of the generated pattern. */
  export interface IRoughness {
    /** Roughness at pattern value zero. */
    atZero: number;

    /** Roughness at pattern value one. */
    atOne: number;
  }

  /**
   * One laid piece's place on the material's sheet.
   *
   * The sample point is in sheet space, in metres: the piece's UV0 mapped by
   * {@link transform} into sheet turns (`diag(scale) · R(−rotationDeg) · uv +
   * offset`), times {@link tile}, with the third coordinate the point's offset
   * along its own surface normal, `dot(position, normal)` in object space at
   * bind pose, which is constant over a flat face. `axis` is read in that space
   * (sheet U, sheet V, normal), so a grain follows the piece's `grainDeg`
   * through the transform. Every part citing such a material must be a mesh
   * with UV0.
   *
   * Under `"module"` every piece is centred on the same sheet point, so the
   * sample point also adds a sheet-space offset hashed from the seed and the
   * occurrence `transform.id`: pieces differ as separately made tiles do, and
   * one occurrence always samples the same values. Under `"face"` nothing is
   * added, because the transforms already place every piece on one sheet
   * measured from its origin, and the pattern runs on across joints.
   */
  export interface IPiece {
    /**
     * The pattern's sheet kind, as `IAutoMoviePatternTextureSheet.kind` states
     * it.
     */
    sheet: "module" | "face";

    /**
     * Metres one sheet turn covers along its own U and V, each finite and above
     * zero.
     */
    tile: IPieceTile;

    /**
     * The transform `patternTextureTransforms` returned for this
     * occurrence, filled in exactly as an image binding's `transform` is.
     */
    transform: IAutoMoviePatternTextureTransform;
  }

  /** The tile object of {@link IPiece}. */
  export type IPieceTile = {
    /** Metres per turn along sheet U. */
    u: number;

    /** Metres per turn along sheet V. */
    v: number;
  };
}
