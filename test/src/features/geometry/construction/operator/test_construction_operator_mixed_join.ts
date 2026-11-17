import {
  AutoMovieConstructionWidths,
  type AutoMovieLoftContract,
  AutoMovieSolidBlend,
  AutoMovieSolidBody,
  AutoMovieSolidIntersection,
  AutoMovieSolidJoin,
  AutoMovieSolidRibbon,
  AutoMovieSolidSharedCurve,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import type { AutoMovieConstructionWidth } from "@automovie/interface";

import { ConstructionMound } from "../../../internal/construction/ConstructionMound";

type V3 = [number, number, number];
type IFrame = ConstructionMound.IFrame;
type IMound = ConstructionMound.IMound;
const { build, height, point, smoothstep, tilt }: typeof ConstructionMound = ConstructionMound;

/**
 * A mixed join: along one declared loop a mound runs on from its wall where the two are tangent and meets it in a fold elsewhere, and the
 * kernel reads each arc from the two surfaces.
 *
 * Made inputs, millimetres: the wall is the plane through `O` spanned by `e1`, `e2` with outward normal `e3`; the loop is its circle of
 * radius `a` about `O`; the mound is `P(s, phi) = O + (a - s) r(phi) + h e3`, `r` the radial unit vector, `s` the distance in from the loop
 * and `h = tau(phi) s + q s^2 / 2 + c s^3`. Its slope at the loop is `tau`, so the fold's turn there is `beta = atan(tau)`; the plane square to
 * the loop at a clock is the radial plane, in which the wall is a line and the mound the profile `h(s)`. `tau = T S(-sin(phi - phi0))`, `S`
 * the quintic smoothstep, is zero over the upper half turn, where the mound leaves the wall as `c s^3` (tangent, with the wall's own
 * curvature), and rises to `T = tan(0.88)` at the bottom, the fold measured under a breast.
 *
 * Scenarios:
 * 1. The cone `tau = T` all round, `q = c = 0`, fold radius 11 mm, no reach: every section is a wedge, so the rails are the contact
 *    circles of the ball of radius 11 mm rolling in the fold (centre `a + R tan(beta / 2)` out and `R` up, both rails `R` from it along
 *    their surfaces' normals), and the blend's middle point and curvature are the quintic Hermite's closed forms on that wedge.
 * 2. The mixed mound, reach 1.5 mm: admitted with no diagnostic; every point's arc is `smooth` exactly where `beta` is under the grazing
 *    angle; both chords are `hypot(reach, R tan(beta / 2))`, the reach itself over the tangent half; the host's rail stands that chord
 *    outside the loop and the part's that chord up its profile, at the stored clocks and between them; the blend leaves each surface in
 *    its tangent plane at four times the stored clocks, through both run-outs.
 * 3. The same mound with its own frame turned 0.7 rad about the wall's normal, and with the whole pair moved to a tilted frame and
 *    enlarged by a quarter: every arc, chord and rail follows by the same closed forms.
 * 4. Refusals by name: a mound lifted 0.5 mm off the loop (`shared loop`); a mound whose slope passes through zero, so it sinks under
 *    the wall over half the loop (`one kept side`); a profile curled toward the fold tighter than the fold's radius (`fold radius`, and
 *    admitted at a fifth of that curl); a fold width without a reach, which has no chord on the tangent half (`rails`).
 * 5. Controls: the traced join cannot follow the mixed mound's contact (no curve, or a reported grazing contact); on the cone, a band
 *    from the loop to a rail 1 mm up it, as a port spans it, turns the fold's 0.88 rad within that millimetre on a middle radius of
 *    2.39 mm by the Hermite's closed form, where the mixed join's blend between the ball's contacts turns on 8.61 mm.
 * 6. The mixed mound merged into a wall face by `AutoMovieSolidBody.merge` and drawn: the blend is published with no diagnostic, the
 *    wall is cut along the loop's circle enlarged by the host chord, the mound keeps the side past its rail, and the drawn mesh is a
 *    two-manifold whose only free edges lie on the open boundaries; a dropped and a doubled triangle are both found.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each contact with `AutoMovieSolidSharedCurve.create`, its width laws with `AutoMovieConstructionWidths.create` and the join with `AutoMovieSolidJoin.create`, then reads the arcs, the laws, the rails and the blend's columns. It catches a contact that cannot run through a tangent arc, a rail on the wrong side there, a fold term that does not run out, a chord not read from the surfaces, an arc pinned to a clock instead of following the part, and a refusal that is silent or misnamed.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is a closed form of the made surfaces: `beta = atan(tau)`; a circle of radius R tangent to two lines that meet at the turn beta touches each `R tan(beta / 2)` from their point; the profile's point at a chord is the root of `s^2 + h(s)^2 = w^2`, found here by bisection on the made profile; the quintic Hermite with end tangents of the chord's length has its middle `5 / 32` of the tangents' difference off the chord's middle and the curvature `3 sin(beta / 2) / (L (15 / 8 - 7 cos(beta / 2) / 8)^2)` there. None is read from the kernel. The foot solve and the rail solve stop at 1e-12 relative, so positions are compared to 1e-8 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the cone, the mixed mound and its turned, moved and enlarged copies. Negative: the four refusals. Adjacent: the gentler curl that must be admitted. Controls: the trace and the port-style band on the same input. Whole bodies, trimmed faces and meshes of a mixed join belong to the body's tests once the realization dispatches `IAutoMovieConstructionJoin.loop`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_mixed_join`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the made surfaces, their closed forms and the five numbered scenarios with the behavior each pins.
 */
export function test_construction_operator_mixed_join(): void {
  const failures: string[] = [];
  const notes: string[] = [];
  const level: IFrame = { origin: [0, 0, 0], e1: [1, 0, 0], e2: [0, 1, 0], e3: [0, 0, 1] };
  const T: number = Math.tan(0.88);
  const fold: AutoMovieConstructionWidth = { type: "fold", radius: 0.011, cap: 0.02 };
  const mixed: AutoMovieConstructionWidth = { type: "fold", radius: 0.011, cap: 0.02, reach: 0.0015 };

  // 1. The cone: a wedge in every section, so the rails are the rolling ball's contact circles.
  const cone: IMound = { frame: level, a: 80, slope: (): [number, number, number] => [T, 0, 0], q: 0, c: 0, lift: 0 };
  const rolled: ICase = compose(cone, fold);
  failures.push(...admitted(rolled, "cone"), ...rails(rolled, "cone", 11, 0, 20), ...ball(rolled, "cone", 11), ...middle(rolled, "cone", 11));

  // 2. The mixed mound: tangent over the upper half turn, a fold of up to 0.88 rad below.
  const mound: IMound = { frame: level, a: 80, slope: smoothstep(T, 0), q: 0, c: 2e-4, lift: 0 };
  const run: ICase = compose(mound, mixed);
  failures.push(...admitted(run, "mound"), ...arcs(run, "mound"), ...rails(run, "mound", 11, 1.5, 20), ...tangent(run, "mound"));
  if (run.shared !== null) {
    const smooth: number = run.shared.curve.points.filter((p: AutoMovieSolidIntersection.IPoint): boolean => run.shared!.arc(p) === "smooth").length;
    notes.push(`mound: ${smooth} of ${run.shared.curve.points.length} stored points on smooth arcs`);
  }

  // 3. The part's own frame turned, then the pair moved to a tilted frame and enlarged: every arc follows.
  const turned: ICase = compose({ ...mound, slope: smoothstep(T, 0.7) }, mixed);
  failures.push(...admitted(turned, "turned"), ...arcs(turned, "turned"), ...rails(turned, "turned", 11, 1.5, 20));
  const tilted: IFrame = tilt([30, -20, 50], [1, 1, 0], 0.6);
  const moved: ICase = compose({ ...mound, frame: tilted, a: 100, slope: smoothstep(T, 0.7) }, mixed);
  failures.push(...admitted(moved, "moved"), ...arcs(moved, "moved"), ...rails(moved, "moved", 11, 1.5, 20), ...tangent(moved, "moved"));

  // 4. Refusals by name.
  failures.push(
    ...refused(compose({ ...mound, lift: 0.5 }, mixed), "lifted mound", "shared loop"),
    ...refused(
      compose({ ...mound, slope: (phi: number): [number, number, number] => [-T * Math.sin(phi), -T * Math.cos(phi), T * Math.sin(phi)] }, mixed),
      "sinking mound",
      "one kept side",
    ),
    ...refused(compose({ ...mound, q: 0.5 }, mixed), "curled mound", "fold radius"),
    ...refused(compose(mound, fold), "mound without a reach", "rails"),
  );
  const gentle: ICase = compose({ ...mound, q: 0.1 }, mixed);
  if (typeof gentle.width === "string") failures.push(`gently curled mound: its width law was refused: ${gentle.width}`);

  // 5. Controls: what the two existing operators make of the same mound.
  const surfaces: { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface } = build(mound);
  const traced: AutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace({
    part: surfaces.part,
    host: surfaces.host,
    seed: { phi: -Math.PI / 2, s: 0, y: 0, theta: -mound.a },
    count: 64,
    tolerance: 1e-9,
    grazing: 0.05,
  });
  notes.push(
    `trace control: curve ${traced.curve === null ? "null" : "traced"}; ${traced.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail.slice(0, 120)}`).join("; ")}`,
  );
  if (traced.curve !== null && traced.diagnostics.length === 0) failures.push("trace control: the traced join followed a contact that is tangential over half its turn");
  const band: { port: number; mixed: number } | string = control(cone, rolled);
  if (typeof band === "string") failures.push(`band control: ${band}`);
  else {
    // The band's middle on the wedge: P = L (h1 x + (h4 + h5) u), x into the loop along the wall, u up the cone, L = 1 / cos(beta) mm,
    // with h1' = -7 / 16, h4' + h5' = 23 / 16 and h1' (h4'' + h5'') - h1'' (h4' + h5') = 3 / 2 at the middle share.
    const beta: number = 0.88;
    const speed: number = Math.hypot(-7 / 16 + (23 / 16) * Math.cos(beta), (23 / 16) * Math.sin(beta));
    const port: number = speed ** 3 / (Math.cos(beta) * 1.5 * Math.sin(beta));
    const blend: number = (2 * 11 * (15 / 8 - (7 * Math.cos(beta / 2)) / 8) ** 2) / 3;
    notes.push(`band control: middle radius ${band.port} mm through a band from the loop to a 1 mm rail, ${band.mixed} mm through the mixed join's blend, fold radius 11 mm`);
    if (Math.abs(band.port - port) > 1e-8) failures.push(`band control: a band from the loop to a 1 mm rail turns on ${band.port} mm at its middle, expected ${port}`);
    if (Math.abs(band.mixed - blend) > 1e-8) failures.push(`band control: the mixed join's blend turns on ${band.mixed} mm at its middle, expected ${blend}`);
    if (!(port < 11 / 4 && blend > 3 * port)) failures.push(`band control: the closed forms ${port} mm and ${blend} mm do not separate the band from the fold`);
  }

  // 6. The body: the mixed mound merged into a wall face by the body's own merge, then drawn.
  failures.push(...embodied(run));
  if (failures.length !== 0) throw new Error(`${failures.length} mixed join failures:\n${failures.join("\n")}\nnotes:\n${notes.join("\n")}`);
}

