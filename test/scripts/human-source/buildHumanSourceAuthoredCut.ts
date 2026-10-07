import type { IHumanSourceAuthoredCut } from "./structures/IHumanSourceAuthoredCut.ts";
import type { IHumanSourceAuthoredCutInput } from "./structures/IHumanSourceAuthoredCutInput.ts";
import type { IHumanSourceCutSample } from "./structures/IHumanSourceCutSample.ts";

/**
 * Rebuild both partitions from one provider tree and the original frozen cut.
 * Native parent ownership and ordered edge t survive source compaction; no
 * nearest point or new plane fit changes the shared184 stencil. New nasal
 * skin cells belong to the same head root. Retired native points cannot enter
 * either emitted partition. Geometry, normal/contact validity and motion are
 * subsequently admitted on the actual source result, not inherited by label.
 */
export function buildHumanSourceAuthoredCut(input: IHumanSourceAuthoredCutInput): IHumanSourceAuthoredCut {
  const { original, root, cells } = input;
  const count = root.topology.vertexCount;
  const canonical = (native: number): number => {
    const vertex = root.nativeToSource[native];
    if (!Number.isSafeInteger(vertex) || vertex < 0) throw new Error(`Cut references retired native vertex ${native}.`);
    return vertex;
  };
  const intersections = original.intersections.map((sample): IHumanSourceCutSample => ({ a: canonical(sample.a), b: canonical(sample.b), t: sample.t }));
  const source = (old: number): number => old < original.originalVertices ? canonical(old) : count + old - original.originalVertices;
  const children = new Map<number, number[]>();
  original.parents.forEach((parent, child) => children.set(parent, [...children.get(parent) ?? [], child]));
  const triangles: number[][] = [[], []], parents: number[][] = [[], []], uvs: number[][] = [[], []];
  const originalFaceTriangleToHead = new Int32Array(original.p1FaceParents.length).fill(-1);
  const headMaterialRoles: string[] = [], headPartIds: string[] = [];
  let parent = 0;
  for (const cell of cells) {
    for (let fan = 1; fan < cell.vertices.length - 1; fan++, parent++) {
      if (cell.originalNativePolygon === undefined) {
        if (cell.partId !== "nasal-vestibule-left" && cell.partId !== "nasal-vestibule-right" &&
            cell.partId !== "nasal-rim-left" && cell.partId !== "nasal-rim-right")
          throw new Error(`Authored cell ${cell.id} needs explicit head/body ownership.`);
        for (const corner of [0, fan, fan + 1]) {
          triangles[0].push(canonical(cell.vertices[corner]));
          uvs[0].push(cell.cornerUV[corner][0], 1 - cell.cornerUV[corner][1]);
        }
        parents[0].push(parent);
        headMaterialRoles.push(cell.materialRole);
        headPartIds.push(cell.partId);
        continue;
      }
      const originalParent = input.originalPolygonParents[cell.originalNativePolygon] + fan - 1;
      const corners = [cell.vertices[0], cell.vertices[fan], cell.vertices[fan + 1]];
      if (corners.some((native, corner) => native !== input.originalParentTriangles[3 * originalParent + corner]))
        throw new Error(`Authored cell ${cell.id} changes retained original parent ${originalParent}; declare replacement lineage separately.`);
      const descendants = children.get(originalParent);
      if (descendants === undefined) throw new Error(`Authored cell ${cell.id} lost original parent ${originalParent}.`);
      for (const child of descendants) {
        const label = original.labels[child];
        if (label !== 0 && label !== 1) throw new Error(`Original parent ${originalParent} has an unknown partition label.`);
        for (let corner = 0; corner < 3; corner++) {
          triangles[label].push(source(original.triangles[3 * child + corner]));
          uvs[label].push(original.cornerUv[6 * child + 2 * corner], original.cornerUv[6 * child + 2 * corner + 1]);
        }
        if (label === 0) {
          originalFaceTriangleToHead[child] = parents[0].length;
          headMaterialRoles.push(cell.materialRole);
          headPartIds.push(cell.partId);
        }
        parents[label].push(parent);
      }
    }
  }
  if (parent !== root.topology.triangles.length / 3) throw new Error("Authored cut parent population differs from its root.");
  const samples = triangles.map((ids) => [...new Set(ids)].sort((a, b) => a - b));
  const view = samples.map((ids) => new Map(ids.map((vertex, local) => [vertex, local])));
  const indices = triangles.map((ids, label) => Int32Array.from(ids, (vertex) => view[label].get(vertex)!));
  const stencils = (ids: number[]): IHumanSourceCutSample[] => ids.map((vertex) => vertex < count ? { a: vertex, b: vertex, t: 0 } : intersections[vertex - count]);
  const originalFaceToHead = new Int32Array(original.faceToG1.length).fill(-1);
  original.faceToG1.forEach((old, vertex) => {
    const canonicalId = old < original.originalVertices ? root.nativeToSource[old] : count + old - original.originalVertices;
    if (canonicalId >= 0) originalFaceToHead[vertex] = view[0].get(canonicalId) ?? -1;
  });
  return {
    headIndices: indices[0], headUv: Float64Array.from(uvs[0]), originalFaceToHead,
    originalFaceTriangleToHead, headMaterialRoles, headPartIds,
    cut: {
      minimumY: original.minimumY, originalVertices: count, intersections,
      faceSamples: stencils(samples[0]), faceToG1: Int32Array.from(samples[0]),
      r16ToSource: Int32Array.from(original.r16ToSource, canonical),
      triangles: Int32Array.from([...triangles[0], ...triangles[1]]),
      labels: Uint8Array.from([...parents[0].map(() => 0), ...parents[1].map(() => 1)]),
      parents: Int32Array.from([...parents[0], ...parents[1]]),
      cornerUv: Float64Array.from([...uvs[0], ...uvs[1]]),
      p1BodySamples: stencils(samples[1]), p1BodyToG1: Int32Array.from(samples[1]),
      p1BodyIndices: indices[1], p1BodyUv: Float64Array.from(uvs[1]),
      p1FaceParents: Int32Array.from(parents[0]), p1BodyParents: Int32Array.from(parents[1]),
      checks: { intersections: intersections.length, faceTriangles: parents[0].length, bodyTriangles: parents[1].length,
        sourceParentTriangles: parent, retiredOriginalFaceVertices: originalFaceToHead.filter((vertex) => vertex < 0).length },
    },
  };
}
