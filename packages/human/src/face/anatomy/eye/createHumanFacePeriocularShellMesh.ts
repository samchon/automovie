import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { createHumanFacePeriocularTopology } from "./createHumanFacePeriocularTopology";
import type { IHumanFacePeriocularShellInput } from "./structures/IHumanFacePeriocularShellInput";

/**
 * Form a closed indexed shell over a structured anatomical support. A declared
 * zero-height column is one physical endpoint on each sheet, so every row
 * reads that same index and neighboring cells form a triangle fan. The same
 * quotient handles canonical canthal columns shared by every station.
 *
 * Only repeated-index triangles of those declared endpoints disappear; every
 * nonredundant cell, requested coordinate and thickness remains unchanged.
 * Normals come from the actual resident incidence, without a fallback or an
 * area threshold. Unrelated projection collapse still fails normal admission.
 *
 * @evidence contracts/common.md#principled-implementation A collapsed parameter column has one endpoint per sheet; indexed quotienting creates the ordinary tapered-solid fan instead of repeated zero-area grid rows.
 * @evidence contracts/common.md#clear-and-simple-design One shell owner shares sheet, perimeter and pole incidence for posterior and anterior tissue paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint identities come from the source support; no name, side, profile, normal fallback or tolerance chooses a repair.
 * @evidence contracts/common.md#meaningful-documentation States the quotient, preserved dimensions and the remaining projection-collapse refusal.
 * @evidence contracts/modeling.md#shared-boundaries Both sheets and perimeter consume one endpoint map, so the tapered boundary remains closed.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates stay canonical head-frame metres; normals are dimensionless area-weighted directions.
 */
export function createHumanFacePeriocularShellMesh(
  input: IHumanFacePeriocularShellInput,
): IAutoMovieMesh {
  const { stride, height } = input;
  const n = stride * height;
  const coordinates = [...input.outer, ...input.inner];
  const topology = createHumanFacePeriocularTopology(input);
  const sourceIndices: number[] = [];
  const triangle = (a: number, b: number, c: number): void => {
    const corners = [a, b, c];
    if (new Set(corners).size === 3) sourceIndices.push(...corners);
  };
  const quad = (a: number, b: number, c: number, d: number): void => {
    triangle(a, b, c);
    triangle(a, c, d);
  };
  for (const [a, b, c, d] of topology.cells) {
    quad(a, b, c, d);
    quad(n + a, n + d, n + c, n + b);
  }
  const perimeter = topology.perimeter;
  for (let at = 0; at < perimeter.length; at++) {
    const a = perimeter[at],
      b = perimeter[(at + 1) % perimeter.length];
    quad(a, n + a, n + b, b);
  }
  const vertices = [...new Set(sourceIndices)];
  const remap = new Map(vertices.map((vertex, index) => [vertex, index]));
  const positions = vertices.flatMap((vertex) =>
    coordinates.slice(3 * vertex, 3 * vertex + 3),
  );
  const indices = sourceIndices.map((vertex) => remap.get(vertex)!);
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