/**
 * The mixed join through `AutoMovieSolidBody.merge` and `AutoMovieSolidBody.draw`: the blend is published with no diagnostic, the wall's
 * rail is the loop's circle enlarged by the host chord at every column, the mound keeps the side past its rail, and in the drawn mesh no
 * edge has more than two triangles and every edge with one lies on a boundary the body reports open.
 */
function embodied(c: ICase): string[] {
  if (c.shared === null || c.width === null || typeof c.width === "string") return ["body: the mixed join has no contact or no width law"];
  const m: IMound = c.mound;
  const range = (from: number, to: number, step: number): number[] =>
    Array.from({ length: Math.round((to - from) / step) + 1 }, (_: unknown, i: number): number => from + i * step);
  const first: AutoMovieSolidIntersection.IPoint = c.shared.curve.points[0]!;
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("made", [
    { surface: c.surfaces.host, stations: range(-120, 120, 8), phases: range(-120, 120, 8) },
  ]);
  const merged: ReturnType<typeof AutoMovieSolidBody.merge> = AutoMovieSolidBody.merge(body, {
    name: "blend.mound",
    kind: "merge",
    part: {
      surface: c.surfaces.part,
      stations: range(0, m.a - 5, 2.5),
      phases: Array.from({ length: 64 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64),
    },
    join: {
      seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta },
      parameter: { kind: "arc" },
      count: 64,
      tolerance: 1e-6,
      grazing: 0.05,
      curve: c.shared.curve,
      toward: c.shared.toward,
      width: c.width,
    },
    count: 64,
    rows: 4,
  });
  const told: string = merged.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail.slice(0, 200)}`).join("; ");
  if (merged.blend === null || merged.join === null) return [`body: no blend (${told})`];
  const out: string[] = merged.diagnostics.length === 0 ? [] : [`body: diagnostics ${told}`];
  const join: AutoMovieSolidJoin.IJoin = merged.join;
  if (merged.blend.host.kind !== "hole") out.push(`body: the wall's rail is a ${merged.blend.host.kind}, expected a hole`);
  if (merged.blend.part.kind !== "start") out.push(`body: the mound's rail is a ${merged.blend.part.kind}, expected its start`);
  merged.blend.host.chart.forEach((x: [number, number], k: number): void => {
    const t: number = (2 * Math.PI * k) / 64;
    const miss: number = Math.abs(Math.hypot(x[0], x[1]) - (m.a + join.widths(t).host));
    if (miss > 1e-8) out.push(`body: the wall's rail at column ${k} stands ${miss} mm off the loop's circle enlarged by its chord`);
  });

  // The drawn mesh: a two-manifold whose only free edges lie on the boundaries the body reports open.
  const open: ReturnType<typeof AutoMovieSolidBody.draw> = AutoMovieSolidBody.draw(body);
  const rim: Set<number> = new Set(open.flat().flatMap((boundary: { vertices: number[] }): number[] => boundary.vertices));
  const audit = (indices: readonly number[]): { crowded: number; free: number } => {
    const edges: Map<string, number> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let k: number = 0; k < 3; ++k) {
        const a: number = indices[i + k]!;
        const b: number = indices[i + ((k + 1) % 3)]!;
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    let crowded: number = 0;
    let free: number = 0;
    for (const [key, uses] of edges) {
      const [a, b]: number[] = key.split(":").map(Number);
      if (uses > 2) ++crowded;
      else if (uses === 1 && !(rim.has(a!) && rim.has(b!))) ++free;
    }
    return { crowded, free };
  };
  const indices: number[] = body.mesh.indices;
  const drawn: { crowded: number; free: number } = audit(indices);
  if (indices.length === 0) out.push("body: nothing was drawn");
  if (drawn.crowded !== 0) out.push(`body: ${drawn.crowded} edges of the drawn mesh carry more than two triangles`);
  if (drawn.free !== 0) out.push(`body: ${drawn.free} free edges of the drawn mesh lie off every open boundary`);

  // Red: a triangle dropped from the middle of the drawn mesh, or one drawn twice, must be found.
  const middle: number = 3 * Math.floor(indices.length / 6);
  if (audit([...indices.slice(0, middle), ...indices.slice(middle + 3)]).free === 0) out.push("body: a dropped triangle left no free edge");
  if (audit([...indices, ...indices.slice(middle, middle + 3)]).crowded === 0) out.push("body: a doubled triangle left no crowded edge");
  return out;
}

