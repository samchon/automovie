import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * For every sample of the subdivided skin, the base-mesh faces it lies on.
 *
 * One Catmull-Clark level turns each base face into quads that each hold one
 * base corner (an original vertex, index below `baseVertices`), the two edge
 * points beside it and the face point opposite it. So a face point lies in
 * the one base face whose corners surround it, an edge point lies on the base
 * edge whose two corners share its quads (in both faces of that edge), and an
 * original vertex lies on every face it is a corner of. Faces are identified
 * by their corner set against `faces`; a subdivided quad without exactly one
 * base corner refuses.
 */
export function mapHumanSourceSampleFaces(sample: IHumanSourceSample, faces: readonly number[][], baseVertices: number): number[][] {
  const key = (corners: readonly number[]): string => [...corners].sort((a, b) => a - b).join(",");
  const faceOf = new Map(faces.map((face, f) => [key(face), f]));
  const facesOfVertex = new Map<number, number[]>();
  faces.forEach((face, f) => {
    for (const v of face) {
      if (!facesOfVertex.has(v)) facesOfVertex.set(v, []);
      facesOfVertex.get(v)!.push(f);
    }
  });
  const corners = new Map<number, Set<number>>();
  for (let p = 0; p < sample.loopStart.length; p++) {
    const quad = Array.from({ length: sample.loopTotal[p] }, (_, k) => sample.loopVertex[sample.loopStart[p] + k]);
    const at = quad.findIndex((v) => v < baseVertices);
    if (quad.length !== 4 || at < 0 || quad.filter((v) => v < baseVertices).length !== 1)
      throw new Error(`Subdivided polygon ${p} does not hold exactly one base corner.`);
    const corner = quad[at];
    for (const k of [1, 2, 3]) {
      const v = quad[(at + k) % 4];
      if (!corners.has(v)) corners.set(v, new Set());
      corners.get(v)!.add(corner);
    }
  }
  const out: number[][] = [];
  for (let v = 0; v < sample.manifest.vertices; v++) {
    if (v < baseVertices) {
      out.push(facesOfVertex.get(v) ?? []);
      continue;
    }
    const around = [...(corners.get(v) ?? [])];
    if (around.length === 2) {
      const [a, b] = around;
      out.push((facesOfVertex.get(a) ?? []).filter((f) => faces[f].includes(b)));
    } else {
      const f = faceOf.get(key(around));
      if (f === undefined) throw new Error(`Sample ${v} lies in no base face (corners ${around.join(",")}).`);
      out.push([f]);
    }
  }
  return out;
}
