import type { IAutoMovieHumanBodyLandmarkDistance } from "./IAutoMovieHumanBodyLandmarkDistance";
import type { IAutoMovieHumanBodyLevelSection } from "./IAutoMovieHumanBodyLevelSection";
import type { IAutoMovieHumanBodySkinExtent } from "./IAutoMovieHumanBodySkinExtent";
import type { IAutoMovieHumanBodyStationSection } from "./IAutoMovieHumanBodyStationSection";

/**
 * A measurement rule the body basis evaluates on its shaped surface.
 *
 * Rules are data so the measuring code holds no anatomy: each one names the
 * landmarks that place it and the way a value is read. A `girth` cuts the
 * surface with planes along the segment from `from` to `to` at the fractions
 * `range` covers, perpendicular to the segment (or horizontal when `horizontal`
 * is set, which is what ISO 7250-1 asks of trunk girths), keeps the closed
 * section loop nearest the segment point, and reports the largest or smallest
 * tape girth found: the perimeter of the loop's convex hull, which bridges
 * the concavities a tape bridges (the gluteal cleft, the inframammary fold)
 * as ISO 8559-1 and ANSUR girths are taken. A girth placed at a skin
 * landmark instead (`level`, a vertex of the basis surface such as the
 * nipple for the bust) has the one plane through that vertex, so the girth
 * follows the landmark wherever the shape moves it. A `distance` is the straight distance between two
 * landmarks. A `breadth` is the X extent of the
 * section loop found by a girth rule, which is how a front-chest width is read
 * on a mesh that has no chest-corner landmarks. An `extent` is the caliper
 * reading between the extreme skin points of a region of dominantly weighted
 * bones, along or across a horizontal landmark axis, such as a foot's length
 * or breadth, whose extremes move with the shape.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyMeasurement =
  | IAutoMovieHumanBodyStationSection
  | IAutoMovieHumanBodyLevelSection
  | IAutoMovieHumanBodyLandmarkDistance
  | IAutoMovieHumanBodySkinExtent;
