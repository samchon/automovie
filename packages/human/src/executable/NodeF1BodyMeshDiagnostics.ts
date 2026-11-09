import { HumanInspectionMeshDefects } from "../inspection/HumanInspectionMeshDefects";

type V3 = [number, number, number];

/** Mesh defect counts and crossing locations for the historical body report. */
export namespace NodeF1BodyMeshDiagnostics {
  /** Results used in the existing body report and acceptance gates. */
  export interface IResult {
    /** Finding counts by defect kind and by the construction face involved. */
    mesh: Record<string, { count: number; byFace: Record<string, number> }>;
    /** World-mm crossing bounds, median, and partner counts for each first face. */
    where: Record<string, { box: [V3, V3]; median: V3; partners: Record<string, number> }>;
    /** Signed enclosed volume in cubic millimetres, positive for outward winding. */
    enclosed: number;
  }

  /** Inspect the emitted triangle indices and preserve their original face attribution. */
  export function inspect(p: number[], ix: number[], faceOf: (triangle: number) => string, at: (i: number) => V3): IResult {
    // f1_tests' universal mesh detectors on the skin itself, counted per face:
    // open, non-manifold and inconsistently wound edges; degenerate triangles
    // and slivers (aspect over 20, a declared detection bound); crossing
    // triangle pairs (self-intersection); the enclosed volume's sign.
    const skinMesh: HumanInspectionMeshDefects.IMesh = { positions: p, indices: ix };
    const byFace: (triangles: number[]) => Record<string, number> = (triangles: number[]): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const t of triangles) out[faceOf(t)] = (out[faceOf(t)] ?? 0) + 1;
      return out;
    };
    const edgeFindings: HumanInspectionMeshDefects.IEdgeFinding[] = HumanInspectionMeshDefects.edges(skinMesh);
    const triangleFindings: HumanInspectionMeshDefects.ITriangleFinding[] = HumanInspectionMeshDefects.triangles(skinMesh, 20);
    // The crossing detector keeps every candidate pair of the mesh it is
    // given in one Set, which passes the runtime's Set limit (2^24 entries)
    // on a whole-body skin (run 9: "Set maximum size exceeded"). It runs per
    // height slab instead: a slab's sub-mesh holds every triangle whose
    // height range meets the slab (positions shared, indices subset), so any
    // two triangles whose boxes overlap share a slab; a pair found in two
    // slabs counts once. Slabs: equal heights, one per 20000 triangles.
    const crossingFindings: HumanInspectionMeshDefects.ICrossing[] = [];
    {
      const count: number = Math.floor(ix.length / 3);
      const lows: number[] = [];
      const highs: number[] = [];
      for (let t: number = 0; t < count; ++t) {
        const ys: number[] = [p[3 * ix[3 * t]! + 1]!, p[3 * ix[3 * t + 1]! + 1]!, p[3 * ix[3 * t + 2]! + 1]!];
        lows.push(Math.min(...ys));
        highs.push(Math.max(...ys));
      }
      const bottom: number = lows.reduce((a: number, b: number): number => Math.min(a, b), Infinity);
      const top: number = highs.reduce((a: number, b: number): number => Math.max(a, b), -Infinity);
      const slabs: number = Math.max(1, Math.ceil(count / 20000));
      const height: number = (top - bottom) / slabs;
      const seen: Set<string> = new Set();
      for (let s: number = 0; s < slabs; ++s) {
        const [lo, hi]: [number, number] = [bottom + s * height, s + 1 === slabs ? Infinity : bottom + (s + 1) * height];
        const members: number[] = [];
        for (let t: number = 0; t < count; ++t) if (highs[t]! >= lo && lows[t]! <= hi) members.push(t);
        const indices: number[] = [];
        for (const t of members) indices.push(ix[3 * t]!, ix[3 * t + 1]!, ix[3 * t + 2]!);
        for (const c of HumanInspectionMeshDefects.crossings({ positions: p, indices })) {
          const pair: [number, number] = [members[c.triangles[0]]!, members[c.triangles[1]]!];
          const key: string = `${Math.min(...pair)},${Math.max(...pair)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          crossingFindings.push({ triangles: pair });
        }
      }
    }
    const enclosed: number = HumanInspectionMeshDefects.volume(skinMesh);
    const mesh: Record<string, { count: number; byFace: Record<string, number> }> = {};
    for (const kind of ["open", "non-manifold", "inconsistent"] as const) {
      const found: HumanInspectionMeshDefects.IEdgeFinding[] = edgeFindings.filter((e: HumanInspectionMeshDefects.IEdgeFinding): boolean => e.kind === kind);
      mesh[`edges ${kind}`] = { count: found.length, byFace: byFace(found.map((e: HumanInspectionMeshDefects.IEdgeFinding): number => e.triangles[0]!)) };
    }
    for (const kind of ["degenerate", "sliver"] as const) {
      const found: HumanInspectionMeshDefects.ITriangleFinding[] = triangleFindings.filter((f: HumanInspectionMeshDefects.ITriangleFinding): boolean => f.kind === kind);
      mesh[`triangles ${kind}`] = { count: found.length, byFace: byFace(found.map((f: HumanInspectionMeshDefects.ITriangleFinding): number => f.triangle)) };
    }
    mesh["self-intersecting triangle pairs"] = { count: crossingFindings.length, byFace: byFace(crossingFindings.map((c: HumanInspectionMeshDefects.ICrossing): number => c.triangles[0])) };
    // Where the crossings lie: per face of the pair's first triangle, the
    // centroids' box and median (world mm) and the faces of their partners.
    const where: Record<string, { box: [V3, V3]; median: V3; partners: Record<string, number> }> = {};
    {
      const groupsOf: Map<string, { centres: V3[]; partners: Record<string, number> }> = new Map();
      for (const c of crossingFindings) {
        const face: string = faceOf(c.triangles[0]);
        const t: number = c.triangles[0];
        const centre: V3 = [0, 1, 2].map((i: number): number => (at(ix[3 * t]!)[i]! + at(ix[3 * t + 1]!)[i]! + at(ix[3 * t + 2]!)[i]!) / 3) as V3;
        const g: { centres: V3[]; partners: Record<string, number> } = groupsOf.get(face) ?? { centres: [], partners: {} };
        g.centres.push(centre);
        const other: string = faceOf(c.triangles[1]);
        g.partners[other] = (g.partners[other] ?? 0) + 1;
        groupsOf.set(face, g);
      }
      for (const [face, g] of groupsOf) {
        const axis: (i: number) => number[] = (i: number): number[] => g.centres.map((p: V3): number => p[i]!).sort((x: number, y: number): number => x - y);
        const [xs, ys, zs]: number[][] = [axis(0), axis(1), axis(2)];
        const round: (v: number) => number = (v: number): number => Math.round(v);
        where[face] = {
          box: [
            [round(xs[0]!), round(ys[0]!), round(zs[0]!)],
            [round(xs[xs.length - 1]!), round(ys[ys.length - 1]!), round(zs[zs.length - 1]!)],
          ],
          median: [round(xs[xs.length >> 1]!), round(ys[ys.length >> 1]!), round(zs[zs.length >> 1]!)],
          partners: g.partners,
        };
      }
    }
    return { mesh, where, enclosed };
  }
}
