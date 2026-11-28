import type {
  AutoMovieVector3Tuple,
  IAutoMovieMesh,
  IAutoMovieTessellateContourPath64,
} from "@automovie/interface";

import { binary64SumProductsSign } from "../../../math/internal/binary64SumProductsSign";

/*
 * Emit the saved strip using the input's physical vertex order. Each step
 * advances one ring. Incidence diagnostics qualify the generated topology
 * separately from the face emission.
 */
export function tessellateContourPath64(
  input: IAutoMovieTessellateContourPath64.IInput,
): IAutoMovieTessellateContourPath64.IResult {
  if (!input.topologyDomain.trim())
    throw new Error("A generated physical identity domain is required");
  const polygons: Map<string, (typeof input.polygons)[number]> = new Map();
  for (const polygon of input.polygons) {
    if (
      !polygon.id ||
      polygons.has(polygon.id) ||
      !Number.isFinite(polygon.stationMm) ||
      polygon.pointsMm.length < 3
    )
      throw new Error("Unique finite Y-plane polygons are required");
    for (const point of polygon.pointsMm)
      if (
        !Array.isArray(point) ||
        point.length !== 3 ||
        !Number.isFinite(point[0]) ||
        point[1] !== polygon.stationMm ||
        !Number.isFinite(point[2])
      )
        throw new Error("Unique finite Y-plane polygons are required");

    // Only the sign of twice the projected area is needed. Keep the
    // products in the saved coordinates so that neither translating the
    // ring nor rounding its area can change its admitted winding.
    const products: [number, number][] = [];
    for (const [i, point] of polygon.pointsMm.entries()) {
      const next: Readonly<AutoMovieVector3Tuple> =
        polygon.pointsMm[(i + 1) % polygon.pointsMm.length]!;
      if (point[0] === next[0] && point[2] === next[2])
        throw new Error("A polygon has a collapsed boundary edge");
      products.push([point[0], next[2]], [-next[0], point[2]]);
    }
    if (binary64SumProductsSign(products) !== 1)
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
      /[^PQ]/.test(pair.steps) ||
      pair.steps.length !== p.pointsMm.length + q.pointsMm.length ||
      [...pair.steps].filter((step: string): boolean => step === "P").length !==
        p.pointsMm.length ||
      !Number.isFinite(pair.objectiveAreaMm2) ||
      pair.objectiveAreaMm2 < 0
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
    construction: IAutoMovieTessellateContourPath64.IConstructionPolygon[] =
      [];
  for (const polygon of input.polygons) {
    offsets.set(polygon.id, mesh.positions.length / 3);
    const points: [number, number, number][] = polygon.pointsMm.map(
      (point: Readonly<AutoMovieVector3Tuple>): [number, number, number] => [
        point[0] * 0.001,
        point[1] * 0.001,
        point[2] * 0.001,
      ],
    );
    for (const point of points) {
      const id: number = mesh.positions.length / 3;
      mesh.positions.push(...point);
      mesh.normals!.push(0, 0, 0);
      mesh.physicalVertices!.sources.push({ domain: input.topologyDomain, id });
      mesh.physicalVertices!.vertices.push(id);
    }
    construction.push({ id: polygon.id, points: [...points, points[0]!] });
  }
  const reports: IAutoMovieTessellateContourPath64.IPairResult[] = [];
  const edges: Map<string, { uses: number; orientation: number }> = new Map(),
    faces: Set<string> = new Set(),
    diagnostics: string[] = [];
  for (const pair of input.pairs) {
    const p: (typeof input.polygons)[number] = polygons.get(pair.pId)!,
      q: (typeof input.polygons)[number] = polygons.get(pair.qId)!;
    const po: number = offsets.get(pair.pId)!,
      qo: number = offsets.get(pair.qId)!;
    const report: IAutoMovieTessellateContourPath64.IPairResult = {
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
      // The norm is twice the area in square metres.
      const areaMm2: number = Math.hypot(...normal) * 500_000;
      if (!Number.isFinite(areaMm2) || areaMm2 <= 0) {
        report.omittedTriangles++;
        continue;
      }
      const pairAreaMm2: number = report.areaMm2 + areaMm2;
      if (!Number.isFinite(pairAreaMm2))
        throw new Error(`Contour pair "${pair.id}" area must remain finite`);
      report.areaMm2 = pairAreaMm2;
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
    if (Number.isFinite(length) && length > 0)
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
