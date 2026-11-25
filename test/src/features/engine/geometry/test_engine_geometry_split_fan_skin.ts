import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionSplitFan as F } from "../../internal/construction/ConstructionSplitFan";

/**
 * The fan split's skin is watertight, and its rows are as fine as its columns
 * at the loop.
 *
 * Fixture: `ConstructionSplitFan`, three children, realized with its skin at
 * chord 1e-4 m.
 *
 * Scenarios:
 *
 * 1. Every edge of the skin is used by exactly two triangles except the edges on
 *    the four free ends (z = 0.06 and z = -0.09 m), and none by more.
 * 2. Every band's mesh has a row of its own vertices no farther from its loop,
 *    along its station, than the loop's columns stand apart on average, and
 *    short of a quarter of its span.
 */
export function test_engine_geometry_split_fan_skin(): void {
  const n: number = F.COLUMNS;
  const real = F.realize(F.split({ outer: F.OUTER }), true);
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let i: number = 0; i + 2 < ix.length; i += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[i + e]!;
      const b: number = ix[i + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free = (v: number): boolean =>
    [0.06, -0.09].some(
      (z: number): boolean =>
        Math.abs(real.mesh.positions[3 * v + 2]! - z) < 1e-7,
    );
  let open: number = 0;
  let over: number = 0;
  for (const [key, count] of uses) {
    if (count > 2) ++over;
    if (
      count === 1 &&
      !key.split(",").every((v: string): boolean => free(Number(v)))
    )
      ++open;
  }
  TestValidator.equals("open edges", open, 0);
  TestValidator.equals("over-used edges", over, 0);

  for (const name of ["band.f.0", "band.f.1", "band.f.2"]) {
    const band = ConstructionRead.surface(real, name);
    const owner: number = real.mesh.owners.indexOf(name);
    let perimeter: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const p = band.jet(0, (F.TURN * k) / n).p;
      const q = band.jet(0, (F.TURN * (k + 1)) / n).p;
      perimeter += Math.hypot(q[0]! - p[0]!, q[1]! - p[1]!, q[2]! - p[2]!);
    }
    const rows: number[] = [];
    for (let v: number = 0; 3 * v < real.mesh.coordinates.length; ++v)
      if (
        real.mesh.coordinates[3 * v] === owner &&
        real.mesh.coordinates[3 * v + 1]! > 1e-9
      )
        rows.push(real.mesh.coordinates[3 * v + 1]!);
    const first: number = Math.min(...rows);
    TestValidator.predicate(
      `${name} first row near the loop`,
      first <= (1 + 1e-9) * (perimeter / n),
    );
    TestValidator.predicate(
      `${name} first row within a quarter span`,
      first < band.domain![1] / 4,
    );
  }
}
