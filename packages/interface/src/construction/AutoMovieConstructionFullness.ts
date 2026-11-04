import type { IAutoMovieConstructionGirth } from "./IAutoMovieConstructionGirth";
import type { IAutoMovieConstructionShoulder } from "./IAutoMovieConstructionShoulder";
import type { IAutoMovieConstructionTop } from "./IAutoMovieConstructionTop";

/**
 * What owns how full a part's section is between its four touches, discriminated on `type`.
 *
 * Fullness is each quarter's conic shoulder `r`: the share along the quarter's diagonal from the chord between its two touch points to the box's corner where the section crosses, `sqrt(2) - 1` the ellipse, toward 0 the chord and toward 1 the corner (Liming's conic lofting). The owner is the taut-tape girth (`girth`), a stated shoulder per station (`shoulder`), or the part's top view, each quarter's shoulder at its key stations (`top`).
 *
 * @evidence contracts/common.md#principled-implementation One conic shoulder per quarter fixes the section inside its box; the girth fixes one shoulder because the taut-tape perimeter rises monotonically with it, so breadth, depth and girth hold together.
 * @evidence contracts/common.md#clear-and-simple-design Three owners over one shoulder quantity cover a tube with a tape, a stated fullness law and a part with a third view, without a fourth parallel mechanism.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagonals are never an owner; a girth outside the box's reach is reported with the reach's end shape, never scaled into it.
 * @evidence contracts/common.md#meaningful-documentation Defines the shoulder, its ellipse value and its ends, and each owner's meaning.
 */
export type AutoMovieConstructionFullness = IAutoMovieConstructionGirth | IAutoMovieConstructionShoulder | IAutoMovieConstructionTop;
