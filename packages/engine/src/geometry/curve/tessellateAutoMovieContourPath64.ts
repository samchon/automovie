import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

/**
 * Generate an indexed surface from saved physical polygon identities and P/Q paths.
 * P emits (P_i,Q_j,P_next); Q emits (Q_next,P_i,Q_j). Positive XZ rings
 * and increasing Y stations give outward winding on an ordinary exterior slab.
 * This operation validates the path, not its optimization or geometric embedding.
 * Finite positive-area faces survive incidence warnings; collapsed faces are counted.
 *
 * @evidence contracts/common.md#principled-implementation Each instruction advances one boundary exactly once; modulo indices close both rings, shared polygon IDs allocate one new vertex set, and area-weighted normals derive only from emitted faces.
 * @evidence contracts/common.md#clear-and-simple-design Polygon and path admission precede all generation; the result reports each pair's generated triangle range, recomputed area and separate quality diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, external triangles, copied normals, positional weld, path repair or optimizer substitution enters the engine. Invalid instructions fail, while finite faces with topology warnings remain visible.
 * @evidence contracts/common.md#meaningful-documentation States millimetre input, one metre conversion, whole-condition winding, path semantics, generated normal authority and unsupported embedding/optimality claims.
 * @evidence contracts/performance.md#efficient-algorithms V saved vertices and T instructions require O(V+T) generation and expected map work, plus O(V+T) returned mesh and ownership storage; polygon simplicity and intersections are not computed.
 * @evidence contracts/performance.md#reuse-equivalent-work Polygon identity shares one newly allocated vertex set between incident pairs and one normal accumulation across emitted faces; no coordinate-based sharing occurs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local registries expire on return and generated arrays transfer to the caller; no global cache, source geometry or file handle is acquired.
 */
