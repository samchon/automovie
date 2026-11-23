import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieGridSolidMeshSample } from "./IAutoMovieGridSolidMeshSample";
import type { IAutoMovieSolidMeshConstraints } from "./IAutoMovieSolidMeshConstraints";
import type { IAutoMovieSolidMeshPlan } from "./IAutoMovieSolidMeshPlan";

/** Face-local grid, source partition and provisional point catalogue. */
export interface IAutoMovieGridSolidMeshGrid {
  /** Existing global vertex count before any face write. */
  base: number;

  /** Face-specific charts, including foreign-owner shared source indices. */
  chart: Map<number, Readonly<AutoMovieVector2Tuple>>;

  /** New provisional IDs and their evaluated source points. */
  samples: Map<number, IAutoMovieGridSolidMeshSample>;

  /** Original indexed trim segments. */
  trim: IAutoMovieSolidMeshConstraints.ISegment[];

  /** Domain segments after authoritative-boundary precedence. */
  domain: IAutoMovieSolidMeshConstraints.ISegment[];

  /** Retained full cells' complete directed boundary incidence. */
  boundary: IAutoMovieSolidMeshConstraints.ISegment[];

  /** Retained full-cell triangles in positive native-chart order. */
  full: IAutoMovieSolidMeshPlan.ITriangle[];

  /**
   * Originally metric-kept sampling points not already part of a full
   * cell/domain.
   */
  interior: number[];

  /** Original kept source, independent of the sampling margin. */
  source: (u: number, v: number) => boolean;

  /** Original source minus already retained full cells. */
  residual: (u: number, v: number) => boolean;

  /**
   * Phase scale of the face's uniform metric, length units per radian: the mean
   * first fundamental form over the grid jets without its shear term,
   * `sqrt(mean G / mean E)` with `E = |S_u|^2` and `G = |S_v|^2`. It carries
   * the length unit, so a body in another unit legalizes alike.
   */
  metric: number;

  /**
   * A quadrilateral's own first fundamental form, as the map `(u, v) -> (u +
   * shear v, scale v)` under which its chart lengths are its skin's up to one
   * factor: the least-squares linear map `J` from its four chart points to
   * their skin points about their centroids, with `E = |J_u|^2`, `F = J_u .
   * J_v`, `G = |J_v|^2`, `shear = F / E` and `scale = sqrt(G / E - shear^2)`.
   * Residual legalization reads it, so a face whose metric changes across it is
   * made Delaunay in the metric each quadrilateral actually spans, not the
   * face's mean: beside the armscye's loop the trunk spans 231 mm a radian
   * where its mean is about half that, and triangles fair in the mean metric
   * stood 4 to 7 degrees thin on the skin and folded 135 degrees. Read instead
   * from the grid jets of the cell holding the centroid, a band's corner column
   * at f1's crotch fork, where the band's columns converge within one cell,
   * took the wrong diagonal and folded 63 degrees. Missing skin points, a
   * singular chart fit, or a nonfinite/nonpositive fitted metric use [0,
   * metric], the face mean.
   */
  local: (
    ids: readonly number[],
    charts: readonly Readonly<AutoMovieVector2Tuple>[],
  ) => [number, number];
}
