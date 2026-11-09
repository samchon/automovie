import { type AutoMovieConstructionRealization, type IAutoMovieSolidSurface, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionSplit } from "@automovie/interface";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A split realizes one open end of its host as two children's loops along a shared seam chord, each spanned to its child's rail by a band that copies both sides' 2-jets, the whole skin watertight.
 *
 * Fixture (metres, the `DOWN` frame: chart `u = +x`, `v = +y`, stations advancing along `-z`): the host `trunk` is the body of revolution of radius `0.025 sqrt(1 - (s / 0.08)^2)` over stations `[-0.06, 0.03]`, open at both ends; its top end (station 0.03, `z = -0.03`) is split along the seam `[0, pi]`, the chord on `y = 0`. The children `leg.a` and `leg.b` hang from `z = -0.03` with axes at `y = +0.0105` and `y = -0.0105`, radius `0.008 + 0.002 (2 s / 0.08 - 1)^2` over `[0, 0.08]`; each rail is 0.03 m into its child. Columns 32, rows 4.
 *
 * Scenarios:
 * 1. No diagnostic; the body's faces are exactly the host, both children and both bands.
 * 2. Host arc (columns 0 to 16 of each band): the band's station-0 point is the host's knot circle at the column's host phase, `(R cos phi, R sin phi, -30)` mm with `R = 25 sqrt(1 - (30 / 80)^2)`, within 1e-6 mm; its station derivative is parallel to the host's station derivative out of the host and its `uu / |u|^2` equals the host's `S_uu / |S_u|^2`, within 1e-9 (the copied 2-jet).
 * 3. Chord (columns 17 to 31): the band's station-0 point is on the straight chord between the arc's end points at the column's share, within 1e-6 mm; its station derivative lies in the end section's plane square to the chord toward the band's own arc, `(0, 1, 0)` for band a (arc on `y > 0`) and `(0, -1, 0)` for band b, within 1e-9, so the bands meet G1 across the chord; its second derivative vanishes.
 * 4. Child rail (station `L`, every column): the band's point lies on the child's knot circle at station 30 mm (`z = -60` mm, radius 8.125 mm about its axis), within 1e-6 mm, and its cross 2-jet is the child's at that point into the child, within 1e-9.
 * 5. Shared boundary identity in the published body: the chord's inner points are the same point ids in both bands' start cycles (band a's column `k` is band b's `48 - k`), each arc's end corner is the other band's start corner, the host's end cycle holds exactly both arcs' points, and each child's rail cycle holds exactly its band's end-cycle points.
 * 6. The skin is watertight: every edge is used by exactly two triangles except the edges on the three free ends (`z = 0.06`, `z = -0.11` m), and none by more.
 * 7. Crease: with band a's window `[pi/4, pi/2]` and transition `pi/8`, the band arrives along its column chord at column 6 (C0: more than 0.01 rad from the child's direction) and with the child's own 2-jet at columns 0, 1 and 11 to 16.
 * 8. Refusals: a seam `[pi, 0]` is refused by admission; a rail of 0.5 m outside the child leaves one diagnostic on the split and no band, child or host end cycle; a child whose rail ring's centroid lies outside its loop (both children on `y = +0.0105`) is refused with the loop's turn.
 * 9. Red: the arc check read against the host's station 0 instead of its end fails.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes split trees with `realizeAutoMovieConstruction` and reads the bands', host's and children's realized surfaces, the published body's cycles and the skin mesh. It catches a band that misses the host ring or the child's rail, a band whose cross derivatives are not the sides' (a crease or curvature step), a chord ruled in the wrong direction, a chord duplicated instead of shared, an open skin, a crease that is ignored or applied outside its window, and a refusal that leaves partial geometry; any band that copies both rails' 2-jets on the declared loop passes.
 * @evidence contracts/testing.md#independent-expectations Points come from the fixture's closed forms at knot stations, where the view loft's section is the exact circle (ConstructionShapes); cross jets from the node contract (each side's own 2-jet, scale-free as `uu / |u|^2`) read on the sides' realized surfaces, which the split does not produce; watertightness from the manifold rule that an interior edge bounds two triangles. Oracle limit: between columns the band is the strip's B-spline and is not asserted here.
 * @evidence contracts/testing.md#distinguishing-cases Positive tree, a crease window against columns outside its transition, the boundary columns 0 and 16 at the seam's corners, and three refusals (admission, rollback, nonmonotone loop) plus a red reading. Join blends belong to the join tests; the strip's between-column bound belongs to `AutoMovieSolidBlendChain`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_split`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_split(): void {
  const failures: string[] = [];
  const turn: number = 2 * Math.PI;
  const n: number = 32;
  const m: number = n / 2;
  const clock: (k: number) => number = (k: number): number => (turn * k) / n;
  const R: number = 25 * Math.sqrt(1 - (30 / 80) ** 2);

  const host: AutoMovieConstructionNode = ConstructionShapes.part("trunk", ConstructionShapes.DOWN, ConstructionShapes.uniform(-0.06, 0.03, 13), (s: number): [number, number, number, number] => {
    const r: number = 0.025 * Math.sqrt(1 - (s / 0.08) ** 2);
    return [r, r, r, r];
  }, "open");
  const leg: (name: string, y: number) => AutoMovieConstructionNode = (name: string, y: number): AutoMovieConstructionNode =>
    ConstructionShapes.part(name, { ...ConstructionShapes.DOWN, origin: { x: 0, y, z: -0.03 } }, ConstructionShapes.uniform(0, 0.08, 9), (s: number): [number, number, number, number] => {
      const r: number = 0.008 + 0.002 * (2 * (s / 0.08) - 1) ** 2;
      return [r, r, r, r];
    }, "open");
  const split: (options: { seam?: [number, number]; rail?: number; yb?: number; crease?: IAutoMovieConstructionSplit.ICrease }) => IAutoMovieConstructionSplit = (options: { seam?: [number, number]; rail?: number; yb?: number; crease?: IAutoMovieConstructionSplit.ICrease }): IAutoMovieConstructionSplit => ({
    type: "split",
    name: "split.legs",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    seam: options.seam ?? [0, Math.PI],
    count: n,
    rows: 4,
    children: [
      { band: "band.a", part: leg("leg.a", 0.0105), partFace: "leg.a", partEnd: "bottom", rail: options.rail ?? 0.03, ...(options.crease === undefined ? {} : { crease: options.crease }) },
      { band: "band.b", part: leg("leg.b", options.yb ?? -0.0105), partFace: "leg.b", partEnd: "bottom", rail: options.rail ?? 0.03 },
    ],
  });
  const realize: (root: AutoMovieConstructionNode) => AutoMovieConstructionRealization.IRealization = (root: AutoMovieConstructionNode): AutoMovieConstructionRealization.IRealization => realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const sub: (a: readonly number[], b: readonly number[]) => V3 = (a: readonly number[], b: readonly number[]): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const len: (a: readonly number[]) => number = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);
  const scaled: (a: readonly number[], k: number) => V3 = (a: readonly number[], k: number): V3 => [a[0]! * k, a[1]! * k, a[2]! * k];
  const angle: (a: readonly number[], b: readonly number[]) => number = (a: readonly number[], b: readonly number[]): number => len(sub(scaled(a, 1 / len(a)), scaled(b, 1 / len(b))));
  /** The cross jet's scale-free second derivative `uu / |u|^2`, mm^-1. */
  const bend: (j: IAutoMovieSolidSurface.IJet) => V3 = (j: IAutoMovieSolidSurface.IJet): V3 => scaled(j.uu, 1 / (len(j.u) * len(j.u)));

  // 1. The positive tree.
  const real: AutoMovieConstructionRealization.IRealization = realize(split({}));
  if (real.diagnostics.length !== 0) failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  if (names !== "band.a,band.b,leg.a,leg.b,trunk") failures.push(`faces: ${names}`);

  // 2-4. Every column of both bands.
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const arc: (station: number) => string[] = (station: number): string[] => {
    const out: string[] = [];
    for (const [name, alpha] of [["band.a", 0], ["band.b", Math.PI]] as const) {
      const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
      for (let k: number = 0; k <= m; ++k) {
        const phi: number = alpha + (Math.PI * k) / m;
        const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
        const h: IAutoMovieSolidSurface.IJet = trunk.jet(station, phi);
        const gap: number = len(sub(b.p, [R * Math.cos(phi), R * Math.sin(phi), -station]));
        if (!(gap <= 1e-6)) out.push(`${name} column ${k}: ${gap} mm off the host's circle at station ${station}`);
        if (!(angle(b.u, h.u) <= 1e-9)) out.push(`${name} column ${k}: cross direction ${angle(b.u, h.u)} off the host's`);
        if (!(len(sub(bend(b), bend(h))) <= 1e-9)) out.push(`${name} column ${k}: cross curvature ${len(sub(bend(b), bend(h)))} mm^-1 off the host's`);
      }
    }
    return out;
  };
  failures.push(...arc(30));
  // The chord on clocks (pi, 2 pi): band a's from (-R, 0) to (R, 0), band b's from (R, 0) to (-R, 0).
  for (const [name, x0] of [["band.a", -R], ["band.b", R]] as const) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    for (let k: number = m + 1; k < n; ++k) {
      const t: number = (k - m) / m;
      const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
      const gap: number = len(sub(b.p, [x0 - 2 * x0 * t, 0, -30]));
      if (!(gap <= 1e-6)) failures.push(`${name} chord column ${k}: ${gap} mm off the chord`);
      const side: V3 = name === "band.a" ? [0, 1, 0] : [0, -1, 0];
      if (!(angle(b.u, side) <= 1e-9)) failures.push(`${name} chord column ${k}: ruling ${angle(b.u, side)} off the end plane's direction toward its arc`);
      if (!(len(b.uu) <= 1e-9)) failures.push(`${name} chord column ${k}: second derivative ${len(b.uu)}`);
    }
  }
  const rail: (r: AutoMovieConstructionRealization.IRealization, name: string, child: string, y: number, k: number) => { gap: number; turn: number; bend: number; chord: number } = (r: AutoMovieConstructionRealization.IRealization, name: string, child: string, y: number, k: number): { gap: number; turn: number; bend: number; chord: number } => {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    const L: number = r.chains.find((c: { name: string }): boolean => c.name === name)!.layers[1]!.y;
    const b: IAutoMovieSolidSurface.IJet = band.jet(L, clock(k));
    const radial: number = Math.hypot(b.p[0], b.p[1] - y);
    const c: IAutoMovieSolidSurface.IJet = ConstructionRead.surface(r, child).jet(30, Math.atan2(b.p[1] - y, b.p[0]));
    return { gap: Math.max(Math.abs(radial - 8.125), Math.abs(b.p[2] + 60), len(sub(b.p, c.p))), turn: angle(b.u, c.u), bend: len(sub(bend(b), bend(c))), chord: angle(b.u, sub(b.p, band.jet(0, clock(k)).p)) };
  };
  for (const [name, child, y] of [["band.a", "leg.a", 0.0105 * 1000], ["band.b", "leg.b", -0.0105 * 1000]] as const)
    for (let k: number = 0; k < n; ++k) {
      const at: { gap: number; turn: number; bend: number } = rail(real, name, child, y, k);
      if (!(at.gap <= 1e-6)) failures.push(`${name} rail column ${k}: ${at.gap} mm off the child's circle`);
      if (!(at.turn <= 1e-9 && at.bend <= 1e-9)) failures.push(`${name} rail column ${k}: cross jet off the child's (${at.turn}, ${at.bend})`);
    }

  // 5. Shared boundary identity.
  const cycle: (face: string, kind: string) => number[] = (face: string, kind: string): number[] =>
    real.body.faces.find((f: { chain: string }): boolean => f.chain === face)?.cycles.find((c: { kind: string }): boolean => c.kind === kind)?.points ?? [];
  const startA: number[] = cycle("band.a", "start");
  const startB: number[] = cycle("band.b", "start");
  // Band a's chord point at clock index k (from (-R, 0)) is band b's at 3 n/2 - k (from (R, 0)).
  for (let k: number = m + 1; k < n; ++k) if (startA[k] === undefined || startA[k] !== startB[3 * m - k]) failures.push(`chord column ${k}: band a point ${startA[k]} is not band b's ${startB[3 * m - k]}`);
  if (startA[m] !== startB[0] || startB[m] !== startA[0]) failures.push("the seam's corners are not shared by both bands");
  const same: (a: number[], b: number[]) => boolean = (a: number[], b: number[]): boolean => a.length === b.length && [...a].sort((x: number, z: number): number => x - z).join() === [...b].sort((x: number, z: number): number => x - z).join();
  if (!same(cycle("trunk", "end"), [...startA.slice(0, m), ...startB.slice(0, m)])) failures.push("the host's end cycle is not both arcs' points");
  if (!same(cycle("leg.a", "start"), cycle("band.a", "end")) || !same(cycle("leg.b", "start"), cycle("band.b", "end"))) failures.push("a child's rail cycle is not its band's end cycle");

  // 6. Watertight skin.
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let t: number = 0; t + 2 < ix.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free: (v: number) => boolean = (v: number): boolean => [0.06, -0.11].some((z: number): boolean => Math.abs(real.mesh.positions[3 * v + 2]! - z) < 1e-7);
  let open: number = 0;
  let over: number = 0;
  for (const [key, count] of uses) {
    if (count > 2) ++over;
    if (count === 1 && !key.split(",").every((v: string): boolean => free(Number(v)))) ++open;
  }
  if (open !== 0 || over !== 0) failures.push(`skin: ${open} open edges away from the free ends, ${over} edges in more than two triangles`);

  // 7. Crease window on band a.
  const creased: AutoMovieConstructionRealization.IRealization = realize(split({ crease: { start: Math.PI / 4, end: Math.PI / 2, transition: Math.PI / 8 } }));
  if (creased.diagnostics.length !== 0) failures.push(`crease diagnostics: ${ConstructionRead.diagnostics(creased)}`);
  else {
    const inside: { turn: number; chord: number } = rail(creased, "band.a", "leg.a", 10.5, 6);
    if (!(inside.chord <= 1e-9 && inside.turn > 0.01)) failures.push(`crease column 6: arrival ${inside.chord} off the chord, ${inside.turn} rad from the child`);
    for (const k of [0, 1, 11, 12, 13, 14, 15, 16]) {
      const outside: { turn: number; bend: number } = rail(creased, "band.a", "leg.a", 10.5, k);
      if (!(outside.turn <= 1e-9 && outside.bend <= 1e-9)) failures.push(`crease column ${k}: outside the window the cross jet is off the child's (${outside.turn}, ${outside.bend})`);
    }
  }

  // 8. Refusals.
  try {
    realize(split({ seam: [Math.PI, 0] }));
    failures.push("a seam [pi, 0] was admitted");
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("seam"))) failures.push(`a seam [pi, 0] was refused for another reason: ${String(error)}`);
  }
  const deep: AutoMovieConstructionRealization.IRealization = realize(split({ rail: 0.5 }));
  const kept: string = deep.body.faces.map((f: { chain: string }): string => f.chain).join(",");
  if (!deep.diagnostics.some((d: { node: string }): boolean => d.node === "split.legs") || kept !== "trunk" || deep.body.faces[0]!.cycles.length !== 0) failures.push(`a rail outside the child left ${kept} with ${deep.body.faces[0]?.cycles.length} host cycles and diagnostics ${ConstructionRead.diagnostics(deep)}`);
  const astray: AutoMovieConstructionRealization.IRealization = realize(split({ yb: 0.0105 }));
  if (!astray.diagnostics.some((d: { node: string; detail: string }): boolean => d.node === "split.legs" && d.detail.includes("round the child's rail centroid"))) failures.push(`a loop that does not wind round its child's rail was admitted: ${ConstructionRead.diagnostics(astray)}`);

  // 9. Red: the arc read against the host's station 0.
  if (arc(0).length === 0) failures.push("proof: the bands' arcs read equal to the host's middle section");
  if (failures.length !== 0) throw new Error(`${failures.length} split failures:\n${failures.join("\n")}`);
}