export function tessellateAutoMovieContourPath64(input: {
  topologyDomain: string;
  polygons: readonly {
    id: string;
    stationMm: number;
    pointsMm: readonly C.Vector[];
  }[];
  pairs: readonly {
    id: string;
    pId: string;
    qId: string;
    startP: number;
    startQ: number;
    steps: string;
    objectiveAreaMm2: number;
  }[];
}): {
  mesh: IAutoMovieMesh;
  construction: { id: string; points: [number, number, number][] }[];
  pairs: {
    id: string;
    firstTriangle: number;
    triangles: number;
    omittedTriangles: number;
    areaMm2: number;
    objectiveDiscrepancyMm2: number;
    diagnostics: string[];
  }[];
  diagnostics: string[];
} {
  if (!input.topologyDomain.trim())
    throw new Error("A generated physical identity domain is required");
  const polygons: Map<string, (typeof input.polygons)[number]> = new Map();
  for (const polygon of input.polygons) {
    if (
      !polygon.id ||
      polygons.has(polygon.id) ||
      !Number.isFinite(polygon.stationMm) ||
      polygon.pointsMm.length < 3 ||
      polygon.pointsMm.some(
        (point: C.Vector): boolean =>
          point.length !== 3 ||
          !point.every(Number.isFinite) ||
          point[1] !== polygon.stationMm,
      )
    )
      throw new Error("Unique finite Y-plane polygons are required");
    const origin: C.Vector = polygon.pointsMm[0]!;
    const area: number = polygon.pointsMm.reduce(
      (sum: number, point: C.Vector, i: number): number => {
        const next: C.Vector =
          polygon.pointsMm[(i + 1) % polygon.pointsMm.length]!;
        if (point.every((x: number, k: number): boolean => x === next[k]))
          throw new Error("A polygon has a collapsed boundary edge");
        return (
          sum +
          (point[0] - origin[0]) * (next[2] - origin[2]) -
          (next[0] - origin[0]) * (point[2] - origin[2])
        );
      },
      0,
    );
    if (!(area > 0 && Number.isFinite(area)))
      throw new Error("Polygons require a common positive projected XZ order");
    polygons.set(polygon.id, polygon);
  }
  const pairIds: Set<string> = new Set();
  for (const pair of input.pairs) {
    const p: (typeof input.polygons)[number] | undefined = polygons.get(
        pair.pId,
      ),
      q: (typeof input.polygons)[number] | undefined = polygons.get(pair.qId);
    if (
      !pair.id ||
      pairIds.has(pair.id) ||
      !p ||
      !q ||
      !(p.stationMm < q.stationMm) ||
      !Number.isSafeInteger(pair.startP) ||
      pair.startP < 0 ||
      pair.startP >= p.pointsMm.length ||
      !Number.isSafeInteger(pair.startQ) ||
      pair.startQ < 0 ||
      pair.startQ >= q.pointsMm.length ||
      typeof pair.steps !== "string" ||
      /[^PQ]/.test(pair.steps) ||
      pair.steps.length !== p.pointsMm.length + q.pointsMm.length ||
      [...pair.steps].filter((step: string): boolean => step === "P").length !==
        p.pointsMm.length ||
      !(pair.objectiveAreaMm2 >= 0 && Number.isFinite(pair.objectiveAreaMm2))
    )
      throw new Error(
        "A complete finite path must advance each saved boundary exactly once",
      );
    pairIds.add(pair.id);
  }
  const mesh: IAutoMovieMesh = {
    positions: [],
    indices: [],
    normals: [],
    uvs: null,
    skin: null,
    physicalVertices: { sources: [], vertices: [] },
  };
  const offsets: Map<string, number> = new Map(),
    construction: { id: string; points: [number, number, number][] }[] = [];
  for (const polygon of input.polygons) {
    offsets.set(polygon.id, mesh.positions.length / 3);
    const points: [number, number, number][] = polygon.pointsMm.map(
      (point: C.Vector): [number, number, number] => [
        point[0] * 0.001,
        point[1] * 0.001,
        point[2] * 0.001,
      ],
    );
    for (const point of points) {
      if (!point.every(Number.isFinite))
        throw new Error("Published polygon coordinates are unrepresentable");
      const id: number = mesh.positions.length / 3;
      mesh.positions.push(...point);
      mesh.normals!.push(0, 0, 0);
      mesh.physicalVertices!.sources.push({ domain: input.topologyDomain, id });
      mesh.physicalVertices!.vertices.push(id);
    }
    construction.push({ id: polygon.id, points: [...points, points[0]!] });
  }
  const reports: {
    id: string;
    firstTriangle: number;
    triangles: number;
    omittedTriangles: number;
    areaMm2: number;
    objectiveDiscrepancyMm2: number;
    diagnostics: string[];
  }[] = [];
  const edges: Map<string, { uses: number; orientation: number }> = new Map(),
    faces: Set<string> = new Set(),
    diagnostics: string[] = [];
  for (const pair of input.pairs) {
    const p: (typeof input.polygons)[number] = polygons.get(pair.pId)!,
      q: (typeof input.polygons)[number] = polygons.get(pair.qId)!;
    const po: number = offsets.get(pair.pId)!,
      qo: number = offsets.get(pair.qId)!;
    const report: (typeof reports)[number] = {
      id: pair.id,
      firstTriangle: mesh.indices!.length / 3,
      triangles: 0,
      omittedTriangles: 0,
      areaMm2: 0,
      objectiveDiscrepancyMm2: 0,
      diagnostics: [],
    };
    let i: number = pair.startP,
      j: number = pair.startQ;
    for (const step of pair.steps) {
      const ids: [number, number, number] =
        step === "P"
          ? [po + i, qo + j, po + ((i + 1) % p.pointsMm.length)]
          : [qo + ((j + 1) % q.pointsMm.length), po + i, qo + j];
      if (step === "P") i = (i + 1) % p.pointsMm.length;
      else j = (j + 1) % q.pointsMm.length;
      const a: number[] = mesh.positions.slice(3 * ids[0], 3 * ids[0] + 3),
        b: number[] = mesh.positions.slice(3 * ids[1], 3 * ids[1] + 3),
        c: number[] = mesh.positions.slice(3 * ids[2], 3 * ids[2] + 3);
      const u: number[] = b.map((x: number, k: number): number => x - a[k]!),
        v: number[] = c.map((x: number, k: number): number => x - a[k]!);
      const normal: number[] = [
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ];
      const length: number = Math.hypot(...normal);
      if (!(length > 0 && Number.isFinite(length))) {
        report.omittedTriangles++;
        continue;
      }
      report.areaMm2 += length * 500_000;
      mesh.indices!.push(...ids);
      report.triangles++;
      for (const id of ids)
        for (let k: number = 0; k < 3; k++)
          mesh.normals![3 * id + k] += normal[k]!;
      const face: string = [...ids]
        .sort((a: number, b: number): number => a - b)
        .join(":");
      if (faces.has(face)) report.diagnostics.push("Repeated generated face");
      faces.add(face);
      for (let k: number = 0; k < 3; k++) {
        const a: number = ids[k]!,
          b: number = ids[(k + 1) % 3]!,
          key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        const edge: { uses: number; orientation: number } = edges.get(key) ?? {
          uses: 0,
          orientation: 0,
        };
        edge.uses++;
        edge.orientation += a < b ? 1 : -1;
        edges.set(key, edge);
      }
    }
    report.objectiveDiscrepancyMm2 = Math.abs(
      report.areaMm2 - pair.objectiveAreaMm2,
    );
    if (report.omittedTriangles)
      report.diagnostics.push(
        "Unrepresentable or collapsed generated triangles omitted",
      );
    reports.push(report);
  }
  for (let i: number = 0; i < mesh.normals!.length; i += 3) {
    const length: number = Math.hypot(
      mesh.normals![i]!,
      mesh.normals![i + 1]!,
      mesh.normals![i + 2]!,
    );
    if (length > 0 && Number.isFinite(length))
      for (let k: number = 0; k < 3; k++) mesh.normals![i + k] /= length;
    else {
      mesh.normals![i] = 0;
      mesh.normals![i + 1] = 0;
      mesh.normals![i + 2] = 0;
      diagnostics.push(`Unresolved generated normal at vertex ${i / 3}`);
    }
  }
  const badEdges: number = [...edges.values()].filter(
    (edge: { uses: number; orientation: number }): boolean =>
      edge.uses > 2 || (edge.uses === 2 && edge.orientation !== 0),
  ).length;
  if (badEdges)
    diagnostics.push(
      `${badEdges} generated edges have unqualified oriented incidence`,
    );
  diagnostics.push(
    "Open pilot slab boundaries retained; polygon simplicity, self-intersection, source fidelity and optimizer correctness are not certified",
  );
  return { mesh, construction, pairs: reports, diagnostics };
}
