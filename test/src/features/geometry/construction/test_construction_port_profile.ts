import {
  type AutoMovieConstructionRealization,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionPort,
} from "@automovie/interface";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A port's band with a cross profile is carried in along its own normal over its clock window, by the profile's depth across the band,
 * and keeps both rails' 2-jets.
 *
 * Fixture (metres): `test_construction_port`'s cylinder host of radius 0.02 with its port curve about station 0.05 and phase 0, semi-axes
 * 0.01 m and 0.45 rad, and its part cylinder of radius 0.007 along `+x`, its rail 0.02 m in; 32 columns, 4 rows. The profile: one knot,
 * depth 2 mm at the share 0.5, over the clock window `[-0.4, 0.4]` with a transition of 0.6 rad.
 *
 * Scenarios:
 * 1. Both the plain and the profiled port realize with no diagnostic, faces `arm,band.port,trunk`, and the profiled skin is watertight away
 *    from the free ends.
 * 2. Depth: at every column inside the window, the profiled band's point at half its span stands 2 mm from the plain band's point there,
 *    along the plain band's inward unit normal (its station derivative crossed with its phase derivative, turned by the chain's
 *    orientation), within 1e-6 mm.
 * 3. Outside the window, more than its transition from it, the profiled band's points at the shares 0.25, 0.5 and 0.75 are the plain
 *    band's within 1e-9 mm.
 * 4. Rails kept: at every column the profiled band's point and its station first and second derivatives at both rails are the plain
 *    band's within 1e-9.
 * 5. Flat ends: at the column of clock 0 the depth read along the band at the shares 0.02 and 0.98 is under 2 % of 2 mm, and at 0.25 it
 *    lies between 0.3 and 1.9 mm.
 * 6. Admission: a knot at the share 1, and a transition of 0, are each refused.
 * 7. Red: the depth check of scenario 2 read against the plain band fails.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes port trees with `realizeAutoMovieConstruction` and reads both bands' surfaces and the skin. It catches a profile that is ignored, one that moves the rails, one that leaks outside its window, one whose depth runs the wrong way and an open skin.
 * @evidence contracts/development/testing.md#independent-expectations The plain band realized without the profile is the reference: the depth is measured against its point and its own normal, read from its surface; the window's outside and the rails must equal it.
 * @evidence contracts/development/testing.md#distinguishing-cases One window with clocks inside, in its transition and outside; both rails; the share's middle and its ends; two refused inputs; and the plain band as the red reading.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_port_profile`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Both the plain and the profiled port realize with no diagnostic, faces `arm,band.port,trunk`, and the profiled skin is watertight away from the free ends.).
 */
