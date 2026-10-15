import { IAutoMovieSubdivisionParameter } from "../IAutoMovieSubdivisionParameter";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";
import { IAutoMovieSurfaceLocation } from "./IAutoMovieSurfaceLocation";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";

/**
 * Locate every vertex of a subdivided surface network in the network's own
 * terms, so a field declared over the network, such as a displacement, can be
 * evaluated at each vertex.
 *
 * A vertex's cage face and quad-local coordinates give its surface
 * coordinate, the bilinear blend of the face's corner coordinates, the same
 * chart `mapAutoMovieSurfaceTier` uses, so the coordinate is exact on a grid
 * patch and continuous across every face edge. A sweep or transition patch
 * also gives the sweep's domain point, `u` and `v` carried from `t` and `s`
 * by the patch's ranges. The locations depend only on the network's layout
 * and the tier, never on a pose, so they are computed once per tier and level
 * and serve every pose.
 *
 * @param props.network The network the cage was sampled from, only read.
 * @param props.cage The sampled cage, only read.
 * @param props.parameters Each subdivided vertex's cage face and quad-local coordinates, `IAutoMovieSubdivisionSurface.parameters` of the cage's subdivision.
 * @returns One location per vertex, in vertex order.
 * @throws Error when the network's patches are not the cage's, a parameter's face is out of range or not a quad, or its coordinates leave 0 to 1.
 *
 * @evidence contracts/common.md#principled-implementation Chart composition: the subdivision's face parameters through the sampler's per-corner patch coordinates, then a sweep patch's affine map to its domain rectangle.
 * @evidence contracts/common.md#clear-and-simple-design Reads only the parameters, the corner coordinates and the patch ranges; it neither subdivides nor evaluates a sweep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cage from another network is refused by its patch names instead of matched by position, and a non-quad face, which the sampler never emits, is refused rather than guessed.
 * @evidence contracts/common.md#meaningful-documentation States the chart, its exactness and continuity, the domain map, the pose independence and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(V + P) for V vertices and P patches, a constant blend per vertex.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single pass; the caller keeps its result across poses, as the description states.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the result holds one location per vertex, owned by the caller.
 */
export const locateAutoMovieSurfaceVertices: (props: {
  network: IAutoMovieSurfaceNetwork;
  cage: IAutoMovieSurfaceCage;
  parameters: readonly IAutoMovieSubdivisionParameter[];
}) => IAutoMovieSurfaceLocation[] = (props: {
  network: IAutoMovieSurfaceNetwork;
  cage: IAutoMovieSurfaceCage;
  parameters: readonly IAutoMovieSubdivisionParameter[];
}): IAutoMovieSurfaceLocation[] => {
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = props.network.patches;
  if (
    patches.length !== props.cage.patches.length ||
    patches.some(
      (p: IAutoMovieSurfaceNetwork.IPatch, k: number): boolean =>
        p.name !== props.cage.patches[k]!.name,
    )
  )
    throw new Error("the cage was not sampled from this network");
  return props.parameters.map(
    (
      at: IAutoMovieSubdivisionParameter,
      index: number,
    ): IAutoMovieSurfaceLocation => {
      const corners: IAutoMovieSurfaceCage["corners"][number] | undefined =
        props.cage.corners[at.face];
      if (corners === undefined)
        throw new Error(
          `vertex ${index} lies on face ${at.face}, which is out of range`,
        );
      if (at.corner !== null)
        throw new Error(
          `vertex ${index} lies on face ${at.face}, which is not a quad`,
        );
      const { u, v } = at;
      if (!(u >= 0 && u <= 1 && v >= 0 && v <= 1))
        throw new Error(`vertex ${index} has face coordinates outside 0 to 1`);
      const w0: number = (1 - u) * (1 - v);
      const w1: number = u * (1 - v);
      const w2: number = u * v;
      const w3: number = (1 - u) * v;
      const coordinate: IAutoMovieSurfaceCoordinate = {
        patch: corners[0].patch,
        s:
          w0 * corners[0].s +
          w1 * corners[1].s +
          w2 * corners[2].s +
          w3 * corners[3].s,
        t:
          w0 * corners[0].t +
          w1 * corners[1].t +
          w2 * corners[2].t +
          w3 * corners[3].t,
      };
      const patch: IAutoMovieSurfaceNetwork.IPatch = patches[coordinate.patch]!;
      return {
        coordinate,
        name: patch.name,
        sweep:
          patch.type === "sweep" || patch.type === "transition"
            ? {
                name: patch.sweep,
                u: patch.u[0] + coordinate.t * (patch.u[1] - patch.u[0]),
                v: patch.v[0] + coordinate.s * (patch.v[1] - patch.v[0]),
              }
            : null,
      };
    },
  );
};
