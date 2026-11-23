import type { IAutoMovieConstructionChord } from "./IAutoMovieConstructionChord";
import type { IAutoMovieConstructionChordTable } from "./IAutoMovieConstructionChordTable";
import type { IAutoMovieConstructionCurvatureWidth } from "./IAutoMovieConstructionCurvatureWidth";
import type { IAutoMovieConstructionFoldWidth } from "./IAutoMovieConstructionFoldWidth";
import type { IAutoMovieConstructionStationWidth } from "./IAutoMovieConstructionStationWidth";

/**
 * Where a join's rail stands on one surface, discriminated on `type`: a chord
 * from the curve, constant (`chord`), varying round the loop (`chords`), set by
 * the fold the surfaces make (`fold`) or by the surface's own curvature across
 * the curve and the curve's turn toward the rail (`curvature`), or for the part
 * under the phase parameter one fixed station (`station`).
 *
 * A chord is the straight distance in metres from the curve's point to the
 * rail's point, which lies on the surface in the normal section through the
 * curve point on the kept side; the widths are laws of the parts' own sizes and
 * curvatures, so a blend widens with the parts it joins and stays inside the
 * radius it turns on.
 */
export type IAutoMovieConstructionWidth =
  | IAutoMovieConstructionChord
  | IAutoMovieConstructionChordTable
  | IAutoMovieConstructionCurvatureWidth
  | IAutoMovieConstructionFoldWidth
  | IAutoMovieConstructionStationWidth;