/** One composed case. */
interface ICase {
  mound: IMound;
  surfaces: { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface };
  shared: AutoMovieSolidSharedCurve.IShared | null;
  width: AutoMovieSolidJoin.IInput["width"] | string | null;
  join: AutoMovieSolidJoin.IResult | null;
  diagnostics: AutoMovieLoftContract.IDiagnostic[];
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const sum = (...terms: [number, V3][]): V3 => terms.reduce((out: V3, [k, v]: [number, V3]): V3 => add(out, mul(v, k)), [0, 0, 0]);

/** Compose the shared contact, its width laws and the join of a mound, both sides under one width record. */
function compose(m: IMound, width: AutoMovieConstructionWidth): ICase {
  const surfaces: { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface } = build(m);
  const made: AutoMovieSolidSharedCurve.IResult = AutoMovieSolidSharedCurve.create({
    part: surfaces.part,
    host: surfaces.host,
    loop: (t: number): { point: [number, number]; first: [number, number]; second: [number, number] } => ({
      point: [m.a * Math.cos(t), m.a * Math.sin(t)],
      first: [-m.a * Math.sin(t), m.a * Math.cos(t)],
      second: [-m.a * Math.cos(t), -m.a * Math.sin(t)],
    }),
    count: 64,
    tolerance: 1e-6,
    grazing: 0.05,
    keep: "outside",
    start: [0, 0],
  });
  const out: ICase = { mound: m, surfaces, shared: made.shared, width: null, join: null, diagnostics: [...made.diagnostics] };
  if (made.shared === null) return out;
  out.width = AutoMovieConstructionWidths.create(width, width, false, {
    curve: made.shared.curve,
    part: surfaces.part,
    host: AutoMovieSolidIntersection.atlas(surfaces.host),
    diff: false,
  });
  if (typeof out.width === "string") {
    out.diagnostics.push({ producer: "test", level: 6, contract: "width", detail: out.width });
    return out;
  }
  const first: AutoMovieSolidIntersection.IPoint = made.shared.curve.points[0]!;
  out.join = AutoMovieSolidJoin.create(
    {
      part: surfaces.part,
      host: surfaces.host,
      seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta },
      parameter: { kind: "arc" },
      count: 64,
      tolerance: 1e-6,
      grazing: 0.05,
      curve: made.shared.curve,
      toward: made.shared.toward,
      width: out.width,
    },
    "outside",
  );
  out.diagnostics.push(...out.join.diagnostics);
  return out;
}

