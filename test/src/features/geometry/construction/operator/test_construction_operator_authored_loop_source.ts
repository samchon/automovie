import { AutoMovieConstructionSharedLoop, AutoMovieLoftAdmissionError, AutoMovieSolidIntersection } from "@automovie/engine";
import type {
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionSharedLoop,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/**
 * @evidence contracts/development/testing.md#behavioral-verification The mixed operator admits an attached closed nonradial chart directly through its source key and real 2-jet.
 * @evidence contracts/development/testing.md#independent-expectations This curve in polar coordinates has r=3+cos(t)/2 and theta=2pi*sin(t)/3. The ordered pair of sine and cosine gives a simple curve whose two inward tangent halfplanes at theta=+-pi/2 exclude intersection with the tangent at its outside extreme.
 * @evidence contracts/development/testing.md#distinguishing-cases Reflect both actual charts and their signed winding. Reject a repeated traversal, crossing, foreign owner, invalid interleaved chart, and derivative or closure differing at coincident points.
 * @evidence contracts/development/testing.md#execution-ownership One analytic source pair, no fixture captures or private anatomy.
 */
export function test_construction_operator_authored_loop_source(): void {
  type Loop = IAutoMovieSolidSharedCurve.Loop;
  const turn = 2 * Math.PI, phase = turn / 3, count = 32;
  const zero: [number, number, number] = [0, 0, 0];
  const at = (side: 1 | -1): Loop => (t) => {
    const r = 3 + Math.cos(t) / 2, d = -Math.sin(t) / 2, dd = -Math.cos(t) / 2;
    const a = phase * Math.sin(t), b = phase * Math.cos(t), c = -a;
    const x = Math.cos(a), y = Math.sin(a);
    return { point: [r * x, side * r * y], first: [d * x - r * b * y, side * (d * y + r * b * x)],
      second: [(dd - r * b * b) * x - (2 * d * b + r * c) * y,
        side * ((dd - r * b * b) * y + (2 * d * b + r * c) * x)] };
  };
  const width = { type: "chord" as const, value: 1e-5 };
  const node: IAutoMovieConstructionJoin = {
    type: "join", kind: "merge", name: "weld", count, rows: 4, tolerance: 1e-9, grazing: 0.05,
    host: { type: "source", name: "wall", source: "wall" }, part: { type: "source", name: "patch", source: "patch" },
    seed: { type: "point", hostFace: "wall", partFace: "patch", host: [0.0035, 0], part: [0, 0] },
    parameter: { type: "arc" }, loop: { type: "source", source: "material" }, hostWidth: width, partWidth: width, continuity: "G2",
  };
  const h: IAutoMovieSolidSurface = { name: "wall", orientation: 1, domain: [-5, 5],
    jet: (x, y) => ({ p: [x, y, 0], u: [1, 0, 0], v: [0, 1, 0], uu: zero, uv: zero, vv: zero }) };
  const address = (side: 1 | -1): Loop => (t: number): ReturnType<Loop> =>
    ({ point: [0, side * t], first: [0, side], second: [0, 0] });
  const create = (reader: Loop, side: 1 | -1, owners: boolean = true, partAt: Loop = address(side), period: number = turn) => {
    const original: Loop = at(side);
    const p: IAutoMovieSolidSurface = { name: "patch", orientation: -1, domain: [-1, 1], period,
      jet: (s: number, clock: number): IAutoMovieSolidSurface.IJet => {
        const q: ReturnType<Loop> = original(side * clock);
        return { p: [...q.point, s], u: [0, 0, 1], v: [side * q.first[0], side * q.first[1], 0], uu: zero, uv: zero, vv: [...q.second, 0] };
      },
    };
    const sources = new Map<string, IAutoMovieConstructionSharedLoop.ISource>([["material", {
      hostFace: owners ? "wall" : "foreign", partFace: "patch", kind: "ready", partAt, at: reader,
    }]]);
    return AutoMovieConstructionSharedLoop.create(node, p, AutoMovieSolidIntersection.atlas(h), 0, sources);
  };
  for (const side of [1, -1] as const) {
    const ready = create(at(side), side);
    if (!("join" in ready)) throw new Error(ready.contract + " " + ready.detail);
    const held = Math.PI / count, point = ready.shared.curve.at(held);
    const expected = at(side)(held);
    if (point === null || point.s !== 0 || point.phi !== side * held || point.rate[1] !== side ||
      ready.shared.curve.partWinding !== side ||
      Math.hypot(point.point[0] - expected.point[0], point.point[1] - expected.point[1], point.point[2]) > 1e-9 ||
      Math.hypot(point.tangent[0] - expected.first[0], point.tangent[1] - expected.first[1], point.tangent[2]) > 1e-9 ||
      Math.hypot(point.second[0] - expected.second[0], point.second[1] - expected.second[1], point.second[2]) > 1e-9)
      throw new Error("the actual shared wall lost its source 2-jet at a held clock or its reflection");
  }
  const duplicate: Loop = (t) => {
    const q = at(1)((2 * t) % turn);
    return { point: q.point, first: [2 * q.first[0], 2 * q.first[1]], second: [4 * q.second[0], 4 * q.second[1]] };
  };
  const crossing: Loop = (t) => ({ point: [Math.sin(t), Math.sin(2 * t)], first: [Math.cos(t), 2 * Math.cos(2 * t)],
    second: [-Math.sin(t), -4 * Math.sin(2 * t)] });
  const unavailable: Loop = (t) => {
    if (t === Math.PI / count) throw new AutoMovieLoftAdmissionError("unavailable held chart");
    return at(1)(t);
  };
  for (const [curve, contract] of [[duplicate, "enclosed loop"], [crossing, "enclosed loop"], [unavailable, "enclosed loop"]] as const) {
    const failed = create(curve, 1);
    if ("join" in failed || failed.contract !== contract)
      throw new Error("an unavailable or nonsimple observed source was admitted");
  }
  const held: number = Math.PI / count;
  const wrongClock: Loop = (t: number): ReturnType<Loop> => t === held
    ? { ...address(1)(t), point: [0, t + held] } : address(1)(t);
  const reversedVelocity: Loop = (t: number): ReturnType<Loop> => t === held
    ? { ...address(1)(t), first: [0, -1] } : address(1)(t);
  const wrongAcceleration: Loop = (t: number): ReturnType<Loop> => t === held
    ? { ...address(1)(t), second: [0, 1] } : address(1)(t);
  for (const [partAt, reason] of [[wrongClock, "original points"], [reversedVelocity, "first derivatives"],
    [wrongAcceleration, "second derivatives"]] as const) {
    const failed = create(at(1), 1, true, partAt);
    if ("join" in failed || failed.contract !== "shared loop" || !failed.detail.includes(reason))
      throw new Error("the shared contact replaced a disagreeing original part chart");
  }
  const openChart = create(at(1), 1, true, address(1), 2 * turn);
  if ("join" in openChart || openChart.contract !== "closed loop")
    throw new Error("coincident world points hid an unclosed original part chart");
  const foreign = create(at(1), 1, false);
  if ("join" in foreign || foreign.contract !== "shared loop")
    throw new Error("another face's corrected loop received source ownership");
}
