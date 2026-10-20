import { IAutoMovieSubdivisionCage } from "../IAutoMovieSubdivisionCage";
import { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/**
 * A surface network sampled at one tier: a quad control cage ready for
 * `subdivideAutoMovieSurface`, with the surface coordinate of every face
 * corner, the per-patch grids and the named rings.
 *
 * Within a tier the cage's connectivity, UV layout and coordinates depend only
 * on the network's patch and count declarations, never on the shapes of its
 * sweeps and curves, so every input of one network yields the same topology
 * and only positions change. Every tier addresses the same coordinates,
 * `(patch, s, t)`, so a point bound on one tier is found on another by
 * `mapAutoMovieSurfaceTier`.
 *
 * @evidence contracts/common.md#principled-implementation Positions plus face-varying UVs make the standard subdivision cage, and the published `(patch, s, t)` corner coordinates are the shared chart that links tiers.
 * @evidence contracts/common.md#clear-and-simple-design The subdivision input is the engine's own cage record, so sampling adds only what tiers, rings and fitting need beside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Targets and pins are reported beside the fitted controls, so a caller can measure the fit rather than trust it.
 * @evidence contracts/common.md#meaningful-documentation States what stays fixed within a tier, what the coordinates are and how tiers are linked.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; sampling cost is answered on `sampleAutoMovieSurfaceNetwork`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its caller.
 */
export interface IAutoMovieSurfaceCage {
  /** The tier sampled. */
  tier: AutoMovieSurfaceTier;

  /** Control cage in metres, quads only, with face-varying UVs. */
  cage: Required<Pick<IAutoMovieSubdivisionCage, "uvs" | "uvFaces">> & {
    /** Packed control positions `[x, y, z, ...]`, metres. */
    positions: number[];

    /** Quads as four vertex indices, counterclockwise seen from outside. */
    faces: number[][];
  };

  /** Packed pre-inverse generating samples `[x, y, z, ...]`, metres, after girth adjustment and control pins: cell-averaged sweep samples, curve samples and blend controls. Only limitTargetMask rows are hard limit equalities; pinned entries are declared control positions, not geometric curve points, and held blend interiors retain their generating controls. */
  targets: number[];

  /** Whether each vertex is a pinned ring vertex, kept at its given position. */
  pinned: boolean[];

  /** Active limit equalities: false for control pins, blend controls and a sample made without fitting. */
  limitTargetMask: boolean[];

  /** Surface coordinate of each face corner, aligned with `cage.faces`. */
  corners: Array<
    [
      IAutoMovieSurfaceCoordinate,
      IAutoMovieSurfaceCoordinate,
      IAutoMovieSurfaceCoordinate,
      IAutoMovieSurfaceCoordinate,
    ]
  >;

  /** Each patch's grid, in the network's patch order. */
  patches: IAutoMovieSurfaceCage.IPatch[];

  /** Vertex indices of each named ring in loop order. */
  rings: Record<string, number[]>;

  /** Largest distance between a fitted vertex's limit point and its target, metres. */
  residual: number;
}
export namespace IAutoMovieSurfaceCage {
  /**
   * One patch's grid at the tier.
   *
   * @evidence contracts/common.md#principled-implementation A patch's grid is its row and column counts and its faces in row-major order, which is all the chart inversion needs; a band that is no grid says so and is inverted face by face.
   * @evidence contracts/common.md#clear-and-simple-design Three numbers and one index list per patch; the faces themselves live once in the cage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts are the tier's declared counts, never inferred from positions.
   * @evidence contracts/common.md#meaningful-documentation States the row-major face order and how face `(i, j)` is found.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export interface IPatch {
    /** The patch's name. */
    name: string;

    /** Faces along `s`; for a transition band, the finer ring's count. */
    columns: number;

    /** Faces along `t`, a transition band's rows included. */
    rows: number;

    /** Whether the faces form the grid below; a transition band's do not, and each face's corners carry its coordinates. */
    grid: boolean;

    /** Face indices; on a grid, row by row from `t` 0, each row from `s` 0, so face `(i, j)` is `faces[j * columns + i]`. */
    faces: number[];
  }
}