/** The case's diagnostics, for a message. */
function describe(c: ICase): string {
  return c.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail.slice(0, 200)}`).join("; ") || "no diagnostic";
}

/** The join is admitted with no diagnostic. */
function admitted(c: ICase, label: string): string[] {
  return c.join !== null && c.join.join !== null && c.diagnostics.length === 0 ? [] : [`${label}: not admitted: ${describe(c)}`];
}

/** The case is refused with a diagnostic of the named premise, in its contract or at the head of its detail. */
function refused(c: ICase, label: string, name: string): string[] {
  if (c.join !== null && c.join.join !== null) return [`${label}: admitted, expected the ${name} refusal`];
  return c.diagnostics.some((d: AutoMovieLoftContract.IDiagnostic): boolean => d.contract === name || d.detail.startsWith(name))
    ? []
    : [`${label}: expected the ${name} refusal, got ${describe(c)}`];
}

/** Every stored point's arc is `smooth` exactly where the fold's turn `atan(tau)` is under the grazing angle 0.05 rad. */
function arcs(c: ICase, label: string): string[] {
  if (c.shared === null) return [];
  const shared: AutoMovieSolidSharedCurve.IShared = c.shared;
  return shared.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] => {
    const beta: number = Math.atan(c.mound.slope(p.t)[0]);
    const want: "smooth" | "fold" = beta < 0.05 ? "smooth" : "fold";
    return shared.arc(p) === want ? [] : [`${label}: the point at clock ${p.t} (turn ${beta}) reads ${shared.arc(p)}, expected ${want}`];
  });
}

/** The chord `min(cap, hypot(reach, R tan(beta / 2)))` at a clock, mm. */
function chord(m: IMound, t: number, radius: number, reach: number, cap: number): number {
  return Math.min(cap, Math.hypot(reach, radius * Math.tan(Math.atan(m.slope(t)[0]) / 2)));
}

/** The station up the profile at which its point stands a chord from the loop's: the root of `s^2 + h(s)^2 = w^2`, by bisection. */
function up(m: IMound, t: number, w: number): number {
  let lo: number = 0;
  let hi: number = w;
  for (let i: number = 0; i < 200; ++i) {
    const mid: number = (lo + hi) / 2;
    if (Math.hypot(mid, height(m, mid, t)[0]) < w) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Both laws and both rails against their closed forms: the laws at the stored clocks, the rails there and halfway between them, where each
 * rail stands its own law's chord from the loop.
 */
function rails(c: ICase, label: string, radius: number, reach: number, cap: number): string[] {
  if (c.shared === null || c.join === null || c.join.join === null) return [];
  const join: AutoMovieSolidJoin.IJoin = c.join.join;
  const m: IMound = c.mound;
  const f: IFrame = m.frame;
  const out: string[] = [];
  const n: number = c.shared.curve.points.length;
  for (let i: number = 0; i < 2 * n; ++i) {
    const t: number = (2 * Math.PI * i) / (2 * n);
    const law: { host: number; part: number | null } = join.widths(t);
    if (i % 2 === 0) {
      const want: number = chord(m, t, radius, reach, cap);
      if (Math.abs(law.host - want) > 1e-9 || law.part === null || Math.abs(law.part - want) > 1e-9)
        out.push(`${label}: chords at clock ${t}: host ${law.host}, part ${law.part}, expected ${want}`);
    }
    if (!(law.host > 0) || law.part === null || !(law.part > 0)) {
      out.push(`${label}: a chord is not positive at clock ${t}: host ${law.host}, part ${law.part}`);
      continue;
    }
    const rail: ReturnType<AutoMovieSolidJoin.IJoin["rail"]> = join.rail(t);
    if (rail === null) {
      out.push(`${label}: no rail at clock ${t}`);
      continue;
    }
    const outside: V3 = sum([1, f.origin], [(m.a + law.host) * Math.cos(t), f.e1], [(m.a + law.host) * Math.sin(t), f.e2]);
    const inside: V3 = point(m, up(m, t, law.part), t);
    const hostMiss: number = length(sub(rail.hostPoint, outside));
    const partMiss: number = length(sub(rail.partPoint, inside));
    if (hostMiss > 1e-8) out.push(`${label}: the host rail at clock ${t} stands ${hostMiss} mm from the loop's circle enlarged by its chord ${law.host}`);
    if (partMiss > 1e-8) out.push(`${label}: the part rail at clock ${t} stands ${partMiss} mm from the profile's point at its chord ${law.part}`);
  }
  return out;
}

