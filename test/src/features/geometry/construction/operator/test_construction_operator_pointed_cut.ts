import {
  AutoMovieConstructionPortCurve,
  AutoMovieConstructionWidths,
  type AutoMovieLoftContract,
  AutoMovieSolidBody,
  AutoMovieSolidIntersection,
  AutoMovieSolidJoin,
  AutoMovieSolidSharedCurve,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import type { AutoMovieConstructionWidth, IAutoMovieConstructionPort } from "@automovie/interface";

import { ConstructionMound } from "../../../internal/construction/ConstructionMound";

type V3 = [number, number, number];
type ILoopAt = (t: number) => { point: [number, number]; first: [number, number]; second: [number, number] };

/**
 * An opening with two pointed ends, cut on a declared loop: the made case behind a lid fissure and a mouth's opening, whose loops are
 * curves a law generates and never the trace of two walls.
 *
 * Made inputs, millimetres: the host is the plane `z = 0`, charted `(x, y)`. The opening is a lens of two circular arcs of radius 20 on
 * the chord from `(-15, 0)` to `(15, 0)`, whose polar radius about the origin is `rho(c) = -d |sin c| + sqrt(d^2 sin^2 c + 15^2)`,
 * `d = sqrt(20^2 - 15^2)`. It is declared the only way a join's `loop` can be: a circle of radius 15 on the chart with 64 shares
 * `rho(c_k) / 15`, which the engine joins by a periodic cubic, so the declared curve rounds each point within one column.
 *
 * The cutter is always the declared curve itself carried straight into the host, `P(s, t) = (X(t), Y(t), -s)`, so one owner supplies the
 * loop to both surfaces.
 *
 * Scenarios:
 * 1. The pointed lens. A join's loop is one C2 curve (`IAutoMovieConstructionPort.ILoop.shape`); a corner is not, and the cubic through a
 *    corner's shares bends without bound beside it, so the contact is refused as `shared loop`.
 * 2. The same lens with each point rounded on a circle of radius 3 mm tangent to both arcs (the lens opened by a disc). Every section
 *    square to the loop is a right angle between the plane and the cutter's wall, so a fold of radius `R` puts both rails
 *    `R tan(pi / 4) = R` from the loop: the host's on the plane, the cutter's straight below the loop's point. Admitted, no diagnostic.
 * 3. The rounded lens cut out of a body: the plane as a face of 31 by 31 points, the cutter's wall from the loop to 25 mm deep, joined by
 *    `AutoMovieSolidBody.merge` as a `diff` and drawn. No diagnostic; the drawn mesh is a two-manifold: no edge carries more than two
 *    triangles, and every edge with one lies on a boundary the body reports open (the face's outer border and the wall's deep end).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Declares each lens through `AutoMovieConstructionPortCurve.curve`, builds the contact with `AutoMovieSolidSharedCurve.create` keeping the cutter inside, the width laws with `AutoMovieConstructionWidths.create` for a diff and the join with `AutoMovieSolidJoin.create`, then reads the refusal's contract and, at every contact point, both chords and both rails. It catches a pointed loop that is admitted, a rounded one that is refused, and a rail off the fold's contact point; it does not read the drawn mesh or the trimmed host face.
 * @evidence contracts/development/testing.md#independent-expectations The refusal follows from the loop's declared contract, one C2 curve, which a corner breaks. The rails follow from the made geometry: a plane and a wall square to it meet at a right angle in every section square to the loop, and a circle of radius R tangent to two lines at a right angle touches each R from their point. No value comes from a run.
 * @evidence contracts/development/testing.md#distinguishing-cases Negative: the pointed lens. Positive and adjacent: the same lens with ends of 3 mm, the only change. The first run of this test expected the pointed lens admitted and was red on it. Curved hosts, other end radii and column counts, and a merge of the cutter into a body are not covered.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_pointed_cut`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the made host, the lens's closed form, how a loop is declared, and the two scenarios with what each pins.
 */
export function test_construction_operator_pointed_cut(): void {
  const failures: string[] = [];
  const count: number = 64;
  const d: number = Math.sqrt(20 * 20 - 15 * 15);
  const rho = (c: number): number => -d * Math.abs(Math.sin(c)) + Math.sqrt(d * d * Math.sin(c) * Math.sin(c) + 15 * 15);

  // The lens opened by a disc of radius `end`: each point becomes the circle about `(+-inner, 0)`, tangent to an arc at the polar angle `joint`.
  const end: number = 3;
  const inner: number = Math.sqrt((20 - end) * (20 - end) - d * d);
  const joint: number = Math.atan2(-d + (20 * d) / (20 - end), (20 * inner) / (20 - end));
  const rounded = (c: number): number => {
    const fold: number = Math.atan2(Math.abs(Math.sin(c)), Math.abs(Math.cos(c)));
    return fold > joint ? rho(c) : inner * Math.cos(fold) + Math.sqrt(end * end - inner * inner * Math.sin(fold) * Math.sin(fold));
  };
  const declare = (radial: (c: number) => number): ILoopAt => {
    const loop: IAutoMovieConstructionPort.ILoop = {
      centre: [0, 0],
      semi: [0.015, 15],
      sense: 1,
      shape: Array.from({ length: count }, (_: unknown, k: number): number => radial((2 * Math.PI * k) / count) / 15),
    };
    const curve: AutoMovieConstructionPortCurve.ICurve | string = AutoMovieConstructionPortCurve.curve(loop, count, undefined);
    if (typeof curve === "string") throw new Error(`the lens is not admitted as a loop: ${curve}`);
    return curve.at;
  };
  const host: IAutoMovieSolidSurface = ConstructionMound.build({ frame: ConstructionMound.LEVEL, a: 15, slope: (): [number, number, number] => [0, 0, 0], q: 0, c: 0, lift: 0 }).host;
  const radius: number = 0.5;
  const rim: AutoMovieConstructionWidth = { type: "fold", radius: radius / 1000, cap: 0.002 };

  // 1. The pointed lens: refused.
  const pointed: ILoopAt = declare(rho);
  const sharp: ICase = compose(host, cutter(pointed), pointed, rim, count);
  if (sharp.join !== null && sharp.join.join !== null && sharp.diagnostics.length === 0) failures.push("pointed: admitted, expected the shared loop refusal");
  else if (!sharp.diagnostics.some((x: AutoMovieLoftContract.IDiagnostic): boolean => x.contract === "shared loop")) failures.push(`pointed: expected the shared loop refusal, got ${describe(sharp)}`);

  // 2. The rounded lens: admitted, with both rails on the fold's closed-form points.
  const round: ILoopAt = declare(rounded);
  const own: ICase = compose(host, cutter(round), round, rim, count);
  if (own.join === null || own.join.join === null || own.diagnostics.length !== 0) failures.push(`rounded: not admitted: ${describe(own)}`);
  else if (own.shared !== null) {
    const join: AutoMovieSolidJoin.IJoin = own.join.join;
    for (const p of own.shared.curve.points) {
      const law: { host: number; part: number | null } = join.widths(p.t);
      if (Math.abs(law.host - radius) > 1e-6 || law.part === null || Math.abs(law.part - radius) > 1e-6) {
        failures.push(`declared: chords at clock ${p.t}: host ${law.host}, part ${law.part}, expected ${radius}`);
        continue;
      }
      const rail: ReturnType<AutoMovieSolidJoin.IJoin["rail"]> = join.rail(p.t);
      if (rail === null) {
        failures.push(`declared: no rail at clock ${p.t}`);
        continue;
      }
      const edge: V3 = [p.y, p.theta, 0];
      const below: number = Math.hypot(rail.partPoint[0] - edge[0], rail.partPoint[1] - edge[1], rail.partPoint[2] + radius);
      const out: number = Math.hypot(rail.hostPoint[0] - edge[0], rail.hostPoint[1] - edge[1]);
      if (below > 1e-6) failures.push(`declared: the cutter's rail at clock ${p.t} stands ${below} mm from the point ${radius} mm below the loop`);
      if (Math.abs(rail.hostPoint[2]) > 1e-9 || Math.abs(out - radius) > 1e-6) failures.push(`declared: the host's rail at clock ${p.t} stands ${out} mm from the loop at height ${rail.hostPoint[2]}, expected ${radius} mm on the plane`);
    }
  }

  // 3. The rounded lens cut out of a body and drawn.
  failures.push(...embodied(host, cutter(round), own, count));
  if (failures.length !== 0) throw new Error(`${failures.length} pointed cut failures:\n${failures.join("\n")}`);
}

/** One composed case. */
interface ICase {
  shared: AutoMovieSolidSharedCurve.IShared | null;
  width: AutoMovieSolidJoin.IInput["width"] | null;
  join: AutoMovieSolidJoin.IResult | null;
  diagnostics: AutoMovieLoftContract.IDiagnostic[];
}

/** The cutter cut out of a face of the host by the body's own merge and drawn: its diagnostics and the drawn mesh's edges. */
function embodied(host: IAutoMovieSolidSurface, part: IAutoMovieSolidSurface, c: ICase, count: number): string[] {
  if (c.shared === null || c.width === null) return ["body: the cut has no contact or no width law"];
  const range = (from: number, to: number, step: number): number[] => Array.from({ length: Math.round((to - from) / step) + 1 }, (_: unknown, i: number): number => from + i * step);
  const first: AutoMovieSolidIntersection.IPoint = c.shared.curve.points[0]!;
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("made", [{ surface: host, stations: range(-60, 60, 4), phases: range(-60, 60, 4) }]);
  const merged: ReturnType<typeof AutoMovieSolidBody.merge> = AutoMovieSolidBody.merge(body, {
    name: "cut.lens",
    kind: "diff",
    part: { surface: part, stations: range(0, 25, 2.5), phases: Array.from({ length: count }, (_: unknown, k: number): number => (2 * Math.PI * k) / count) },
    join: { seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta }, parameter: { kind: "arc" }, count, tolerance: 1e-6, grazing: 0.05, curve: c.shared.curve, toward: c.shared.toward, width: c.width },
    count,
    rows: 4,
  });
  const told: string = merged.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail.slice(0, 200)}`).join("; ");
  if (merged.blend === null || merged.join === null) return [`body: no blend (${told})`];
  const out: string[] = merged.diagnostics.length === 0 ? [] : [`body: diagnostics ${told}`];
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

  // Red: the same audit must find a triangle dropped from the middle of the drawn mesh and one drawn twice.
  const middle: number = 3 * Math.floor(indices.length / 6);
  if (audit([...indices.slice(0, middle), ...indices.slice(middle + 3)]).free === 0) out.push("body: a dropped triangle left no free edge");
  if (audit([...indices, ...indices.slice(middle, middle + 3)]).crowded === 0) out.push("body: a doubled triangle left no crowded edge");
  return out;
}

/** The case's diagnostics, for a message. */
function describe(c: ICase): string {
  return c.diagnostics.map((x: AutoMovieLoftContract.IDiagnostic): string => `${x.contract}: ${x.detail.slice(0, 200)}`).join("; ") || "no diagnostic";
}

/** A plane curve carried straight into the host as a cutter's wall, charted `(s, t)`, `s` the depth, mm; its outward normal is the curve's. */
function cutter(at: ILoopAt): IAutoMovieSolidSurface {
  return {
    name: "cutter",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [-5, 30],
    jet: (s: number, t: number): IAutoMovieSolidSurface.IJet => {
      const read: { point: [number, number]; first: [number, number]; second: [number, number] } = at(t);
      return { p: [read.point[0], read.point[1], -s], u: [0, 0, -1], v: [read.first[0], read.first[1], 0], uu: [0, 0, 0], uv: [0, 0, 0], vv: [read.second[0], read.second[1], 0] };
    },
  };
}

/** The declared loop's contact, its fold widths and the join of a cutter into its host, the cutter kept inside. */
function compose(host: IAutoMovieSolidSurface, part: IAutoMovieSolidSurface, loop: ILoopAt, width: AutoMovieConstructionWidth, count: number): ICase {
  const made: AutoMovieSolidSharedCurve.IResult = AutoMovieSolidSharedCurve.create({ part, host, loop, count, tolerance: 1e-6, grazing: 0.05, keep: "inside", start: [0, 0] });
  const out: ICase = { shared: made.shared, width: null, join: null, diagnostics: [...made.diagnostics] };
  if (made.shared === null) return out;
  const law: AutoMovieSolidJoin.IInput["width"] | string = AutoMovieConstructionWidths.create(width, width, false, { curve: made.shared.curve, part, host: AutoMovieSolidIntersection.atlas(host), diff: true });
  if (typeof law === "string") {
    out.diagnostics.push({ producer: "test", level: 6, contract: "width", detail: law });
    return out;
  }
  out.width = law;
  const first: AutoMovieSolidIntersection.IPoint = made.shared.curve.points[0]!;
  out.join = AutoMovieSolidJoin.create(
    { part, host, seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta }, parameter: { kind: "arc" }, count, tolerance: 1e-6, grazing: 0.05, curve: made.shared.curve, toward: made.shared.toward, width: law },
    "inside",
  );
  out.diagnostics.push(...out.join.diagnostics);
  return out;
}
