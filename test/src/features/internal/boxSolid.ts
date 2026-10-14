import type {
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";

/** An axis-aligned box as the intersection of its six half-spaces.
 *
 * boxSolid supplies the daylight shade and environment-context convex-ray cases through the compatibility barrel; its original initializer and API are preserved. Assertions belong to those consumers, so constructing this fixture alone is not a behavior proof.
 * The six inequalities x<=max.x, -x<=-min.x and their y/z counterparts independently define the authored axis-aligned box. Consumers derive face intersections from those coordinates; the builder supplies no sampled product output or proof of arbitrary convex-solid closure.
 * Caller-selected minima/maxima produce fresh plane records for shade and neighbouring-mass cases. Consumers own inside/outside/on-face, ray-direction, finite-distance and malformed-plane behavior; this fixture performs no admission itself.
 */
export const boxSolid: (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
) => { id: string; planes: IAutoMovieHalfSpacePlane[] } = (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): { id: string; planes: IAutoMovieHalfSpacePlane[] } => ({
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