/** The cone's rails as the contacts of the ball of the fold's radius: both stand that radius from the ball's centre along their surface's normal. */
function ball(c: ICase, label: string, radius: number): string[] {
  if (c.shared === null || c.join === null || c.join.join === null) return [];
  const join: AutoMovieSolidJoin.IJoin = c.join.join;
  const m: IMound = c.mound;
  const f: IFrame = m.frame;
  return c.shared.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] => {
    const rail: ReturnType<AutoMovieSolidJoin.IJoin["rail"]> = join.rail(p.t);
    if (rail === null) return [`${label}: no rail at clock ${p.t}`];
    const beta: number = Math.atan(m.slope(p.t)[0]);
    const r: V3 = sum([Math.cos(p.t), f.e1], [Math.sin(p.t), f.e2]);
    const centre: V3 = sum([1, f.origin], [m.a + radius * Math.tan(beta / 2), r], [radius, f.e3]);
    const normal: V3 = sum([Math.sin(beta), r], [Math.cos(beta), f.e3]);
    const host: number = length(sub(add(rail.hostPoint, mul(f.e3, radius)), centre));
    const part: number = length(sub(add(rail.partPoint, mul(normal, radius)), centre));
    return [
      ...(host > 1e-8 ? [`${label}: the host rail at clock ${p.t} misses the ball's contact by ${host} mm`] : []),
      ...(part > 1e-8 ? [`${label}: the part rail at clock ${p.t} misses the ball's contact by ${part} mm`] : []),
    ];
  });
}

