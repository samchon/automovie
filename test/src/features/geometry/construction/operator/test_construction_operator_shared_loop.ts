import { AutoMovieConstructionSharedLoop, AutoMovieSolidIntersection, AutoMovieSolidJoin, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { AutoMovieConstructionNode, AutoMovieConstructionWidth, IAutoMovieConstructionJoin, IAutoMovieConstructionPort } from "@automovie/interface";

import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A join record that declares its loop becomes the kernel's join input: the loop is read on the host's own chart in the record's metres
 * and radians, either way round, and each chord follows from the two surfaces.
 *
 * Made inputs: the wall is the plane `z = 0` charted as a lofted face is, a station in millimetres along `x` and a phase along `y` at
 * 40 mm per radian, outward normal `+z`. The record's loop has the semi-axes 0.08 m and 2 rad about the chart's origin, so it is the
 * circle of radius 80 mm. The mound is the cone-like `P(s, phi) = ((80 - s) cos phi, (80 - s) sin phi, tau(phi) s)`, whose slope
 * `tau = tan(0.88) S(-sin phi)`, `S` the quintic smoothstep, is zero over the upper half turn. Every section square to the loop is a
 * wedge of turn `beta = atan(tau)`, so a chord `w` up the mound ends at `s = w cos(beta)`.
 *
 * Scenarios:
 * 1. Sense +1, both widths `fold` with radius 0.011 m, cap 0.02 m and reach 0.0015 m, a point seed: prepared; both chords are
 *    `hypot(1.5, 11 tan(beta / 2))` mm at every clock of the loop; the join composed from the prepared input is admitted, its host rail
 *    on the circle enlarged by the chord and its part rail at `s = w cos(beta)`.
 * 2. Sense -1, the same circle run the other way round, with a search seed, whose start is found on a grid: the same chords and rails
 *    at each world point of the loop, so the host's outside does not depend on the loop's direction.
 * 3. Refusals: a record without a loop and a loop whose phase semi-axis reaches pi (`shared loop`); a `station` width (`width`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieConstructionSharedLoop.create` on made records and surfaces and composes `AutoMovieSolidJoin.create` from what it returns, then reads the width laws and the rails. It catches a loop read in the wrong units or on the wrong chart axis, a host rail placed inside a clockwise loop, a chord not converted from metres, a start that depends on the seed's kind, and a refusal under the wrong name.
 * @evidence contracts/development/testing.md#independent-expectations The circle, the turn `atan(tau)`, the ball's tangent length `R tan(beta / 2)` and the wedge's chord point are closed forms of the made surfaces; none is read from the kernel. Positions are compared to 1e-8 mm, above the solvers' 1e-12 relative stop.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: both senses and both seed kinds. Negative: the three refusals. The contact's own refusals, the run-out, the frames and the body belong to `test_construction_operator_mixed_join`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_shared_loop`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the made chart, the record's units and the three numbered scenarios with the behavior each pins.
 */
export function test_construction_operator_shared_loop(): void {
  const failures: string[] = [];
  const T: number = Math.tan(0.88);
  const zero: V3 = [0, 0, 0];

  /** The slope with its first and second phase derivatives. */
  const slope = (phi: number): [number, number, number] => {
    const x: number = -Math.sin(phi);
    if (!(x > 0)) return [0, 0, 0];
    const first: number = 30 * x * x * (1 - x) * (1 - x);
    return [T * x * x * x * (10 - 15 * x + 6 * x * x), -T * first * Math.cos(phi), T * (60 * x * (1 - x) * (1 - 2 * x) * Math.cos(phi) ** 2 + first * Math.sin(phi))];
  };
  const wall: IAutoMovieSolidSurface = {
    name: "wall",
    orientation: 1,
    domain: [-400, 400],
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({ p: [u, 40 * v, 0], u: [1, 0, 0], v: [0, 40, 0], uu: [...zero], uv: [...zero], vv: [...zero] }),
  };
  const mound: IAutoMovieSolidSurface = {
    name: "mound",
    orientation: -1,
    period: 2 * Math.PI,
    domain: [-15, 75],
    jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
      const [tau, tau1, tau2]: [number, number, number] = slope(phi);
      const cos: number = Math.cos(phi);
      const sin: number = Math.sin(phi);
      return {
        p: [(80 - s) * cos, (80 - s) * sin, tau * s],
        u: [-cos, -sin, tau],
        v: [-(80 - s) * sin, (80 - s) * cos, tau1 * s],
        uu: [...zero],
        uv: [sin, -cos, tau1],
        vv: [-(80 - s) * cos, -(80 - s) * sin, tau2 * s],
      };
    },
  };
  const fold: AutoMovieConstructionWidth = { type: "fold", radius: 0.011, cap: 0.02, reach: 0.0015 };
  const loop = (sense: 1 | -1): IAutoMovieConstructionPort.ILoop => ({ centre: [0, 0], semi: [0.08, 2], sense });

  /** A join record over two placeholder subtrees, which the preparation does not read. */
  const record = (
    seed: IAutoMovieConstructionJoin["seed"],
    widths: { part: AutoMovieConstructionWidth; host: AutoMovieConstructionWidth },
    declared: IAutoMovieConstructionPort.ILoop | undefined,
  ): IAutoMovieConstructionJoin => {
    const frame: Parameters<typeof ConstructionShapes.cylinder>[1] = { origin: { x: 0, y: 0, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 } };
    const host: AutoMovieConstructionNode = ConstructionShapes.cylinder("wall", frame, 0.03, 0.2);
    const part: AutoMovieConstructionNode = ConstructionShapes.cylinder("mound", frame, 0.015, 0.08);
    return {
      type: "join",
      kind: "merge",
      name: "blend.mound",
      host,
      part,
      seed,
      parameter: { type: "phase" },
      partWidth: widths.part,
      hostWidth: widths.host,
      continuity: "G2",
      count: 64,
      rows: 4,
      tolerance: 1e-9,
      grazing: 0.05,
      ...(declared === undefined ? {} : { loop: declared }),
    };
  };
  const point: IAutoMovieConstructionJoin["seed"] = { type: "point", partFace: "mound", hostFace: "wall", part: [0, 0], host: [0.08, 0] };
  const search: IAutoMovieConstructionJoin["seed"] = { type: "search", partFace: "mound", hostFace: "wall", phase: 0, from: 0, to: 1 };

  // 1 and 2. Both senses of the same circle: the clock t of sense -1 is the world angle -t.
  for (const [label, sense, seed] of [
    ["counter-clockwise", 1, point],
    ["clockwise", -1, search],
  ] as [string, 1 | -1, IAutoMovieConstructionJoin["seed"]][]) {
    const prepared: AutoMovieConstructionSharedLoop.IPrepared | AutoMovieConstructionSharedLoop.IRefusal = AutoMovieConstructionSharedLoop.create(
      record(seed, { part: fold, host: fold }, loop(sense)),
      mound,
      AutoMovieSolidIntersection.atlas(wall),
      0,
    );
    if (!("join" in prepared)) {
      failures.push(`${label}: refused: ${prepared.contract}: ${prepared.detail}`);
      continue;
    }
    const made: AutoMovieSolidJoin.IResult = AutoMovieSolidJoin.create({ ...prepared.join, part: mound, host: wall }, "outside");
    if (made.join === null || made.diagnostics.length !== 0) {
      failures.push(`${label}: not admitted: ${made.diagnostics.map((d: { contract: string; detail: string }): string => `${d.contract}: ${d.detail.slice(0, 200)}`).join("; ")}`);
      continue;
    }
    for (let i: number = 0; i < 64; ++i) {
      const t: number = (2 * Math.PI * i) / 64;
      const angle: number = sense * t;
      const beta: number = Math.atan(slope(angle)[0]);
      const want: number = Math.hypot(1.5, 11 * Math.tan(beta / 2));
      const law: { host: number; part: number | null } = made.join.widths(t);
      if (Math.abs(law.host - want) > 1e-9 || law.part === null || Math.abs(law.part - want) > 1e-9) failures.push(`${label}: chords at clock ${t}: host ${law.host}, part ${law.part}, expected ${want}`);
      const rail: ReturnType<AutoMovieSolidJoin.IJoin["rail"]> = made.join.rail(t);
      if (rail === null) {
        failures.push(`${label}: no rail at clock ${t}`);
        continue;
      }
      const host: number = Math.hypot(rail.hostPoint[0] - (80 + want) * Math.cos(angle), rail.hostPoint[1] - (80 + want) * Math.sin(angle), rail.hostPoint[2]);
      const s: number = want * Math.cos(beta);
      const part: number = Math.hypot(rail.partPoint[0] - (80 - s) * Math.cos(angle), rail.partPoint[1] - (80 - s) * Math.sin(angle), rail.partPoint[2] - want * Math.sin(beta));
      if (host > 1e-8) failures.push(`${label}: the host rail at clock ${t} stands ${host} mm from the circle enlarged by its chord`);
      if (part > 1e-8) failures.push(`${label}: the part rail at clock ${t} stands ${part} mm from the wedge's point at its chord`);
    }
  }

  // 3. Refusals.
  const expect = (label: string, name: string, node: IAutoMovieConstructionJoin): void => {
    const got: AutoMovieConstructionSharedLoop.IPrepared | AutoMovieConstructionSharedLoop.IRefusal = AutoMovieConstructionSharedLoop.create(
      node,
      mound,
      AutoMovieSolidIntersection.atlas(wall),
      0,
    );
    if ("join" in got) failures.push(`${label}: prepared, expected the ${name} refusal`);
    else if (got.contract !== name) failures.push(`${label}: expected the ${name} refusal, got ${got.contract}: ${got.detail}`);
  };
  expect("no loop", "shared loop", record(point, { part: fold, host: fold }, undefined));
  expect("phase semi-axis of pi", "shared loop", record(point, { part: fold, host: fold }, { centre: [0, 0], semi: [0.08, Math.PI], sense: 1 }));
  expect("station width", "width", record(point, { part: { type: "station", value: 0.01 }, host: fold }, loop(1)));
  if (failures.length !== 0) throw new Error(`${failures.length} shared loop failures:\n${failures.join("\n")}`);
}
