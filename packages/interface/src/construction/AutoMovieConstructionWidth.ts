import type { IAutoMovieConstructionChord } from "./IAutoMovieConstructionChord";
import type { IAutoMovieConstructionChordTable } from "./IAutoMovieConstructionChordTable";
import type { IAutoMovieConstructionCurvatureWidth } from "./IAutoMovieConstructionCurvatureWidth";
import type { IAutoMovieConstructionFoldWidth } from "./IAutoMovieConstructionFoldWidth";
import type { IAutoMovieConstructionStationWidth } from "./IAutoMovieConstructionStationWidth";

/**
 * Where a join's rail stands on one surface, discriminated on `type`: a chord from the curve, constant (`chord`), varying round the loop (`chords`), set by the fold the surfaces make (`fold`) or by the surface's own curvature across the curve (`curvature`), or for the part under the phase parameter one fixed station (`station`).
 *
 * A chord is the straight distance in metres from the curve's point to the rail's point, which lies on the surface in the normal section through the curve point on the kept side; the widths are laws of the parts' own sizes and curvatures, so a blend widens with the parts it joins and stays inside the radius it turns on.
 *
 * @evidence contracts/development/design.md#principled-representation A chord measured in metres of the surface, not in chart units, makes a width law read the same on any parameterisation; a chord past the surface's radius of curvature across the curve turns the rail past the surface's side, which no scale removes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five closed kinds cover a constant width, a width law round the loop, a width from the fold's angle, a width within the surface's radius of curvature and a part whose first own section is its rail.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A width past the rail's radius of curvature folds the blend and is reported, never shrunk to fit; the `curvature` kind states the width as a share of that radius from the start.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the chord, the rail's place, the kinds and the fold's failure effect.
 */
export type AutoMovieConstructionWidth =
  | IAutoMovieConstructionChord
  | IAutoMovieConstructionChordTable
  | IAutoMovieConstructionCurvatureWidth
  | IAutoMovieConstructionFoldWidth
  | IAutoMovieConstructionStationWidth;
