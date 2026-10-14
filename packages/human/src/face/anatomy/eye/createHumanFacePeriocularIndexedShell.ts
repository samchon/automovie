import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IHumanFacePeriocularIndexedShellInput } from "./structures/IHumanFacePeriocularIndexedShellInput";

/**
 * Close two normal-offset sheets on their actual conforming source incidence.
 * Outer triangles, reversed inner triangles and the same directed boundary
 * edges form one indexed solid. Positions and requested dimensions remain
 * untouched; enclosed-volume sign fixes only global orientation.
 *
 * @evidence contracts/common.md#principled-implementation Outer incidence, reversed inner faces and the same directed material boundary close one indexed normal-offset solid.
 * @evidence contracts/common.md#clear-and-simple-design The exact overlay owner supplies aligned vertex/face/boundary incidence; this helper owns global volume orientation and actual-area normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative volume flips all faces together and never changes coordinates/thickness; alignment validation alone is not complete source or anatomical admission.
 * @evidence contracts/common.md#meaningful-documentation The prose states copied sheets, original directed incidence, unchanged dimensions and global orientation scope.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, F sheet faces and E boundary edges, copy/closure/topology/normal scans require O(V+F+E) work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both faces share the supplied original indices by one offset and the topology/normal readers consume the same completed incidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned mesh arrays own the shell; closure/topology temporaries expire and caller input remains unchanged without retained resources.
 */
export function createHumanFacePeriocularIndexedShell(
  input: IHumanFacePeriocularIndexedShellInput,
): IAutoMovieMesh {
  const n: number = input.outer.length / 3;
  if (!Number.isInteger(n) || input.inner.length !== input.outer.length)
    throw new Error(
      "A conforming tissue shell needs aligned outer and inner vertices.",
    );
  const positions: number[] = [...input.outer, ...input.inner];
  const indices: number[] = [...input.indices];
  for (let at: number = 0; at < input.indices.length; at += 3)
    indices.push(
      n + input.indices[at],
      n + input.indices[at + 2],
      n + input.indices[at + 1],
    );
  for (const [a, b] of input.boundary)
    indices.push(a, n + a, n + b, a, n + b, b);
  if (
    inspectAutoMovieMeshTopology({
      positions,
      indices,
      normals: null,
      uvs: null,
      skin: null,
    }).volume < 0
  )
    for (let at: number = 0; at < indices.length; at += 3)
      [indices[at + 1], indices[at + 2]] = [indices[at + 2], indices[at + 1]];
  return {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
}
