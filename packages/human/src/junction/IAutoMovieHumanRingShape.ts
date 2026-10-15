import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";

/**
 * The one boundary both parts of a junction site share: the ring's frame and directions and where each ring vertex lies.
 *
 * `positions[k]` is cage vertex `k` of the ring in layout order, `frame.origin + radii[k] · directions[k]`. Both parts of the site place their ring vertices exactly there, so the junction welds coincident points and neither part is moved. The positions are control points: the limit surface through the joined ring lies slightly inside them, by an amount the neighbouring rows of both parts decide, so a part fits its own girths away from the ring, never by moving a ring vertex.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanRingShape extends IAutoMovieHumanRingLayout {
  /** Distance of each ring vertex from the origin along its direction, millimetres, layout order. */
  radii: number[];

  /** Each ring vertex, model frame, millimetres, layout order. */
  positions: IAutoMovieVector3[];
}
