import { IAutoMovieSubdivisionParameter } from "../IAutoMovieSubdivisionParameter";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";
import { locateAutoMovieSurfaceCoordinate } from "./locateAutoMovieSurfaceCoordinate";

/**
 * Carry a point bound to one tier's cage onto another tier of the same
 * network.
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
 * @param props.at The point on `from`: a face index and quad-local coordinates in 0 to 1.
 * @returns The point on `to`, and its surface coordinate.
 * @throws Error when the face is out of range, the local coordinates leave 0 to 1, or the two cages have different patch lists.
 *
 * @evidence contracts/common.md#principled-implementation Tiers share the patch chart, so mapping is chart composition: the source face's bilinear corner blend gives the chart point, exactly on a grid, and the target's grid or face inversion places it.
 * @evidence contracts/common.md#clear-and-simple-design Composes the corner coordinates the sampler publishes with the locator; it holds no state of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tiers whose patch lists differ are refused instead of matched by position.
 * @evidence contracts/common.md#meaningful-documentation States the mapping, why it is exact, the requirement that both tiers share a network, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms Constant time plus a comparison of the two patch name lists, O(P) for P patches.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const mapAutoMovieSurfaceTier: (props: {
  from: IAutoMovieSurfaceCage;
  to: IAutoMovieSurfaceCage;
  at: IAutoMovieSubdivisionParameter;
}) => { at: IAutoMovieSubdivisionParameter; coordinate: IAutoMovieSurfaceCoordinate } = (props: {
  from: IAutoMovieSurfaceCage;
  to: IAutoMovieSurfaceCage;
  at: IAutoMovieSubdivisionParameter;
}): { at: IAutoMovieSubdivisionParameter; coordinate: IAutoMovieSurfaceCoordinate } => {
  const names = (c: IAutoMovieSurfaceCage): string =>
    c.patches.map((p: IAutoMovieSurfaceCage.IPatch): string => p.name).join("\u0000");
  if (names(props.from) !== names(props.to)) throw new Error("tiers must come from the same network");
  const corners: IAutoMovieSurfaceCage["corners"][number] | undefined = props.from.corners[props.at.face];
  if (corners === undefined) throw new Error(`face ${props.at.face} is out of range`);
  const { u, v } = props.at;
  if (!(u >= 0 && u <= 1 && v >= 0 && v <= 1)) throw new Error("face coordinates must lie in 0 to 1");
  const w: number[] = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
  const coordinate: IAutoMovieSurfaceCoordinate = {
    patch: corners[0].patch,
    s: corners.reduce((sum: number, c: IAutoMovieSurfaceCoordinate, k: number): number => sum + w[k]! * c.s, 0),
    t: corners.reduce((sum: number, c: IAutoMovieSurfaceCoordinate, k: number): number => sum + w[k]! * c.t, 0),
  };
  return { at: locateAutoMovieSurfaceCoordinate({ cage: props.to, coordinate }), coordinate };
};
