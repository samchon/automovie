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
 * @evidence contracts/common.md#principled-implementation Each sheet boundary gets one two-triangle wall, and each sheet's internal edge retains its opposing incidence.
 * @evidence contracts/common.md#clear-and-simple-design One closure owner consumes the actual source sheet rather than inventing another grid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No area tolerance, coordinate weld, source ordinal exception or generated face is discarded.
 * @evidence contracts/common.md#meaningful-documentation States unchanged positions, boundary closure and global orientation.
 * @evidence contracts/modeling.md#shared-boundaries Both sheets and their walls use one vertex and boundary definition.
 * @evidence contracts/modeling.md#spatial-conventions Positions stay canonical head-frame metres; normals are area-weighted unit directions.
 */
export function createHumanFacePeriocularIndexedShell(
  input: IHumanFacePeriocularIndexedShellInput,
): IAutoMovieMesh {
  const n = input.outer.length / 3;
  if (!Number.isInteger(n) || input.inner.length !== input.outer.length)
    throw new Error(
      "A conforming tissue shell needs aligned outer and inner vertices.",
    );
  const positions = [...input.outer, ...input.inner];
  const indices = [...input.indices];
  for (let at = 0; at < input.indices.length; at += 3)
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
    for (let at = 0; at < indices.length; at += 3)
      [indices[at + 1], indices[at + 2]] = [indices[at + 2], indices[at + 1]];
  return {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
}
