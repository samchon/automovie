import type { IHumanFacePeriocularTopology } from "./structures/IHumanFacePeriocularTopology";

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
 * area threshold. Downstream publication retains face and unit-normal
 * admission for unrelated projection collapse.
 *
 * @evidence contracts/common.md#principled-implementation The structured source topology quotients only declared collapsed columns, then closes both offset sheets and their common perimeter.
 * @evidence contracts/common.md#clear-and-simple-design One canonical topology owner is shared with mapping readers; this producer owns resident remapping, global orientation and actual normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only repeated-index triangles disappear; downstream publication retains unrelated face/unit-normal refusals rather than a tolerance weld. This producer does not itself certify every emitted face's nonzero area.
 * @evidence contracts/common.md#meaningful-documentation The prose states endpoint quotient, preserved dimensions, actual incidence and unsupported collapse behavior.
 * @evidence contracts/performance.md#efficient-algorithms Stride times height drives cells/coordinates; source-index collection, remapping, volume and normal scans are proportional to emitted incidence.
 * @evidence contracts/performance.md#reuse-equivalent-work One topology and canonical resident map serve both sheets and all closure faces, preserving the mapping reader's identical triangulation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned mesh arrays; coordinate/topology/remap temporaries expire without global state or handles.
 */
export function createHumanFacePeriocularShellMesh(
  input: IHumanFacePeriocularShellInput,
): IAutoMovieMesh {
  const { stride, height }: IHumanFacePeriocularShellInput = input;
  const n: number = stride * height;
  const coordinates: number[] = [...input.outer, ...input.inner];
  const topology: IHumanFacePeriocularTopology = createHumanFacePeriocularTopology(input);
  const sourceIndices: number[] = [];
  const triangle: (a: number, b: number, c: number) => void = (a: number, b: number, c: number): void => {
    const corners: number[] = [a, b, c];
    if (new Set(corners).size === 3) sourceIndices.push(...corners);
  };
  const quad: (a: number, b: number, c: number, d: number) => void = (a: number, b: number, c: number, d: number): void => {
    triangle(a, b, c);
    triangle(a, c, d);
  };
  for (const [a, b, c, d] of topology.cells) {
    quad(a, b, c, d);
    quad(n + a, n + d, n + c, n + b);
  }
  const perimeter: number[] = topology.perimeter;
  for (let at: number = 0; at < perimeter.length; at++) {
    const a: number = perimeter[at],
      b: number = perimeter[(at + 1) % perimeter.length];
    quad(a, n + a, n + b, b);
  }
  const vertices: number[] = [...new Set(sourceIndices)];
  const remap: Map<number, number> = new Map(vertices.map((vertex: number, index: number): [number, number]  => [vertex, index]));
  const positions: number[] = vertices.flatMap((vertex: number): number[]  =>
    coordinates.slice(3 * vertex, 3 * vertex + 3),
  );
  const indices: number[] = sourceIndices.map((vertex: number): number  => remap.get(vertex)!);
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
