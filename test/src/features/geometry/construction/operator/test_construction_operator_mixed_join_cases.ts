import {
  AutoMovieConstructionWidths,
  type AutoMovieLoftContract,
  AutoMovieSolidBody,
  AutoMovieSolidIntersection,
  AutoMovieSolidJoin,
  type AutoMovieSolidRail,
  AutoMovieSolidSharedCurve,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import type { AutoMovieConstructionWidth } from "@automovie/interface";

import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";
import { ConstructionMound } from "../../../internal/construction/ConstructionMound";

type V3 = [number, number, number];
const { build, height, point, smoothstep, LEVEL }: typeof ConstructionMound = ConstructionMound;

/**
 * The mixed join's further cases on made inputs: the ball on a curved wall, a radius that varies round the loop, a cleft, a cut, a root
 * that leaves the loop over an arc, and later joins that cross a mixed join's seam.
 *
 * Scenarios, millimetres:
 * 1. A sphere of radius 125 whose centre lies `125 cos(0.88)` under the plane `z = 0`, joined along their circle with a fold of radius
 *    11 and reach 0.5: the ball of radius 11 that touches both has its centre `sqrt((125 + 11)^2 - (11 + d)^2)` from the axis, so the
 *    host chord is that less the circle's radius and the part chord the chord of the sphere's arc to the ball's contact, each in
 *    quadrature with the reach. The tangent length `11 tan(0.44)` would stand 0.16 mm past the host's contact.
 * 2. The cone of slope `tan(0.88)` with `radii` 11, 7, 11 and 15 at the quarter clocks: at each of them both chords are that radius's
 *    tangent length `R tan(0.44)`.
 * 3. A cleft: the cone that leans out over its wall by a turn of 2.4 rad, radius 3, cap 20, reach 0.5. Its sections are wedges, so both
 *    rails stand `hypot(0.5, 3 tan(1.2))` from the loop along their walls, and the join is admitted. At a turn of 3.0 rad the ball would
 *    touch the walls 42 mm from their line, past the cap, and the width is refused as `cleft`.
 * 4. A cut: the mixed mound mirrored under its wall as a diff's cutter. The chords are the mound's, the host's rail stands outside the
 *    loop and the cutter's rail down its profile inside the host.
 * 5. A mound moved 0.3 mm along its wall: over the tangent half the loop still lies on it, over the folded arc it does not, and the
 *    `shared loop` refusal names that clock range, inside `(pi, 2 pi)` and round `3 pi / 2`.
 * 6. Later joins on a body that holds the mixed mound: a post merged where it stands on the wall, the blend and the mound at once, and
 *    a cutter cut there, both traced across the mixed join's two seams; then a second, smaller mixed mound whose loop lies on the wall
 *    and whose host rail runs onto the first mound's blend. Each publishes its blend with no diagnostic.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each contact with `AutoMovieSolidSharedCurve.create`, its laws with `AutoMovieConstructionWidths.create`, the join with `AutoMovieSolidJoin.create` and the bodies with `AutoMovieSolidBody.merge`, then reads laws, rails, refusals and published blends. It catches a ball read as a wedge on a curved wall, a radius law that ignores its table, a cleft filled past its cap, a cut whose rails stand on the wrong sides, a partial root reported at one clock, and a seam of a mixed join that a later trace or rail cannot cross.
 * @evidence contracts/development/testing.md#independent-expectations The ball between a sphere and a plane, the wedge's tangent length and the mirrored profile are closed forms of the made surfaces; the clock range follows from the made slope, which is zero over the upper half turn. Positions and chords are compared to 1e-8 mm, above the solvers' 1e-12 relative stop.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the sphere, the table, the admitted cleft, the cut and the three later joins. Negative: the cleft past its cap and the moved mound. The run-out, the frames and the drawn mesh belong to `test_construction_operator_mixed_join`; the tree to `test_construction_mixed_join`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_mixed_join_cases`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the six numbered scenarios with their made inputs and the behavior each pins.
 */
export function test_construction_operator_mixed_join_cases(): void {
  const failures: string[] = [];
  const T: number = Math.tan(0.88);
  const circle = (a: number, cx: number = 0, cy: number = 0): AutoMovieSolidSharedCurve.Loop =>
    (t: number): ReturnType<AutoMovieSolidSharedCurve.Loop> => ({
      point: [cx + a * Math.cos(t), cy + a * Math.sin(t)],
      first: [-a * Math.sin(t), a * Math.cos(t)],
      second: [-a * Math.cos(t), -a * Math.sin(t)],
    });
  const wall: IAutoMovieSolidSurface = { ...HumanSolidShapes.plane("wall", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]), domain: [-400, 400] };

  // 1. The ball between a sphere and a plane.
  const A: number = 125;
  const d: number = A * Math.cos(0.88);
  const rim: number = A * Math.sin(0.88);
  const dome: IAutoMovieSolidSurface = HumanSolidShapes.sphere("dome", [0, 0, -d], [1, 0, 0], [0, 1, 0], [0, 0, 1], A);
  const round: ICase = compose(dome, wall, circle(rim), { type: "fold", radius: 0.011, cap: 0.03, reach: 0.0005 }, "outside", [0.88, 0]);
  const centre: number = Math.sqrt((A + 11) ** 2 - (11 + d) ** 2);
  const want: { host: number; part: number } = {
    host: Math.hypot(0.5, centre - rim),
    part: Math.hypot(0.5, 2 * A * Math.sin((0.88 - Math.atan2(centre, 11 + d)) / 2)),
  };
  failures.push(...admitted(round, "sphere"), ...chords(round, "sphere", (): { host: number; part: number } => want));
  if (!(Math.abs(rim + 11 * Math.tan(0.44) - centre) > 0.1)) failures.push("sphere: the made case does not separate the ball's contact from the tangent length");

  // 2. A radius that varies round the loop.
  const cone: ConstructionMound.IMound = { frame: LEVEL, a: 80, slope: (): [number, number, number] => [T, 0, 0], q: 0, c: 0, lift: 0 };
  const coned: { part: IAutoMovieSolidSurface; host: IAutoMovieSolidSurface } = build(cone);
  const table: number[] = [11, 7, 11, 15];
  const varied: ICase = compose(coned.part, coned.host, circle(80), { type: "fold", radius: 0.011, cap: 0.03, reach: 0.0001, radii: table.map((x: number): number => x / 1000) }, "outside", [0, 0]);
  failures.push(...admitted(varied, "radii"));
  if (varied.join !== null)
    table.forEach((R: number, j: number): void => {
      const law: { host: number; part: number | null } = varied.join!.widths((Math.PI * j) / 2);
      const chord: number = Math.hypot(0.1, R * Math.tan(0.44));
      if (Math.abs(law.host - chord) > 1e-8 || law.part === null || Math.abs(law.part - chord) > 1e-8)
        failures.push(`radii: chords at clock ${(Math.PI * j) / 2}: host ${law.host}, part ${law.part}, expected ${chord} for radius ${R}`);
    });

  // 3. A cleft: the cone leaning out over its wall.
  const lean = (beta: number): IAutoMovieSolidSurface => ({
    name: "lean",
    orientation: -1,
    period: 2 * Math.PI,
    domain: [-10, 40],
    jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
      const rho: number = 80 - s * Math.cos(beta);
      const [cos, sin]: [number, number] = [Math.cos(phi), Math.sin(phi)];
      return {
        p: [rho * cos, rho * sin, s * Math.sin(beta)],
        u: [-Math.cos(beta) * cos, -Math.cos(beta) * sin, Math.sin(beta)],
        v: [-rho * sin, rho * cos, 0],
        uu: [0, 0, 0],
        uv: [Math.cos(beta) * sin, -Math.cos(beta) * cos, 0],
        vv: [-rho * cos, -rho * sin, 0],
      };
    },
  });
  const narrow: AutoMovieConstructionWidth = { type: "fold", radius: 0.003, cap: 0.02, reach: 0.0005 };
  const cleft: ICase = compose(lean(2.4), wall, circle(80), narrow, "outside", [0, 0]);
  failures.push(...admitted(cleft, "cleft"));
  if (cleft.join !== null) {
    const w: number = Math.hypot(0.5, 3 * Math.tan(1.2));
    for (const p of cleft.shared!.curve.points) {
      const rail: AutoMovieSolidRail.IRail | null = cleft.join.rail(p.t);
      if (rail === null) {
        failures.push(`cleft: no rail at clock ${p.t}`);
        continue;
      }
      const r: V3 = [Math.cos(p.t), Math.sin(p.t), 0];
      const host: number = distance(rail.hostPoint, [(80 + w) * r[0], (80 + w) * r[1], 0]);
      const part: number = distance(rail.partPoint, [(80 - w * Math.cos(2.4)) * r[0], (80 - w * Math.cos(2.4)) * r[1], w * Math.sin(2.4)]);
      if (host > 1e-8 || part > 1e-8) failures.push(`cleft: the rails at clock ${p.t} stand ${host} mm and ${part} mm from the wedge's points at the chord ${w}`);
    }
  }
  failures.push(...refused(compose(lean(3.0), wall, circle(80), narrow, "outside", [0, 0]), "closed cleft", "cleft"));

  // 3b. The turn of a hanging arm's armpit: f1's reference skin turns 158 to 163 degrees across the armpit's apex (frontal sections 30
  // and 40 mm behind the crease, `FamilyConicJoints.ts --wedge`), 2.8 rad. A ball of radius 3 touches walls that turn 2.8 rad
  // `3 tan(1.4)` = 17.39 mm from their line, inside the cap, so the join is admitted with both rails at `hypot(0.5, 3 tan(1.4))` and
  // its blend unfolded.
  const armpit: ICase = compose(lean(2.8), wall, circle(80), narrow, "outside", [0, 0]);
  failures.push(...admitted(armpit, "armpit turn"));
  if (armpit.join !== null) {
    const w: number = Math.hypot(0.5, 3 * Math.tan(1.4));
    for (const p of armpit.shared!.curve.points) {
      const rail: AutoMovieSolidRail.IRail | null = armpit.join.rail(p.t);
      if (rail === null) {
        failures.push(`armpit turn: no rail at clock ${p.t}`);
        continue;
      }
      const r: V3 = [Math.cos(p.t), Math.sin(p.t), 0];
      const host: number = distance(rail.hostPoint, [(80 + w) * r[0], (80 + w) * r[1], 0]);
      const part: number = distance(rail.partPoint, [(80 - w * Math.cos(2.8)) * r[0], (80 - w * Math.cos(2.8)) * r[1], w * Math.sin(2.8)]);
      if (host > 1e-8 || part > 1e-8) failures.push(`armpit turn: the rails at clock ${p.t} stand ${host} mm and ${part} mm from the wedge's points at the chord ${w}`);
    }
  }

  // 4. A cut: the mound mirrored under its wall.
  const mound: ConstructionMound.IMound = { frame: LEVEL, a: 80, slope: smoothstep(T, 0), q: 0, c: 2e-4, lift: 0 };
  const pit: ConstructionMound.IMound = { ...mound, slope: (phi: number): [number, number, number] => smoothstep(-T, 0)(phi), c: -2e-4 };
  const mixed: AutoMovieConstructionWidth = { type: "fold", radius: 0.011, cap: 0.02, reach: 0.0015 };
  const cut: ICase = compose({ ...build(pit).part, name: "pit", orientation: 1 }, build(pit).host, circle(80), mixed, "inside", [0, 0]);
  failures.push(...admitted(cut, "cut"));
  if (cut.join !== null)
    for (const p of cut.shared!.curve.points) {
      const w: number = Math.hypot(1.5, 11 * Math.tan(Math.atan(mound.slope(p.t)[0]) / 2));
      const rail: AutoMovieSolidRail.IRail | null = cut.join.rail(p.t);
      const law: { host: number; part: number | null } = cut.join.widths(p.t);
      if (rail === null || law.part === null) {
        failures.push(`cut: no rail at clock ${p.t}`);
        continue;
      }
      let lo: number = 0;
      let hi: number = w;
      for (let i: number = 0; i < 200; ++i) {
        const mid: number = (lo + hi) / 2;
        if (Math.hypot(mid, height(pit, mid, p.t)[0]) < w) lo = mid;
        else hi = mid;
      }
      const host: number = distance(rail.hostPoint, [(80 + w) * Math.cos(p.t), (80 + w) * Math.sin(p.t), 0]);
      const part: number = distance(rail.partPoint, point(pit, (lo + hi) / 2, p.t));
      if (Math.abs(law.host - w) > 1e-8 || Math.abs(law.part - w) > 1e-8 || host > 1e-8 || part > 1e-8)
        failures.push(`cut: at clock ${p.t} chords ${law.host} and ${law.part} against ${w}, rails ${host} mm and ${part} mm off`);
    }

  // 5. A root that leaves the loop over the folded arc only.
  const moved: ICase = compose(build({ ...mound, frame: { ...LEVEL, origin: [0, 0.3, 0] } }).part, wall, circle(80), mixed, "outside", [0, 0], 1e-3);
  const told: AutoMovieLoftContract.IDiagnostic | undefined = moved.diagnostics.find((x: AutoMovieLoftContract.IDiagnostic): boolean => x.contract === "shared loop");
  const range: RegExpMatchArray | null = told === undefined ? null : told.detail.match(/clocks \[([0-9.]+), ([0-9.]+)\]/);
  if (range === null) failures.push(`moved mound: expected a shared loop refusal naming its clocks, got ${describe(moved)}`);
  else if (!(Number(range[1]) > Math.PI && Number(range[1]) < 1.5 * Math.PI && Number(range[2]) > 1.5 * Math.PI && Number(range[2]) < 2 * Math.PI))
    failures.push(`moved mound: the refusal names the clocks [${range[1]}, ${range[2]}], expected an arc inside (pi, 2 pi) round 3 pi / 2`);

  // 6. Later joins across the mixed mound's seams.
  const first: ICase = compose(build(mound).part, wall, circle(80), mixed, "outside", [0, 0]);
  failures.push(...admitted(first, "first mound"));
  if (first.join !== null && first.shared !== null && first.width !== null && typeof first.width !== "string") {
    const range2 = (from: number, to: number, step: number): number[] => Array.from({ length: Math.round((to - from) / step) + 1 }, (_: unknown, i: number): number => from + i * step);
    const turn: number[] = Array.from({ length: 64 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64);
    for (const [label, kind] of [
      ["post", "merge"],
      ["cutter", "diff"],
      ["second mound", "mixed"],
    ] as [string, "merge" | "diff" | "mixed"][]) {
      const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("made", [{ surface: wall, stations: range2(-200, 200, 8), phases: range2(-200, 200, 8) }]);
      const base: ReturnType<typeof AutoMovieSolidBody.merge> = AutoMovieSolidBody.merge(body, {
        name: "blend.mound",
        kind: "merge",
        part: { surface: first.part, stations: range2(0, 75, 2.5), phases: turn },
        join: input(first),
        count: 64,
        rows: 4,
      });
      if (base.blend === null) {
        failures.push(`${label}: the first mound did not merge: ${base.diagnostics.map((x: AutoMovieLoftContract.IDiagnostic): string => x.detail.slice(0, 160)).join("; ")}`);
        continue;
      }
      let later: ReturnType<typeof AutoMovieSolidBody.merge>;
      if (kind === "mixed") {
        // The second mound's loop stands 1.5 mm outside the first blend's rail at the bottom; its own rail, 3 mm out, runs onto that blend.
        const small: ConstructionMound.IMound = { ...mound, a: 30, frame: { ...LEVEL, origin: [0, -(80 + Math.hypot(1.5, 11 * Math.tan(0.44)) + 1.5 + 30), 0] } };
        const hosted: ReturnType<typeof AutoMovieSolidBody.atlas> = AutoMovieSolidBody.atlas(body);
        const second: ICase = compose(build(small).part, hosted.atlas, circle(30, 0, small.frame.origin[1]), { type: "fold", radius: 0.011, cap: 0.02, reach: 0.003 }, "outside", [0, 0]);
        if (second.join === null) {
          failures.push(`${label}: not admitted on the body: ${describe(second)}`);
          continue;
        }
        later = AutoMovieSolidBody.merge(body, { name: "blend.second", kind: "merge", part: { surface: second.part, stations: range2(0, 25, 2.5), phases: turn }, join: input(second), count: 64, rows: 4 });
        if (later.blend !== null && !(new Set(later.blend.host.faces ?? []).size > 1)) failures.push(`${label}: its host rail stays on one face, so the case does not cross a seam`);
      } else {
        // A cylinder of radius 6 standing at the mound's lowest point, across the wall, the blend and the mound; seeded on the wall.
        const post: IAutoMovieSolidSurface = HumanSolidShapes.cylinder("post", [0, -80, -20], [0, 0, 1], [1, 0, 0], [0, 1, 0], 6);
        later = AutoMovieSolidBody.merge(body, {
          name: "blend.post",
          kind,
          part: { surface: post, stations: range2(kind === "merge" ? 0 : -0, 60, 1), phases: Array.from({ length: 48 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 48) },
          join: { seed: { phi: -Math.PI / 2, s: 20, y: 0, theta: -86, face: 0 }, count: 48, tolerance: 1e-9, grazing: 0.05, width: { part: (): number => 1.5, host: (): number => 1.5 } },
          count: 48,
          rows: 3,
        });
        if (later.blend !== null && !(new Set(later.blend.host.faces ?? []).size > 1)) failures.push(`${label}: its host rail stays on one face, so the case does not cross a seam`);
      }
      if (later.blend === null || later.diagnostics.length !== 0)
        failures.push(`${label}: ${later.blend === null ? "no blend" : "diagnostics"}: ${later.diagnostics.map((x: AutoMovieLoftContract.IDiagnostic): string => `${x.contract}: ${x.detail.slice(0, 220)}`).join("; ")}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} mixed join case failures:\n${failures.join("\n")}`);
}

/** One composed case. */
interface ICase {
  part: IAutoMovieSolidSurface;
  shared: AutoMovieSolidSharedCurve.IShared | null;
  width: AutoMovieSolidJoin.IInput["width"] | string | null;
  join: AutoMovieSolidJoin.IJoin | null;
  diagnostics: AutoMovieLoftContract.IDiagnostic[];
}

/** The distance between two points. */
function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}

/** Compose the shared contact on the host's face 0, both widths under one record, and the join. */
function compose(
  part: IAutoMovieSolidSurface,
  host: Parameters<typeof AutoMovieSolidSharedCurve.create>[0]["host"],
  loop: AutoMovieSolidSharedCurve.Loop,
  width: AutoMovieConstructionWidth,
  keep: AutoMovieSolidRail.Keep,
  start: [number, number],
  tolerance: number = 1e-6,
): ICase {
  const made: AutoMovieSolidSharedCurve.IResult = AutoMovieSolidSharedCurve.create({ part, host, loop, count: 64, tolerance, grazing: 0.05, keep, start });
  const out: ICase = { part, shared: made.shared, width: null, join: null, diagnostics: [...made.diagnostics] };
  if (made.shared === null) return out;
  out.width = AutoMovieConstructionWidths.create(width, width, false, { curve: made.shared.curve, part, host: AutoMovieSolidIntersection.atlas(host), diff: keep === "inside" });
  if (typeof out.width === "string") {
    out.diagnostics.push({ producer: "test", level: 6, contract: "width", detail: out.width });
    return out;
  }
  const result: AutoMovieSolidJoin.IResult = AutoMovieSolidJoin.create({ ...input(out), part, host }, keep);
  out.join = result.join;
  out.diagnostics.push(...result.diagnostics);
  return out;
}

/** A composed case's kernel join input. */
function input(c: ICase): Omit<AutoMovieSolidJoin.IInput, "part" | "host"> {
  if (c.shared === null || c.width === null || typeof c.width === "string") throw new Error("the case has no contact or no width law");
  const first: AutoMovieSolidIntersection.IPoint = c.shared.curve.points[0]!;
  return {
    seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta },
    parameter: { kind: "arc" },
    count: 64,
    tolerance: 1e-6,
    grazing: 0.05,
    curve: c.shared.curve,
    toward: c.shared.toward,
    width: c.width,
  };
}

/** The case's diagnostics, for a message. */
function describe(c: ICase): string {
  return c.diagnostics.map((x: AutoMovieLoftContract.IDiagnostic): string => `${x.contract}: ${x.detail.slice(0, 220)}`).join("; ") || "no diagnostic";
}

/** The join is admitted with no diagnostic. */
function admitted(c: ICase, label: string): string[] {
  return c.join !== null && c.diagnostics.length === 0 ? [] : [`${label}: not admitted: ${describe(c)}`];
}

/** The case is refused under the named premise, in its contract or at the head of its detail. */
function refused(c: ICase, label: string, name: string): string[] {
  if (c.join !== null) return [`${label}: admitted, expected the ${name} refusal`];
  return c.diagnostics.some((x: AutoMovieLoftContract.IDiagnostic): boolean => x.contract === name || x.detail.startsWith(name)) ? [] : [`${label}: expected the ${name} refusal, got ${describe(c)}`];
}

/** Both laws at every stored clock against their closed forms. */
function chords(c: ICase, label: string, want: (t: number) => { host: number; part: number }): string[] {
  if (c.join === null || c.shared === null) return [];
  const join: AutoMovieSolidJoin.IJoin = c.join;
  return c.shared.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] => {
    const law: { host: number; part: number | null } = join.widths(p.t);
    const expected: { host: number; part: number } = want(p.t);
    return Math.abs(law.host - expected.host) <= 1e-8 && law.part !== null && Math.abs(law.part - expected.part) <= 1e-8
      ? []
      : [`${label}: chords at clock ${p.t}: host ${law.host}, part ${law.part}, expected ${expected.host} and ${expected.part}`];
  });
}