/**
 * The cone's blend at the middle of each column against the quintic Hermite's closed forms on a wedge of turn `beta` with rails the ball's
 * tangent length from its edge: the point `5 / 16 L sin(beta / 2)` from the chord's middle toward the edge, `L = 2 R sin(beta / 2)` the
 * chord, and the curvature `3 sin(beta / 2) / (L (15 / 8 - 7 cos(beta / 2) / 8)^2)`.
 */
function middle(c: ICase, label: string, radius: number): string[] {
  if (c.shared === null || c.join === null || c.join.join === null) return [];
  const join: AutoMovieSolidJoin.IJoin = c.join.join;
  const m: IMound = c.mound;
  const f: IFrame = m.frame;
  return c.shared.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] => {
    const column: AutoMovieSolidJoin.IColumn | null = join.column(p.t);
    if (column === null) return [`${label}: no column at clock ${p.t}`];
    const beta: number = Math.atan(m.slope(p.t)[0]);
    const L: number = 2 * radius * Math.sin(beta / 2);
    const jet: AutoMovieSolidBlend.IJet = AutoMovieSolidBlend.jet(column.start, column.end, 0.5);
    const edge: V3 = sum([1, f.origin], [m.a * Math.cos(p.t), f.e1], [m.a * Math.sin(p.t), f.e2]);
    const half: V3 = mul(add(column.rail.hostPoint, column.rail.partPoint), 0.5);
    const toward: V3 = sub(edge, half);
    const want: V3 = add(half, mul(toward, ((5 / 16) * L * Math.sin(beta / 2)) / length(toward)));
    const miss: number = length(sub(jet.point, want));
    const curvature: number = length(cross(jet.first, jet.second)) / length(jet.first) ** 3;
    const bend: number = (3 * Math.sin(beta / 2)) / (L * (15 / 8 - (7 * Math.cos(beta / 2)) / 8) ** 2);
    return [
      ...(miss > 1e-8 ? [`${label}: the blend's middle at clock ${p.t} stands ${miss} mm from the Hermite's closed form`] : []),
      ...(Math.abs(curvature - bend) > 1e-8 * bend ? [`${label}: the blend's middle curvature at clock ${p.t} is ${curvature}, expected ${bend}`] : []),
    ];
  });
}

