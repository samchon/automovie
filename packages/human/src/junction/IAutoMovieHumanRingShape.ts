import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";

/**
 * The one boundary both parts of a junction site share: the ring's frame and directions and where each ring vertex lies.
 *
 * `positions[k]` is cage vertex `k` of the ring in layout order, `frame.origin + radii[k] · directions[k]`. Both parts of the site place their ring vertices exactly there, so the junction welds coincident points and neither part is moved.
 *
 * The positions are control points, solved so the limit surface, not the cage, has the site's girth: in a regular neighbourhood the limit section along the ring is the cubic B-spline of the ring after each vertex is averaged with the loops either side by (1, 4, 1) / 6, and the radii are chosen so that curve meets the site's section on every ray and measures `girth`, provided the radial offsets of the two neighbouring loops from the ring cancel. A part keeps its own share of that by placing its first loop off the ring at the ring's own radii from the site axis, a straight continuation, and fits its girths on the loops beyond; the junction check measures the joined girth and refuses more than a millimetre off.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanRingShape extends IAutoMovieHumanRingLayout {
  /** Girth of the limit surface along the ring, millimetres: the site's measured girth, or its section's own perimeter where none is measured. */
  girth: number;

  /** Distance of each ring vertex from the origin along its direction, millimetres, layout order. */
  radii: number[];

  /** Each ring vertex, model frame, millimetres, layout order. */
  positions: IAutoMovieVector3[];
}
