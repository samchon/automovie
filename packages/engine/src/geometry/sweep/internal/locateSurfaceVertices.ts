import type {
  IAutoMovieLocateSurfaceVertices,
  IAutoMovieSubdivisionParameter,
  IAutoMovieSurfaceCoordinate,
  IAutoMovieSurfaceLocation,
  IAutoMovieSurfaceNetwork,
} from "@automovie/interface";

import { readSurfaceFaceCoordinates } from "./readSurfaceFaceCoordinates";

/*
 * Locate every vertex of a subdivided surface network in the network's own
 * terms, so a field declared over the network, such as a displacement, can be
 * evaluated at each vertex.
 *
 * A vertex's cage face and quad-local coordinates give its surface coordinate,
 * the bilinear blend of the face's corner coordinates, the same chart
 * `mapSurfaceTier` uses, so the coordinate is exact on a grid patch
 * and continuous across faces inside that patch. Different patch charts can
 * assign different addresses to a shared edge; compatible fields must agree
 * there. Each vertex keeps its supplied incident-face address. A sweep or
 * transition patch also gives the sweep's domain point, `u` and `v` carried
 * from `t` and `s` by the patch's ranges. The locations depend only on the
 * network's layout and the tier, never on a pose, so they are computed once per
 * tier and level and serve every pose.
 * Parameter props.network: The network the cage was sampled from, only read.
 * Parameter props.cage: The sampled cage, only read.
 * Parameter props.parameters: Each subdivided vertex's cage face and quad-local
 * coordinates, `IAutoMovieSubdivisionSurface.parameters` of the cage's
 * subdivision.
 * Returns: One location per vertex, in vertex order.
 * Error when the network's patches are not the cage's, a parameter's
 * face is out of range or not a quad, or its coordinates leave 0 to 1.
 */
export const locateSurfaceVertices: (
  props: IAutoMovieLocateSurfaceVertices.IProps,
) => IAutoMovieSurfaceLocation[] = (
  props: IAutoMovieLocateSurfaceVertices.IProps,
): IAutoMovieSurfaceLocation[] => {
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = props.network.patches;
  if (
    patches.length !== props.cage.patches.length ||
    patches.findIndex(
      (p: IAutoMovieSurfaceNetwork.IPatch, k: number): boolean =>
        !p || !props.cage.patches[k] || p.name !== props.cage.patches[k]!.name,
    ) !== -1
  )
    throw new Error("the cage was not sampled from this network");
  return Array.from(
    props.parameters,
    (
      at: IAutoMovieSubdivisionParameter,
      index: number,
    ): IAutoMovieSurfaceLocation => {
      if (!at)
        throw new Error(`vertex ${index} has no incident-face parameter`);
      const corners = readSurfaceFaceCoordinates(
        props.cage,
        at.face,
        `vertex ${index}`,
      );
      if (at.corner !== null)
        throw new Error(
          `vertex ${index} lies on face ${at.face}, which is not a quad`,
        );
      const { u, v }: typeof at = at;
      if (
        !Number.isFinite(u) ||
        !Number.isFinite(v) ||
        !(u >= 0 && u <= 1 && v >= 0 && v <= 1)
      )
        throw new Error(`vertex ${index} has face coordinates outside 0 to 1`);
      const w0: number = (1 - u) * (1 - v);
      const w1: number = u * (1 - v);
      const w2: number = u * v;
      const w3: number = (1 - u) * v;
      const coordinate: IAutoMovieSurfaceCoordinate = {
        patch: corners[0].patch,
        s: Math.min(
          1,
          w0 * corners[0].s +
            w1 * corners[1].s +
            w2 * corners[2].s +
            w3 * corners[3].s,
        ),
        t: Math.min(
          1,
          w0 * corners[0].t +
            w1 * corners[1].t +
            w2 * corners[2].t +
            w3 * corners[3].t,
        ),
      };
      const patch: IAutoMovieSurfaceNetwork.IPatch = patches[coordinate.patch]!;
      if (patch.type !== "sweep" && patch.type !== "transition")
        return { coordinate, name: patch.name, sweep: null };
      const sweepU: number =
          patch.u.start + coordinate.t * (patch.u.end - patch.u.start),
        sweepV: number =
          patch.v.start + coordinate.s * (patch.v.end - patch.v.start);
      if (!Number.isFinite(sweepU) || !Number.isFinite(sweepV))
        throw new Error(`vertex ${index} has a nonfinite sweep coordinate`);
      return {
        coordinate,
        name: patch.name,
        sweep: { name: patch.sweep, u: sweepU, v: sweepV },
      };
    },
  );
};