/** At four times the stored clocks the blend leaves the wall in the wall's plane and arrives on the mound in the mound's tangent plane at its rail. */
function tangent(c: ICase, label: string): string[] {
  if (c.shared === null || c.join === null || c.join.join === null) return [];
  const join: AutoMovieSolidJoin.IJoin = c.join.join;
  const out: string[] = [];
  const n: number = 4 * c.shared.curve.points.length;
  for (let i: number = 0; i < n; ++i) {
    const t: number = (2 * Math.PI * i) / n;
    const column: AutoMovieSolidJoin.IColumn | null = join.column(t);
    if (column === null) {
      out.push(`${label}: no column at clock ${t}`);
      continue;
    }
    const j: IAutoMovieSolidSurface.IJet = c.surfaces.part.jet(column.rail.s, column.rail.phi);
    const normal: V3 = cross(j.u, j.v);
    const start: number = Math.abs(dot(column.start.first, c.mound.frame.e3)) / length(column.start.first);
    const end: number = Math.abs(dot(column.end.first, normal)) / (length(column.end.first) * length(normal));
    if (start > 1e-9) out.push(`${label}: the blend leaves the wall's plane at clock ${t} (sine ${start})`);
    if (end > 1e-9) out.push(`${label}: the blend leaves the mound's tangent plane at clock ${t} (sine ${end})`);
  }
  return out;
}

/**
 * The radius of curvature at the middle of the bottom column of a band spanned as a port spans it, from the wall's 2-jet on the loop toward
 * the loop's centre to the mound's 2-jet at a rail 1 mm up it, and of the mixed join's blend at the same clock.
 */
function control(m: IMound, c: ICase): { port: number; mixed: number } | string {
  if (c.join === null || c.join.join === null) return "the mixed join was not admitted";
  const t: number = (3 * Math.PI) / 2;
  const surfaces: { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface } = build(m);
  const span: number = length(sub(point(m, 1, t), point(m, 0, t)));
  const start: AutoMovieSolidRibbon.IRibbon = AutoMovieSolidRibbon.of(surfaces.host, m.a * Math.cos(t), m.a * Math.sin(t), -Math.cos(t), -Math.sin(t), span);
  const end: AutoMovieSolidRibbon.IRibbon = AutoMovieSolidRibbon.of(surfaces.part, 1, t, 1, 0, span / Math.hypot(1, height(m, 1, t)[1]));
  const column: AutoMovieSolidJoin.IColumn | null = c.join.join.column(t);
  if (column === null) return "the mixed join has no column at the bottom";
  const radius = (a: AutoMovieSolidRibbon.IRibbon, b: AutoMovieSolidRibbon.IRibbon): number => {
    const jet: AutoMovieSolidBlend.IJet = AutoMovieSolidBlend.jet(a, b, 0.5);
    return length(jet.first) ** 3 / length(cross(jet.first, jet.second));
  };
  return { port: radius(start, end), mixed: radius(column.start, column.end) };
}
