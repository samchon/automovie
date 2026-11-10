import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import { FootSlip } from "./FootSlip";

/**
 * Experiment E1 on the polygon man (`jump-e1-<body>` for the smallest, the
 * average and the tallest sweep bodies): the body walks at a
 * normal pace and is cut into a jump that lands 0.9 m ahead of where it is,
 * at 21 shares across one stride (from its second to its third left heel
 * strike, 0.05 of the stride apart). The middle cut is drawn every 0.1 s and
 * at its events; the verdicts hold over every cut, each measured from 0.3 s
 * before its cut to the end, the span the cut, the push, the flight and the
 * landing lie in (the walking before it is the walk captures'):
 *
 * - every cut is legal, a stance foot being planted;
 * - the planted point of a foot, its lowest sole socket while within 1 cm of
 *   the floor, slides under 5 mm in both actions' plant windows
 *   ({@link FootSlip}, the rule the walk captures measure by);
 * - the velocity jump at the cut, the largest change of any bone's velocity
 *   across the cut, is at most 5 % of the largest bone speed within 0.5 s of it,
 *   each velocity the symmetric difference at the cut -/+ 1/240 s, naming the
 *   displayed channel (root translation or clinical angle) that changes most;
 * - every displayed channel is continuous at the cut: within 0.5 degree, the
 *   root within 0.5 mm, from 1 microsecond before it to 1 after;
 * - the centre of mass in flight lies within 10 mm of the least-squares
 *   ballistic parabola with gravity fixed;
 * - after touchdown no heel, ball or toe sinks more than 10 mm under the floor;
 * - at take-off the reaching ankle is under the body, within 0.25 hip heights
 *   of the hips horizontally and at least 0.2 hip heights up.
 *
 * @returns The case.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the sweep, the drawn instants and every verdict with its bound.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real walk and jump through the performance, cut by the interrupt table, and measures the displayed bones, the sockets and the engine's centre of mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk to read the stride, one performance per cut, one measurement per cut.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Cut shares come from the walk's own heel-strike events; the parabola is fitted, not assumed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in cuts times samples.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function jumpCases(
  who: "f-small" | "m-average" | "m-tall",
): IMotionCaptureCase[] {
  const man = MotionBodies.population(who);
  const body: IHumanBody = createHumanBody(man.body.skeleton, man.body.profile);
  const l: number = body.measure.hipHeight;
  const goal: IAutoMovieVector3 = { x: 0, y: 0, z: 6 };
  const perform = (chain: HumanChain): HumanPerformance =>
    new HumanPerformance({
      seed: "jump",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        },
      ],
      composition: chain.node,
    });
  const walking: HumanPerformance = perform(
    HumanChain.subject("a").walk({ to: goal }),
  );
  const walk = walking.segments("a")[0]!;
  const share = (name: string): number =>
    walk.plan.events.find((e) => e.name === name)!.share;
  const s0: number = share("leftHeelStrike2");
  const s1: number = share("leftHeelStrike3");
  const model = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  let illegal: string[] = [];
  let slip: { value: number; where: string } = { value: 0, where: "none" };
  let jumpRatio: { value: number; where: string } = { value: 0, where: "none" };
  let pop: { value: number; where: string } = { value: 0, where: "none" };
  // A displayed pose's channels: the root translation and every clinical angle.
  const channels = (pose: IAutoMoviePose): Map<string, number> => {
    const out: Map<string, number> = new Map();
    const r: IAutoMovieVector3 = pose.root?.translation ?? { x: 0, y: 0, z: 0 };
    out.set("root.tx", r.x);
    out.set("root.ty", r.y);
    out.set("root.tz", r.z);
    for (const j of pose.joints) {
      out.set(`${j.bone}.flexion`, j.flexion ?? 0);
      out.set(`${j.bone}.abduction`, j.abduction ?? 0);
      out.set(`${j.bone}.twist`, j.twist ?? 0);
    }
    return out;
  };
  let flight: { value: number; where: string } = { value: 0, where: "none" };
  let sink: { value: number; where: string } = { value: 0, where: "none" };
  const tuck: string[] = [];
  let tuckOk: boolean = true;
  let drawn: HumanPerformance | undefined;
  for (let k: number = 0; k <= 20; k++) {
    const cut: number = s0 + ((s1 - s0) * k) / 20;
    const at: number = walk.start + cut * walk.plan.duration;
    const hips: IAutoMovieVector3 = walking
      .bones("a", at)
      .get("hips")!.worldPosition;
    let performance: HumanPerformance;
    try {
      performance = perform(
        HumanChain.subject("a")
          .walk({ to: goal })
          .until({ share: cut })
          .jump({ to: { x: hips.x, y: 0, z: hips.z + 0.9 } }),
      );
    } catch (error) {
      illegal = [
        ...illegal,
        `k=${k}: ${(error as Error).message.slice(0, 120)}`,
      ];
      continue;
    }
    if (k === 10) drawn = performance;
    const segments = performance.segments("a");
    const leap = segments[1]!;
    const event = (name: string): number =>
      leap.start +
      leap.plan.events.find((e) => e.name === name)!.share * leap.plan.duration;
    const takeoff: number = event("takeoff");
    const touchdown: number = event("touchdown");
    const end: number = performance.duration;
    const bones = (
      t: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      performance.bones("a", t);

    // Slip: the planted point on the floor inside either action's plant window.
    const windows = segments.flatMap((seg) =>
      seg.plan.contacts
        .filter((c) => c.kind === "plant")
        .map((c) => ({
          part: c.part,
          from: Math.max(seg.entryTime, seg.start + c.from * seg.plan.duration),
          to: Math.min(seg.end, seg.start + c.to * seg.plan.duration),
        })),
    );
    const touched: Map<string, IAutoMovieVector3> = new Map();
    for (
      let n: number = Math.floor((at - 0.3) * 120);
      n <= Math.ceil(end * 120);
      n++
    ) {
      const t: number = Math.min(end, n / 120);
      const map = bones(t);
      for (const side of ["left", "right"] as const) {
        const w: number = windows.findIndex(
          (x) =>
            x.part === `${side}Foot` && t >= x.from + 1e-9 && t <= x.to - 1e-9,
        );
        const sole: FootSlip.IPoint[] = FootSlip.points(body, map, side);
        for (const { socket, point } of sole)
          if (t >= touchdown && -point.y > sink.value)
            sink = {
              value: -point.y,
              where: `k=${k} ${side} ${socket} t=${t.toFixed(3)} (${t < takeoff ? (t < at ? "walk" : "push-off") : "landing"})`,
            };
        const planted: FootSlip.IPoint = FootSlip.contact(sole);
        if (w < 0 || planted.point.y > 0.01) continue;
        const d: number = FootSlip.drift(touched, `${side}${w}`, planted);
        if (d > slip.value)
          slip = {
            value: d,
            where: `k=${k} ${side} ${planted.socket} t=${t.toFixed(3)}`,
          };
      }
    }

    // Velocity jump at the cut against the window's peak bone speed.
    const velocity = (
      t: number,
      h: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieVector3> => {
      const a = bones(t - h);
      const b = bones(t + h);
      const out: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
      for (const [bone, r] of a) {
        const q: IAutoMovieVector3 = b.get(bone)!.worldPosition;
        out.set(bone, {
          x: (q.x - r.worldPosition.x) / (2 * h),
          y: (q.y - r.worldPosition.y) / (2 * h),
          z: (q.z - r.worldPosition.z) / (2 * h),
        });
      }
      return out;
    };
    const h: number = 1 / 480;
    const before = velocity(at - 2 * h, h);
    const after = velocity(at + 2 * h, h);
    let change: number = 0;
    let jumped: string = "";
    for (const [bone, v] of before) {
      const w: IAutoMovieVector3 = after.get(bone)!;
      const c: number = Math.hypot(w.x - v.x, w.y - v.y, w.z - v.z);
      if (c > change) {
        change = c;
        jumped = `${bone} ${Math.hypot(v.x, v.y, v.z).toFixed(2)}->${Math.hypot(w.x, w.y, w.z).toFixed(2)} m/s`;
      }
    }
    // The displayed channel whose velocity changes most across the cut: the
    // root translation (m/s) and every clinical angle (deg/s), by symmetric
    // difference at the cut -/+ 1/240 s.
    const channel = (cut: number): string => {
      const rate = (t: number): Map<string, number> => {
        const a = channels(performance.pose("a", t - h));
        const b = channels(performance.pose("a", t + h));
        return new Map(
          [...a].map(([key, x]): [string, number] => [
            key,
            ((b.get(key) ?? 0) - x) / (2 * h),
          ]),
        );
      };
      const v0 = rate(cut - 2 * h);
      const v1 = rate(cut + 2 * h);
      let best: { key: string; score: number } = { key: "", score: -1 };
      for (const [key, x] of v0) {
        // Metres against degrees: 1 m/s weighs as 100 deg/s, a 1 m segment's turn.
        const d: number =
          Math.abs((v1.get(key) ?? 0) - x) *
          (key.startsWith("root.t") ? 100 : 1);
        if (d > best.score) best = { key, score: d };
      }
      const unit: string = best.key.startsWith("root.t") ? "m/s" : "deg/s";
      return `channel ${best.key} ${v0.get(best.key)!.toFixed(2)}->${(v1.get(best.key) ?? 0).toFixed(2)} ${unit}`;
    };
    let peak: number = 0;
    for (
      let t: number = Math.max(h, at - 0.5);
      t <= Math.min(end - h, at + 0.5);
      t += 1 / 60
    )
      for (const v of velocity(t, h).values())
        peak = Math.max(peak, Math.hypot(v.x, v.y, v.z));
    if (change / peak > jumpRatio.value)
      jumpRatio = {
        value: change / peak,
        where: `k=${k} ${jumped}, peak ${peak.toFixed(2)} m/s; ${channel(at)}`,
      };

    // Continuity of every displayed channel at the cut itself.
    const before0 = channels(performance.pose("a", at - 1e-6));
    const after0 = channels(performance.pose("a", at + 1e-6));
    for (const [key, x] of before0) {
      const d: number = Math.abs((after0.get(key) ?? 0) - x);
      const scaled: number = key.startsWith("root.t") ? d * 1000 : d;
      if (scaled > pop.value)
        pop = {
          value: scaled,
          where: `k=${k} ${key} ${x.toFixed(key.startsWith("root.t") ? 4 : 2)}->${(after0.get(key) ?? 0).toFixed(key.startsWith("root.t") ? 4 : 2)}`,
        };
    }

    // Flight: least-squares parabola with gravity fixed.
    const samples: { t: number; p: IAutoMovieVector3 }[] = [];
    for (
      let t: number = takeoff + 1 / 240;
      t < touchdown - 1 / 240;
      t += 1 / 120
    )
      samples.push({
        t: t - takeoff,
        p: resolveAutoMovieCenterOfMass.place(model, bones(t)),
      });
    const fit = (
      value: (s: { t: number; p: IAutoMovieVector3 }) => number,
    ): ((t: number) => number) => {
      const n: number = samples.length;
      const st: number = samples.reduce((a, s) => a + s.t, 0);
      const stt: number = samples.reduce((a, s) => a + s.t * s.t, 0);
      const sv: number = samples.reduce((a, s) => a + value(s), 0);
      const stv: number = samples.reduce((a, s) => a + s.t * value(s), 0);
      const slope: number = (n * stv - st * sv) / (n * stt - st * st);
      const intercept: number = (sv - slope * st) / n;
      return (t: number): number => intercept + slope * t;
    };
    if (samples.length >= 3) {
      const fx = fit((s) => s.p.x);
      const fz = fit((s) => s.p.z);
      const fy = fit((s) => s.p.y + 0.5 * 9.81 * s.t * s.t);
      for (const s of samples) {
        const e: number = Math.hypot(
          s.p.x - fx(s.t),
          s.p.y - (fy(s.t) - 0.5 * 9.81 * s.t * s.t),
          s.p.z - fz(s.t),
        );
        if (e > flight.value)
          flight = {
            value: e,
            where: `k=${k} t=${(s.t + takeoff).toFixed(3)}`,
          };
      }
    }

    // The reaching leg under the body at take-off.
    const map = bones(takeoff);
    const hipsAt: IAutoMovieVector3 = map.get("hips")!.worldPosition;
    const takeoffSide: string = leap.plan.contacts[0]!.part.startsWith("left")
      ? "left"
      : "right";
    const reach: IAutoMovieVector3 = map.get(
      takeoffSide === "left" ? "rightFoot" : "leftFoot",
    )!.worldPosition;
    const horizontal: number = Math.hypot(
      reach.x - hipsAt.x,
      reach.z - hipsAt.z,
    );
    if (horizontal > 0.25 * l || reach.y < 0.2 * l) {
      tuckOk = false;
      tuck.push(
        `k=${k} ${(horizontal / l).toFixed(2)} l away, ${(reach.y / l).toFixed(2)} l up`,
      );
    }
  }
  if (drawn === undefined)
    throw new Error(`The middle cut of E1 failed: ${illegal.join("; ")}`);
  const leap = drawn.segments("a")[1]!;
  const named = leap.plan.events.map((e) => ({
    seconds: leap.start + e.share * leap.plan.duration,
    label: e.name,
  }));
  const grid = Array.from(
    { length: Math.floor(drawn.duration / 0.1) + 1 },
    (_, n: number) => ({
      seconds: n * 0.1,
      label: `${(n * 0.1).toFixed(1)} s`,
    }),
  ).filter((g) => g.seconds >= leap.entryTime - 0.6);
  const performance: HumanPerformance = drawn;
  return [
    {
      name: `jump-e1-${who}`,
      times: [
        ...grid,
        ...named,
        { seconds: leap.entryTime, label: "cut" },
      ].sort((a, b) => a.seconds - b.seconds),
      performers: [
        {
          id: "a",
          body: man.body,
          pose: (seconds: number): IAutoMoviePose =>
            performance.pose("a", seconds),
        },
      ],
      verdicts: [
        {
          name: "every cut across the stride is legal",
          passed: illegal.length === 0,
          detail: illegal.join("; ") || "21 of 21",
        },
        {
          name: "contact points on the floor slide under 5 mm",
          passed: slip.value <= 0.005,
          detail: `max ${(slip.value * 1000).toFixed(2)} mm at ${slip.where}`,
        },
        {
          name: "velocity jump at the cut within 5 % of the window peak",
          passed: jumpRatio.value <= 0.05,
          detail: `max ${(jumpRatio.value * 100).toFixed(2)} % at ${jumpRatio.where}`,
        },
        {
          name: "every displayed channel is continuous at the cut, under 0.5 degree or 0.5 mm",
          passed: pop.value <= 0.5,
          detail: `max ${pop.value.toFixed(2)} (degrees, root millimetres) at ${pop.where}`,
        },
        {
          name: "flight within 10 mm of a ballistic parabola",
          passed: flight.value <= 0.01,
          detail: `max ${(flight.value * 1000).toFixed(2)} mm at ${flight.where}`,
        },
        {
          name: "landing sinks at most 10 mm",
          passed: sink.value <= 0.01,
          detail: `max ${(sink.value * 1000).toFixed(2)} mm at ${sink.where}`,
        },
        {
          name: "the reaching leg is under the body at take-off",
          passed: tuckOk,
          detail: tuck.join("; ") || "all 21",
        },
      ],
    },
  ];
}
