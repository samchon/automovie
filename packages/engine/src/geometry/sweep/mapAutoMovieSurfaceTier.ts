import type {
  IAutoMovieMapSurfaceTier,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
} from "@automovie/interface";

import { locateAutoMovieSurfaceCoordinate } from "./locateAutoMovieSurfaceCoordinate";

/**
 * Carry a point bound to one tier's cage onto another tier of the same network.
 *
 * The point's face and local coordinates on the source tier give its surface
 * coordinate, the bilinear blend of the face's corner coordinates, which is
 * exact on a grid patch because every face spans an axis-aligned rectangle of
 * it, and on a transition band is the same bilinear map the locator inverts;
 * the target tier then locates that coordinate with
 * `locateAutoMovieSurfaceCoordinate`. Both tiers must come from the same
 * network, whose patch list is the shared chart.
 *
 * @param props.from The tier the point is bound to, only read.
 * @param props.to The tier to carry it to, only read.
 * @param props.at The point on `from`: a face index and quad-local coordinates
 *   in 0 to 1.
 * @returns The point on `to`, and its surface coordinate.
 * @throws Error when the face is out of range, the local coordinates leave 0 to
 *   1, or the two cages have different patch lists.
 */
export const mapAutoMovieSurfaceTier: (
  props: IAutoMovieMapSurfaceTier.IProps,
) => IAutoMovieMapSurfaceTier.IResult = (
  props: IAutoMovieMapSurfaceTier.IProps,
): IAutoMovieMapSurfaceTier.IResult => {
  function names(c: IAutoMovieSurfaceCage): string {
    return c.patches
      .map((p: IAutoMovieSurfaceCage.IPatch): string => p.name)
      .join("\u0000");
  }
  if (names(props.from) !== names(props.to))
    throw new Error("tiers must come from the same network");
  const corners: IAutoMovieSurfaceCage["corners"][number] | undefined =
    props.from.corners[props.at.face];
  if (corners === undefined)
    throw new Error(`face ${props.at.face} is out of range`);
  const { u, v }: typeof props.at = props.at;
  if (!(u >= 0 && u <= 1 && v >= 0 && v <= 1))
    throw new Error("face coordinates must lie in 0 to 1");
  const w: number[] = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
  const coordinate: IAutoMovieSurfaceCoordinate = {
    patch: corners[0].patch,
    s: corners.reduce(
      (sum: number, c: IAutoMovieSurfaceCoordinate, k: number): number =>
        sum + w[k]! * c.s,
      0,
    ),
    t: corners.reduce(
      (sum: number, c: IAutoMovieSurfaceCoordinate, k: number): number =>
        sum + w[k]! * c.t,
      0,
    ),
  };
  return {
    at: locateAutoMovieSurfaceCoordinate({ cage: props.to, coordinate }),
    coordinate,
  };
};
