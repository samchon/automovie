import { clipHumanFaceBasisSurface } from "@automovie/human/face/basis/clipHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceCutInput } from "./structures/IHumanSourceCutInput.ts";
import type { IHumanSourceCutSample } from "./structures/IHumanSourceCutSample.ts";

/**
 * Freeze the one neck cut on the source and derive the P2 skin and P1 views.
 *
 * The cut is the published face recrop, reproduced by the maintained crop
 * owner (`clipHumanFaceBasisSurface`) on the pre-recrop face whose skin
 * vertices are exact source twins, and refused unless its triangles equal the
 * published face's. Its edge preimages become the ordered intersection table
 * W. The body side is the same crop owner applied to the whole source with Y
 * reflected; each of its edge nodes must find its W entry by undirected edge
 * identity, so no second fraction is ever used. The published body's vertex
 * order is recovered as the source complement of the face it was cut against.
 * Parents and area coverage are measured, never assumed.
 */
export function buildHumanSourceCut(input: IHumanSourceCutInput): IHumanSourceCut {
  const { topology, minimumY } = input;
  const n = topology.vertexCount;
  const twins = new Map<string, number>();
  for (let v = 0; v < n; v++)
    twins.set(`${topology.positions[3 * v]}/${topology.positions[3 * v + 1]}/${topology.positions[3 * v + 2]}`, v);
  const twinOf = (positions: readonly number[], v: number, what: string): number => {
    const twin = twins.get(`${positions[3 * v]}/${positions[3 * v + 1]}/${positions[3 * v + 2]}`);
    if (twin === undefined) throw new Error(`${what} vertex ${v} has no exact source twin.`);
    return twin;
  };
  const edgeKey = (a: number, b: number): string => (a < b ? `${a}/${b}` : `${b}/${a}`);
  const setKey = (ids: readonly number[]): string => [...new Set(ids)].sort((x, y) => x - y).join("/");

  // Face recrop on the pre-recrop face, by the maintained owner.
  const fine: IAutoMovieHumanFaceBasis["surfaces"][number] = {
    ...input.fineHead,
    hairDomains: undefined,
    hairContactClosure: undefined,
    sourcePartition: undefined,
    sourcePosePlan: undefined,
  };
  const cropped = clipHumanFaceBasisSurface(fine, minimumY);
  if (
    cropped.surface.indices.length !== input.face.indices.length ||
    cropped.surface.indices.some((v, i) => v !== input.face.indices[i])
  )
    throw new Error("The reproduced face recrop does not equal the published face triangles.");
  const fineTwins = new Map<number, number>();
  const fineTwin = (v: number): number => {
    let twin = fineTwins.get(v);
    if (twin === undefined) fineTwins.set(v, (twin = twinOf(input.fineHead.positions, v, "Pre-recrop face")));
    return twin;
  };
  const faceSamples: IHumanSourceCutSample[] = cropped.correspondence.map((s) =>
    s.a === s.b ? { a: fineTwin(s.a), b: fineTwin(s.a), t: 0 } : { a: fineTwin(s.a), b: fineTwin(s.b), t: s.t },
  );
  const intersections: IHumanSourceCutSample[] = [];
  const cutIndex = new Map<string, number>();
  const faceToG1 = new Int32Array(faceSamples.length);
  faceSamples.forEach((s, v) => {
    if (s.a === s.b) {
      faceToG1[v] = s.a;
      return;
    }
    const key = edgeKey(s.a, s.b);
    if (cutIndex.has(key)) throw new Error("Two face vertices own one source edge.");
    cutIndex.set(key, intersections.length);
    faceToG1[v] = n + intersections.length;
    intersections.push(s);
  });

  // Body complement: the same owner on the whole source with Y reflected.
  const triangles = Array.from(topology.triangles);
  const reflected: number[] = Array.from(topology.positions, (value, i) => (i % 3 === 1 ? -value : value));
  const complement = clipHumanFaceBasisSurface(
    {
      id: "Human",
      positions: reflected,
      indices: triangles,
      targets: {},
      regions: [{ id: "Human/skin", material: "skin", indices: triangles, uvs: Array.from(topology.cornerUv) }],
    },
    -minimumY,
  );
  let fractionGap = 0;
  const p1BodyToG1 = new Int32Array(complement.correspondence.length);
  const p1BodySamples: IHumanSourceCutSample[] = complement.correspondence.map((s, v) => {
    if (s.a === s.b) {
      p1BodyToG1[v] = s.a;
      return { a: s.a, b: s.a, t: 0 };
    }
    const index = cutIndex.get(edgeKey(s.a, s.b));
    if (index === undefined) throw new Error("A body cut node has no face-owned source edge.");
    const owned = intersections[index];
    const fraction = owned.a === s.a ? owned.t : 1 - owned.t;
    fractionGap = Math.max(fractionGap, Math.abs(fraction - s.t));
    p1BodyToG1[v] = n + index;
    return owned;
  });
  const usedCuts = new Set(Array.from(p1BodyToG1).filter((g) => g >= n));

  // Head-side corner UVs from the same crop of the whole source.
  const headSource = clipHumanFaceBasisSurface(
    {
      id: "Human",
      positions: Array.from(topology.positions),
      indices: triangles,
      targets: {},
      regions: [{ id: "Human/skin", material: "skin", indices: triangles, uvs: Array.from(topology.cornerUv) }],
    },
    minimumY,
  );
  const headToG1 = headSource.correspondence.map((s) => {
    if (s.a === s.b) return s.a;
    const index = cutIndex.get(edgeKey(s.a, s.b));
    if (index === undefined) throw new Error("A whole-source head cut node has no face-owned edge.");
    return n + index;
  });
  const headUv = headSource.surface.regions[0].uvs!;
  const headTriangles = new Map<string, number>();
  for (let i = 0; i < headSource.surface.indices.length; i += 3) {
    const key = setKey([0, 1, 2].map((k) => headToG1[headSource.surface.indices[i + k]]));
    if (headTriangles.has(key)) throw new Error("The whole-source head crop repeats a triangle.");
    headTriangles.set(key, i / 3);
  }

  // One skin: head triangles in published face order, then body triangles.
  const faceTriangleCount = input.face.indices.length / 3;
  const bodyTriangleCount = complement.surface.indices.length / 3;
  const all = new Int32Array(3 * (faceTriangleCount + bodyTriangleCount));
  const labels = new Uint8Array(faceTriangleCount + bodyTriangleCount);
  const cornerUv = new Float64Array(6 * (faceTriangleCount + bodyTriangleCount));
  let orientationFlips = 0;
  let missingHeadTwins = 0;
  for (let f = 0; f < faceTriangleCount; f++) {
    const ids = [0, 1, 2].map((k) => faceToG1[input.face.indices[3 * f + k]]);
    all.set(ids, 3 * f);
    const key = setKey(ids);
    const match = headTriangles.get(key);
    if (match === undefined) {
      missingHeadTwins++;
      continue;
    }
    headTriangles.delete(key);
    const source = [0, 1, 2].map((k) => headToG1[headSource.surface.indices[3 * match + k]]);
    const rotation = source.indexOf(ids[0]);
    if (source[(rotation + 1) % 3] !== ids[1]) orientationFlips++;
    for (let k = 0; k < 3; k++) {
      const corner = (rotation + k) % 3;
      cornerUv[6 * f + 2 * k] = headUv[6 * match + 2 * corner];
      cornerUv[6 * f + 2 * k + 1] = headUv[6 * match + 2 * corner + 1];
    }
  }
  const bodyUv = complement.surface.regions[0].uvs!;
  for (let b = 0; b < bodyTriangleCount; b++) {
    const t = faceTriangleCount + b;
    labels[t] = 1;
    for (let k = 0; k < 3; k++) {
      all[3 * t + k] = p1BodyToG1[complement.surface.indices[3 * b + k]];
      cornerUv[6 * t + 2 * k] = bodyUv[6 * b + 2 * k];
      cornerUv[6 * t + 2 * k + 1] = bodyUv[6 * b + 2 * k + 1];
    }
  }

  // Parents by source preimage support, and area coverage per parent.
  const parentOf = new Map<string, number>();
  for (let i = 0; i < triangles.length; i += 3) {
    const key = setKey(triangles.slice(i, i + 3));
    if (parentOf.has(key)) throw new Error("The source has two triangles on one vertex set.");
    parentOf.set(key, i / 3);
  }
  const support = (g: number): number[] => (g < n ? [g] : [intersections[g - n].a, intersections[g - n].b]);
  const point = (g: number): number[] => {
    if (g < n) return [0, 1, 2].map((k) => topology.positions[3 * g + k]);
    const s = intersections[g - n];
    return [0, 1, 2].map((k) => (1 - s.t) * topology.positions[3 * s.a + k] + s.t * topology.positions[3 * s.b + k]);
  };
  const area = (p: number[], q: number[], r: number[]): number => {
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const w = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    return Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) / 2;
  };
  const parents = new Int32Array(labels.length);
  const covered = new Float64Array(triangles.length / 3);
  for (let t = 0; t < labels.length; t++) {
    const ids = [all[3 * t], all[3 * t + 1], all[3 * t + 2]];
    const parent = parentOf.get(setKey(ids.flatMap(support)));
    if (parent === undefined) throw new Error(`Skin triangle ${t} has no source parent.`);
    parents[t] = parent;
    covered[parent] += area(point(ids[0]), point(ids[1]), point(ids[2]));
  }
  let uncovered = 0;
  let worstCoverage = 0;
  for (let p = 0; p < covered.length; p++) {
    const ids = triangles.slice(3 * p, 3 * p + 3);
    const whole = area(point(ids[0]), point(ids[1]), point(ids[2]));
    if (covered[p] === 0) uncovered++;
    worstCoverage = Math.max(worstCoverage, Math.abs(covered[p] - whole) / Math.max(whole, 1e-30));
  }

  // Published body vertex order: source complement of the rigid-mandible face.
  const rigidTwins = new Map<number, number>();
  const rigidTwin = (v: number): number => {
    let twin = rigidTwins.get(v);
    if (twin === undefined) rigidTwins.set(v, (twin = twinOf(input.rigidFace.positions, v, "Rigid-mandible face")));
    return twin;
  };
  const omitted = new Set<string>();
  for (let i = 0; i < input.rigidFace.indices.length; i += 3)
    omitted.add(setKey(input.rigidFace.indices.slice(i, i + 3).map(rigidTwin)));
  const historical: number[] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const ids = triangles.slice(i, i + 3);
    if (!omitted.has(setKey(ids))) historical.push(...ids);
  }
  const kept = [...new Set(historical)].sort((x, y) => x - y);
  const reverse = new Map(kept.map((v, i) => [v, i]));
  if (
    historical.length !== input.body.indices.length ||
    historical.some((v, i) => reverse.get(v) !== input.body.indices[i])
  )
    throw new Error("The published body triangles are not the source complement of the rigid-mandible face.");

  return {
    minimumY,
    originalVertices: n,
    intersections,
    faceSamples,
    faceToG1,
    r16ToSource: Int32Array.from(kept),
    triangles: all,
    labels,
    parents,
    cornerUv,
    p1BodySamples,
    p1BodyToG1,
    p1BodyIndices: Int32Array.from(complement.surface.indices),
    p1BodyUv: Float64Array.from(bodyUv),
    p1BodyParents: parents.slice(faceTriangleCount),
    p1FaceParents: parents.slice(0, faceTriangleCount),
    checks: {
      preRecropFaceVerticesWithExactTwins: fineTwins.size,
      rigidFaceVerticesWithExactTwins: rigidTwins.size,
      faceRecropTrianglesEqualPublished: true,
      bodyTrianglesEqualRigidComplement: true,
      intersections: intersections.length,
      bodyCutNodesMatched: usedCuts.size,
      bodyFractionGapMaximum: fractionGap,
      headTrianglesWithoutWholeSourceTwin: missingHeadTwins,
      wholeSourceHeadTrianglesNotInFace: headTriangles.size,
      headOrientationDisagreements: orientationFlips,
      sourceTrianglesUncovered: uncovered,
      parentAreaCoverageWorstRelative: worstCoverage,
      faceTriangles: faceTriangleCount,
      bodyTriangles: bodyTriangleCount,
    },
  };
}
