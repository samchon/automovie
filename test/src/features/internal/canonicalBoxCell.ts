import type { IAutoMovieConvexSpaceCell, IAutoMovieVector3 } from "@automovie/interface";

/** The six half-spaces cutting one axis-aligned box out of world space.
 *
 * Create the six authored half-spaces of an axis-aligned box. Constructing or locating this fixture alone is not a product behavior proof; its consumers own assertions. The inequalities x<=max.x and -x<=-min.x, with their y/z counterparts, define the coordinate interval independently of product vertex or volume queries.
 *
 * Consumers own inside/outside/boundary points, singleton cells and unions; inverted bounds are not repaired or admitted by this input builder. This synchronous portable internal declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const canonicalBoxCell: (id: string, min: IAutoMovieVector3, max: IAutoMovieVector3) => IAutoMovieConvexSpaceCell = (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    { normal: { x: 1, y: 0, z: 0 }, offset: max.x },
    { normal: { x: -1, y: 0, z: 0 }, offset: -min.x },
    { normal: { x: 0, y: 1, z: 0 }, offset: max.y },
    { normal: { x: 0, y: -1, z: 0 }, offset: -min.y },
    { normal: { x: 0, y: 0, z: 1 }, offset: max.z },
    { normal: { x: 0, y: 0, z: -1 }, offset: -min.z },
  ],
});
