import {
  type AutoMovieConstructionRealization,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A continuation with a band joins two faces whose sections have different orders: the part keeps its own sections, and a band spans
 * from the host's end ring to the part's ring at the rail, sharing both rings vertex for vertex and meeting both faces with their tangent
 * planes.
 *
 * Scenarios:
 * 1. Red: a cylinder of radius 0.02 m and order 16 continued at its top by a cylinder of radius 0.015 m and order 32, with no band: the
 *    equal-order continuation refuses it with a diagnostic.
 * 2. The same two with a band (rail 0.03 m, 64 columns, 24 rows): no diagnostic; the skin's only open edges lie on the host's free end
 *    (z = 0) and the part's (z = -0.16 m), so the band shares both rings; and across the host's end ring (z = -0.1 m) and the part's rail
 *    ring (z = -0.13 m) no two neighbouring triangles fold by 4 degrees (0.15 measured). A band meeting them along its chord, the cone
 *    from radius 0.02 to 0.015 m over 0.03 m, would fold by 9.5 degrees at each ring.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes both trees with `realizeAutoMovieConstruction` and reads the diagnostics and the returned skin: its open edges and the dihedral between triangles meeting along the two rings.
 * @evidence contracts/development/testing.md#independent-expectations The orders are the view parts' own (16 and 32), which the equal-order continuation's contract refuses; the band's contract (G2 to both sides) predicts no fold across either ring beyond the mesh's own, and the chord's alternative folds by `atan(5 / 30)`, 9.5 degrees; open edges of a skin whose faces share their rings lie on its free ends only.
 * @evidence contracts/development/testing.md#distinguishing-cases Negative: the unequal ends without a band. Positive: with one. A band that welded nothing would leave open edges on the rings; one that met the faces at an angle would fold across them.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_continuation_band`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each naming its input and the behavior it pins.
 */
export function test_construction_continuation_band(): void {
  const failures: string[] = [];
  const host: IAutoMovieConstructionView = ConstructionShapes.cylinder("trunk", ConstructionShapes.DOWN, 0.02, 0.1);
  const part: IAutoMovieConstructionView = { ...ConstructionShapes.cylinder("neck", { ...ConstructionShapes.DOWN, origin: { x: 0, y: 0, z: -0.1 } }, 0.015, 0.06), order: 32 };
  const tree = (band: boolean): AutoMovieConstructionNode => ({
    type: "continue",
    name: "join.neck",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    part,
    partFace: "neck",
    partEnd: "bottom",
    ...(band ? { band: { rail: 0.03, count: 64, rows: 24 } } : {}),
  });

  // 1. Without a band.
  const plain: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "plain", root: tree(false) }, { chord: 1e-4 });
  if (plain.diagnostics.length === 0) failures.push("unequal orders without a band were not refused, so the case does not test the band");

  // 2. With a band.
  const banded: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "banded", root: tree(true) }, { chord: 1e-4 });
  if (banded.diagnostics.length !== 0) failures.push(`band: diagnostics ${JSON.stringify(banded.diagnostics)}`);
  const m = banded.mesh;
  const at = (v: number): number[] => [m.positions[3 * v]!, m.positions[3 * v + 1]!, m.positions[3 * v + 2]!];
  const key = (v: number): string => at(v).map((x: number): number => Math.round(x * 1e8)).join(",");
  const edges: Map<string, { ends: number[]; triangles: number[] }> = new Map();
  for (let t: number = 0; t < m.indices.length; t += 3)
    for (let k: number = 0; k < 3; ++k) {
      const [a, b] = [m.indices[t + k]!, m.indices[t + ((k + 1) % 3)]!];
      const id: string = [key(a), key(b)].sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0)).join("/");
      const edge = edges.get(id) ?? { ends: [a, b], triangles: [] };
      edge.triangles.push(t);
      edges.set(id, edge);
    }
  const normal = (t: number): number[] => {
    const [p, q, r] = [0, 1, 2].map((k: number): number[] => at(m.indices[t + k]!)) as [number[], number[], number[]];
    const u: number[] = [q[0]! - p[0]!, q[1]! - p[1]!, q[2]! - p[2]!];
    const w: number[] = [r[0]! - p[0]!, r[1]! - p[1]!, r[2]! - p[2]!];
    const n: number[] = [u[1]! * w[2]! - u[2]! * w[1]!, u[2]! * w[0]! - u[0]! * w[2]!, u[0]! * w[1]! - u[1]! * w[0]!];
    const l: number = Math.hypot(n[0]!, n[1]!, n[2]!);
    return n.map((x: number): number => x / l);
  };
  let open: number = 0;
  let fold: number = 0;
  for (const edge of edges.values()) {
    const z: number[] = edge.ends.map((v: number): number => at(v)[2]!);
    if (edge.triangles.length === 1) {
      if (!z.every((x: number): boolean => Math.abs(x) < 1e-9 || Math.abs(x + 0.16) < 1e-9)) ++open;
      continue;
    }
    const onRing: boolean = z.every((x: number): boolean => Math.abs(x + 0.1) < 1e-7) || z.every((x: number): boolean => Math.abs(x + 0.13) < 1e-7);
    if (!onRing || edge.triangles.length !== 2) continue;
    const [n1, n2] = [normal(edge.triangles[0]!), normal(edge.triangles[1]!)] as [number[], number[]];
    fold = Math.max(fold, (Math.acos(Math.max(-1, Math.min(1, n1[0]! * n2[0]! + n1[1]! * n2[1]! + n1[2]! * n2[2]!))) * 180) / Math.PI);
  }
  if (open !== 0) failures.push(`band: ${open} edges are open away from the free ends, so a ring is not shared`);
  if (!(fold < 4)) failures.push(`band: the skin folds by ${fold.toFixed(2)} degrees across a ring, not G1`);
  if (failures.length !== 0) throw new Error(`${failures.length} continuation band failures:\n${failures.join("\n")}`);
}