export function test_construction_port_profile(): void {
  const failures: string[] = [];
  const n: number = 32;
  const clock: (k: number) => number = (k: number): number => (2 * Math.PI * k) / n;
  const host: AutoMovieConstructionNode = ConstructionShapes.cylinder("trunk", ConstructionShapes.DOWN, 0.02, 0.1);
  const arm: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "arm",
    { origin: { x: 0.012, y: 0, z: -0.05 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } },
    0.007,
    0.06,
    7,
  );
  const window: Omit<IAutoMovieConstructionPort.IProfile, "knots"> = { start: -0.4, end: 0.4, transition: 0.6 };
  const port = (profiles?: IAutoMovieConstructionPort.IProfile[]): IAutoMovieConstructionPort => ({
    type: "port",
    name: "port.arm",
    host,
    hostFace: "trunk",
    loop: { centre: [0.05, 0], semi: [0.01, 0.45], sense: 1 },
    band: "band.port",
    part: arm,
    partFace: "arm",
    partEnd: "bottom",
    rail: 0.02,
    count: n,
    rows: 4,
    ...(profiles === undefined ? {} : { profiles }),
  });
  const realize = (root: AutoMovieConstructionNode): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const sub = (a: readonly number[], b: readonly number[]): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: readonly number[], b: readonly number[]): V3 => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const len = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);

  // 1. Both trees.
  const plain: AutoMovieConstructionRealization.IRealization = realize(port());
  const shaped: AutoMovieConstructionRealization.IRealization = realize(port([{ knots: [[0.5, 0.002]], ...window }]));
  for (const [label, real] of [["plain", plain], ["profiled", shaped]] as const) {
    if (real.diagnostics.length !== 0) failures.push(`${label} diagnostics: ${ConstructionRead.diagnostics(real)}`);
    const names: string = real.body.faces
      .map((f: { chain: string }): string => f.chain)
      .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
      .join(",");
    if (names !== "arm,band.port,trunk") failures.push(`${label} faces: ${names}`);
  }
  const uses: Map<string, number> = new Map();
  const ix: number[] = shaped.mesh.indices;
  for (let t: number = 0; t + 2 < ix.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free = (v: number): boolean => {
    const x: number = shaped.mesh.positions[3 * v]!;
    const z: number = shaped.mesh.positions[3 * v + 2]!;
    return Math.abs(z) < 1e-7 || Math.abs(z + 0.1) < 1e-7 || Math.abs(x - 0.072) < 1e-7;
  };
  let open: number = 0;
  for (const [key, count] of uses) if (count > 2 || (count === 1 && !key.split(",").every((v: string): boolean => free(Number(v))))) ++open;
  if (open !== 0) failures.push(`profiled skin: ${open} edges open away from the free ends or in more than two triangles`);

  const before: IAutoMovieSolidSurface = ConstructionRead.surface(plain, "band.port");
  const after: IAutoMovieSolidSurface = ConstructionRead.surface(shaped, "band.port");
  const span = (real: AutoMovieConstructionRealization.IRealization): number =>
    real.chains.find((c: { name: string }): boolean => c.name === "band.port")?.layers.at(-1)?.y ?? NaN;
  const L: number = span(plain);
  if (!(Math.abs(span(shaped) - L) <= 1e-9)) failures.push(`the profiled band's span ${span(shaped)} mm is not the plain band's ${L} mm`);

  // The depth of a surface's point below the plain band's, along the plain band's inward unit normal.
  const depth = (surface: IAutoMovieSolidSurface, t: number, c: number): { along: number; aside: number } => {
    const base: IAutoMovieSolidSurface.IJet = before.jet(t * L, c);
    const outward: V3 = cross(base.u, base.v);
    const unit: V3 = outward.map((x: number): number => (x * before.orientation) / len(outward)) as V3;
    const gap: V3 = sub(surface.jet(t * L, c).p, base.p);
    const along: number = -dot(gap, unit);
    return { along, aside: len(sub(gap, unit.map((x: number): number => -x * along))) };
  };

  // 2 and 7. Inside the window.
  const inside = (surface: IAutoMovieSolidSurface, label: string): string[] => {
    const out: string[] = [];
    for (let k: number = 0; k < n; ++k) {
      const c: number = clock(k);
      if (!(c <= 0.4 || c >= 2 * Math.PI - 0.4)) continue;
      const { along, aside }: { along: number; aside: number } = depth(surface, 0.5, c);
      if (!(Math.abs(along - 2) <= 1e-6 && aside <= 1e-6)) out.push(`${label} column ${k}: ${along} mm in and ${aside} mm aside at half the span, not 2 mm in`);
    }
    return out;
  };
  failures.push(...inside(after, "profiled"));
  if (inside(before, "plain").length === 0) failures.push("red: the plain band reads 2 mm in inside the window");

  // 3. Outside the window and its transition.
  for (let k: number = 0; k < n; ++k) {
    const c: number = clock(k);
    if (c < 1.1 || c > 2 * Math.PI - 1.1) continue;
    for (const t of [0.25, 0.5, 0.75]) {
      const gap: number = len(sub(after.jet(t * L, c).p, before.jet(t * L, c).p));
      if (!(gap <= 1e-9)) failures.push(`column ${k} outside the window: ${gap} mm off the plain band at the share ${t}`);
    }
  }

  // 4. Rails.
  for (let k: number = 0; k < n; ++k)
    for (const s of [0, L]) {
      const p: IAutoMovieSolidSurface.IJet = after.jet(s, clock(k));
      const q: IAutoMovieSolidSurface.IJet = before.jet(s, clock(k));
      const gap: number = Math.max(len(sub(p.p, q.p)), len(sub(p.u, q.u)), len(sub(p.uu, q.uu)));
      if (!(gap <= 1e-9)) failures.push(`column ${k} at station ${s}: the rail's 2-jet moved by ${gap}`);
    }

  // 5. Flat ends.
  const ends: number[] = [0.02, 0.98].map((t: number): number => Math.abs(depth(after, t, 0).along));
  if (!ends.every((d: number): boolean => d <= 0.04)) failures.push(`the depth near the rails is ${ends.join(", ")} mm, not flat`);
  const quarter: number = depth(after, 0.25, 0).along;
  if (!(quarter >= 0.3 && quarter <= 1.9)) failures.push(`the depth at a quarter of the span is ${quarter} mm`);

  // 6. Admission.
  const refusals: [string, IAutoMovieConstructionPort.IProfile][] = [
    ["a knot at the share 1", { knots: [[1, 0.002]], ...window }],
    ["a transition of 0", { knots: [[0.5, 0.002]], ...window, transition: 0 }],
  ];
  for (const [label, bad] of refusals) {
    let refused: boolean = false;
    try {
      refused = realize(port([bad])).diagnostics.length > 0;
    } catch {
      refused = true;
    }
    if (!refused) failures.push(`${label} was admitted`);
  }

  if (failures.length !== 0) throw new Error(`test_construction_port_profile:\n${failures.join("\n")}`);
}
