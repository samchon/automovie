import type { IAutoMovieConstructionGirth } from "./IAutoMovieConstructionGirth";
import type { IAutoMovieConstructionShoulder } from "./IAutoMovieConstructionShoulder";
import type { IAutoMovieConstructionTop } from "./IAutoMovieConstructionTop";

/**
 * What owns how full a part's section is between its four touches,
 * discriminated on `type`.
 *
 * Fullness is each quarter's conic shoulder `r`: the share along the quarter's
 * diagonal from the chord between its two touch points to the box's corner
 * where the section crosses, `sqrt(2) - 1` the ellipse, toward 0 the chord and
 * toward 1 the corner (Liming's conic lofting). The owner is the taut-tape
 * girth (`girth`), a stated shoulder per station (`shoulder`), or the part's
 * top view, each quarter's shoulder at its key stations (`top`).
 */
export type IAutoMovieConstructionFullness =
  | IAutoMovieConstructionGirth
  | IAutoMovieConstructionShoulder
  | IAutoMovieConstructionTop;
