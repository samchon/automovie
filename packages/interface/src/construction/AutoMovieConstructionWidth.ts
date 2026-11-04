import type { IAutoMovieConstructionChord } from "./IAutoMovieConstructionChord";
import type { IAutoMovieConstructionChordTable } from "./IAutoMovieConstructionChordTable";
import type { IAutoMovieConstructionFoldWidth } from "./IAutoMovieConstructionFoldWidth";
import type { IAutoMovieConstructionStationWidth } from "./IAutoMovieConstructionStationWidth";

/**
 * Where a join's rail stands on one surface, discriminated on `type`: a chord from the curve, constant (`chord`), varying round the loop (`chords`) or set by the fold the surfaces make (`fold`), or for the part under the phase parameter one fixed station (`station`).
 *
 * A chord is the straight distance in metres from the curve's point to the rail's point, which lies on the surface in the normal section through the curve point on the kept side; the widths are laws of the parts' own sizes, so a blend widens with the parts it joins.
 *
 * @evidence contracts/common.md#principled-implementation A chord measured in metres of the surface, not in chart units, makes a width law read the same on any parameterisation.
 * @evidence contracts/common.md#clear-and-simple-design Four closed kinds cover a constant width, a width law round the loop, a width from the fold's angle and a part whose first own section is its rail.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A width past the rail's radius of curvature folds the rail and is reported, never shrunk to fit.
 * @evidence contracts/common.md#meaningful-documentation Defines the chord, the rail's place, the kinds and the fold's failure effect.
 */
export type AutoMovieConstructionWidth =
  | IAutoMovieConstructionChord
  | IAutoMovieConstructionChordTable
  | IAutoMovieConstructionFoldWidth
  | IAutoMovieConstructionStationWidth;
