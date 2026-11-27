import { AutoMovieEngineGravity, AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanWalkParams,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanChain } from "../../chain/AutoMovieMotionHumanChain";
import { AutoMovieMotionHumanPerformance } from "../../perform/AutoMovieMotionHumanPerformance";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { FootSlip } from "./FootSlip";
import { locomotionCaseInstants } from "./internal/locomotionCaseInstants";

/*
 * One walk or run capture case of `locomotionCases`: one body walks or runs to
 * its goal at the row's pace, with the frames, trails and verdicts that
 * builder's documentation lists.
 * Parameter input: The body, the row's law, pace, Froude number, label, goal and
 * extra walk parameters, and the prepared polygon men and bodies.
 * Returns: The case.
 */
export function locomotionCase(
  input: locomotionCase.IInput,
): IMotionCaptureCase {
  const { who, names, gait, froude: fr, label, to, extra, men, bodies } = input;
  const lanes: number[] = names.map((): number => 0);
  const goals: IAutoMovieVector3[] = names.map((): IAutoMovieVector3 => to);
  let chain: IAutoMovieMotionHumanChain | undefined;
  names.forEach((_, i: number): void => {
    const one: IAutoMovieMotionHumanChain =
      gait.law === "walk"
        ? AutoMovieMotionHumanChain.subject(`w${i}`).walk({
            to: goals[i]!,
            pace: gait.pace,
            ...extra,
          })
        : AutoMovieMotionHumanChain.subject(`w${i}`).run({
            to: goals[i]!,
            pace: gait.pace,
            ...extra,
          });
    chain = chain === undefined ? one : chain.with(one);
  });
  const performance: IAutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
    seed: "walk",
    performers: bodies.map((body: IAutoMovieMotionHumanBody, i: number) => ({
      subject: `w${i}`,
      body,
      at: { x: lanes[i]!, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    composition: chain!.node,
  });
  const end: number = performance.duration;
  const trails: ILocomotionCaseTrailsItem[] = [];
  const drift: ILocomotionCaseDriftItem[] = [];
  let slip: ILocomotionCaseSlip = {
    value: 0,
    where: "none",
  };
  let sink: ILocomotionCaseSink = {
    value: 0,
    where: "none",
  };
  let reach: ILocomotionCaseReach = {
    value: 0,
    where: "none",
  };
  const turn: Record<LocomotionCaseTurnEntry, ILocomotionCaseTurnEntry> = {
    stance: { value: 0, where: "none" },
    swing: { value: 0, where: "none" },
  };
  let pop: ILocomotionCasePop = {
    value: 0,
    where: "none",
  };
  const misses: number[] = [];
  let via: number = Infinity;
  let facing: number = 0;
  const speeds: string[] = [];
  let speedOk: boolean = true;
  names.forEach((_, i: number): void => {
    const subject: string = `w${i}`;
    const body: IAutoMovieMotionHumanBody = bodies[i]!;
    const segment = performance.segments(subject)[0]!;
    const at = (name: string): number =>
      segment.start +
      segment.plan.events.find((e) => e.name === name)!.share *
        segment.plan.duration;
    const stances = segment.plan.contacts.map((c) => ({
      part: c.part,
      from: segment.start + c.from * segment.plan.duration,
      to: segment.start + c.to * segment.plan.duration,
    }));
    const ankles: Record<AutoMovieHumanSide, IAutoMovieVector3[]> = {
      left: [],
      right: [],
    };
    const touched: Map<string, IAutoMovieVector3> = new Map();
    for (let k: number = 0; k <= Math.ceil(end * 24); k++) {
      const t: number = Math.min(end, k / 24);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones(subject, t);
      const posture = performance.posture(subject, t);
      for (const v of extra.via ?? [])
        via = Math.min(
          via,
          Math.hypot(
            bones.get("hips")!.worldPosition.x - v.x,
            bones.get("hips")!.worldPosition.z - v.z,
          ),
        );
      for (const side of ["left", "right"] as const) {
        const ankle: IAutoMovieVector3 = bones.get(
          `${side}Foot`,
        )!.worldPosition;
        ankles[side].push(ankle);
        const n: number = stances.findIndex(
          (st) =>
            st.part === `${side}Foot` &&
            t >= st.from + 1e-9 &&
            t <= st.to - 1e-9,
        );
        const phase: LocomotionCasePhase = n < 0 ? "swing" : "stance";
        const within: string =
          n < 0
            ? ""
            : ` u=${((t - stances[n]!.from) / (stances[n]!.to - stances[n]!.from)).toFixed(2)}`;
        let error: number = 0;
        const limb = posture.limbs[side === "left" ? "leftLeg" : "rightLeg"];
        if (limb !== undefined) {
          const goal: IAutoMovieVector3 = limb.point;
          const miss: number = Math.hypot(
            ankle.x - goal.x,
            ankle.y - goal.y,
            ankle.z - goal.z,
          );
          if (miss > reach.value)
            reach = {
              value: miss,
              where: `${names[i]} ${side} ${phase} t=${t.toFixed(2)}`,
            };
          if (limb.rotation !== undefined) {
            const q = bones.get(`${side}Foot`)!.worldRotation;
            const r = limb.rotation;
            // Heading, pitch and roll of a rotation, degrees.
            const parts = (o: typeof q): ILocomotionCasePartsResult => {
              const fw = AutoMovieEngineQuaternion.rotateVector(o, { x: 0, y: 0, z: 1 });
              const up = AutoMovieEngineQuaternion.rotateVector(o, { x: 0, y: 1, z: 0 });
              const h: number = Math.atan2(fw.x, fw.z);
              return {
                h: (h * 180) / Math.PI,
                p: (Math.asin(Math.max(-1, Math.min(1, fw.y))) * 180) / Math.PI,
                r:
                  (Math.atan2(up.x * Math.cos(h) - up.z * Math.sin(h), up.y) *
                    180) /
                  Math.PI,
              };
            };
            const full: number =
              (2 *
                Math.acos(
                  Math.min(
                    1,
                    Math.abs(q.x * r.x + q.y * r.y + q.z * r.z + q.w * r.w),
                  ),
                ) *
                180) /
              Math.PI;
            // A planted goal naming a contact declares the heel-off: the foot may
            // be more toes-down than asked; heading, roll and any toes-up miss count.
            const a = parts(r);
            const b = parts(q);
            let dh: number = b.h - a.h;
            while (dh > 180) dh -= 360;
            while (dh < -180) dh += 360;
            const angle: number =
              limb.contact === undefined
                ? full
                : Math.max(
                    Math.abs(dh),
                    Math.abs(b.r - a.r),
                    Math.max(0, b.p - a.p),
                  );
            error = angle;
            if (angle > turn[phase].value) {
              // Read both rotations as heading, pitch and roll, and the shank's lean.
              const read = (o: typeof q) => {
                const fw = AutoMovieEngineQuaternion.rotateVector(o, {
                  x: 0,
                  y: 0,
                  z: 1,
                });
                const up = AutoMovieEngineQuaternion.rotateVector(o, {
                  x: 0,
                  y: 1,
                  z: 0,
                });
                return `h${((Math.atan2(fw.x, fw.z) * 180) / Math.PI).toFixed(1)} p${((Math.asin(fw.y) * 180) / Math.PI).toFixed(1)} r${((Math.atan2(up.x * Math.cos(Math.atan2(fw.x, fw.z)) - up.z * Math.sin(Math.atan2(fw.x, fw.z)), up.y) * 180) / Math.PI).toFixed(1)}`;
              };
              const knee: IAutoMovieVector3 = bones.get(
                `${side}LowerLeg`,
              )!.worldPosition;
              const shankLean: number =
                (Math.atan2(knee.z - ankle.z, knee.y - ankle.y) * 180) /
                Math.PI;
              turn[phase] = {
                value: angle,
                where: `${names[i]} ${side} t=${t.toFixed(2)}${within} goal ${read(r)} shown ${read(q)} shank ${shankLean.toFixed(1)}`,
              };
            }
          }
        }
        const sole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
          body,
          bones,
          side,
        );
        for (const { socket, point } of sole)
          if (-point.y > sink.value)
            sink = {
              value: -point.y,
              where: `${names[i]} ${side} ${socket} ${phase} t=${t.toFixed(2)}`,
            };
        // The planted point on the floor during a stance must not move across it.
        const planted: IAutoMovieMotionHumanFoot.ISocket =
          FootSlip.contact(sole);
        if (n >= 0 && planted.point.y <= 0.01) {
          const d: number = FootSlip.drift(touched, `${side}${n}`, planted);
          if (d > slip.value)
            slip = {
              value: d,
              where: `${names[i]} ${side} ${planted.socket} t=${t.toFixed(2)}${within}, foot rotation off ${error.toFixed(1)} deg`,
            };
          drift.push({ at: planted.point, drift: d });
        }
      }
    }
    trails.push(
      { color: 0x3070c0, points: ankles.left },
      { color: 0xc07030, points: ankles.right },
    );
    const hips: IAutoMovieVector3 = performance
      .bones(subject, segment.end)
      .get("hips")!.worldPosition;
    misses.push(Math.hypot(hips.x - goals[i]!.x, hips.z - goals[i]!.z));
    const ahead: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      performance.bones(subject, segment.end).get("hips")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    facing = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
    // Steady speed: the pelvis between the first and the last left heel strike after it.
    const strikes: number[] = segment.plan.events
      .filter((e) => /^leftHeelStrike\d+$/.test(e.name))
      .map((e) => at(e.name));
    const a: IAutoMovieVector3 = performance
      .bones(subject, strikes[0]!)
      .get("hips")!.worldPosition;
    const until: number = strikes[Math.max(0, strikes.length - 2)]!;
    const b: IAutoMovieVector3 = performance
      .bones(subject, until)
      .get("hips")!.worldPosition;
    const span: number = until - strikes[0]!;
    const speed: number =
      span > 0 ? Math.hypot(b.x - a.x, b.z - a.z) / span : 0;
    const froude: number = Math.sqrt(
      fr * AutoMovieEngineGravity.STANDARD * body.measure.hipHeight,
    );
    speeds.push(`${names[i]} ${speed.toFixed(2)}/${froude.toFixed(2)} m/s`);
    if (Math.abs(speed / froude - 1) > 0.1) speedOk = false;
    // Continuity of every displayed channel at every contact event.
    const channels = (seconds: number): Map<string, number> => {
      const pose: IAutoMoviePose = performance.pose(subject, seconds);
      const r: IAutoMovieVector3 = pose.root?.translation ?? {
        x: 0,
        y: 0,
        z: 0,
      };
      const out: Map<string, number> = new Map([
        ["root.tx", r.x * 1000],
        ["root.ty", r.y * 1000],
        ["root.tz", r.z * 1000],
      ]);
      for (const j of pose.joints) {
        out.set(`${j.bone}.flexion`, j.flexion ?? 0);
        out.set(`${j.bone}.abduction`, j.abduction ?? 0);
        out.set(`${j.bone}.twist`, j.twist ?? 0);
      }
      return out;
    };
    for (const e of segment.plan.events) {
      if (!/HeelStrike|ToeOff/.test(e.name)) continue;
      const t: number = at(e.name);
      if (t <= 1e-3 || t >= end - 1e-3) continue;
      const before: Map<string, number> = channels(t - 1e-6);
      const after: Map<string, number> = channels(t + 1e-6);
      for (const [key, x] of before) {
        const d: number = Math.abs((after.get(key) ?? 0) - x);
        if (d > pop.value)
          pop = {
            value: d,
            where: `${names[i]} ${e.name} t=${t.toFixed(3)} ${key} ${x.toFixed(2)}->${(after.get(key) ?? 0).toFixed(2)}`,
          };
      }
    }
  });
  return {
    name: `${gait.law}-${label}-${who}`,
    times: locomotionCaseInstants(performance, end),
    performers: names.map(
      (_, i: number): IMotionCaptureCase.IPerformer => ({
        id: `w${i}`,
        body: men[i]!.body,
        pose: (seconds: number): IAutoMoviePose =>
          performance.pose(`w${i}`, seconds),
      }),
    ),
    trails,
    drift: [{ samples: drift, limit: 0.005 }],
    targets: goals.map((at: IAutoMovieVector3) => ({
      at,
      radius: 0.04,
      color: 0xd04040,
    })),
    verdicts: [
      {
        name: "contact points on the floor slide under 5 mm",
        passed: slip.value <= 0.005,
        detail: `max ${(slip.value * 1000).toFixed(2)} mm at ${slip.where}`,
      },
      {
        name: "heel, ball and toe stay above the floor within 5 mm",
        passed: sink.value <= 0.005,
        detail: `max sink ${(sink.value * 1000).toFixed(2)} mm at ${sink.where}`,
      },
      {
        name: "stance feet meet their goal rotations, a declared heel-off allowed, within 1 degree",
        passed: turn.stance.value <= 1,
        detail: `max ${turn.stance.value.toFixed(2)} deg at ${turn.stance.where}`,
      },
      {
        name: "swing feet meet their goal rotations within 1 degree",
        passed: turn.swing.value <= 1,
        detail: `max ${turn.swing.value.toFixed(2)} deg at ${turn.swing.where}`,
      },
      {
        name: "displayed ankles meet their goals within 2 mm",
        passed: reach.value <= 0.002,
        detail: `max ${(reach.value * 1000).toFixed(2)} mm at ${reach.where}`,
      },
      ...(extra.via === undefined
        ? []
        : [
            {
              name: "passes within 15 cm of every via point",
              passed: via <= 0.15,
              detail: `closest ${(via * 100).toFixed(1)} cm`,
            },
          ]),
      ...(extra.face === undefined
        ? []
        : [
            {
              name: "faces the requested heading within 3 degrees",
              passed: Math.abs(((facing - extra.face + 540) % 360) - 180) <= 3,
              detail: `${facing.toFixed(1)} against ${extra.face}`,
            },
          ]),
      {
        name: "every displayed channel is continuous at every heel strike and toe-off, under 0.5 degree or 0.5 mm",
        passed: pop.value <= 0.5,
        detail: `max ${pop.value.toFixed(2)} (degrees, root millimetres) at ${pop.where}`,
      },
      {
        name: "stops within 2 cm of the destination",
        passed: Math.max(...misses) <= 0.02,
        detail: misses
          .map((m: number): string => `${(m * 100).toFixed(1)} cm`)
          .join(", "),
      },
      ...(extra.via === undefined
        ? [
            {
              name: "steady speed within 10 % of the Froude speed",
              passed: speedOk,
              detail: speeds.join("; "),
            },
          ]
        : []),
    ],
  };
}

/*
 * Companion types of `locomotionCase`.
 */
export namespace locomotionCase {
  /*
   * One row of the locomotion sweep on one body, with its prepared bodies.
   */
  export interface IInput {
    /*
     * The swept body's name.
     */
    who: string;

    /*
     * The performers' body names, one per lane.
     */
    names: readonly string[];

    /*
     * The law the row performs and its pace.
     */
    gait: IGait;

    /*
     * The pace's Froude number.
     */
    froude: number;

    /*
     * The case label.
     */
    label: string;

    /*
     * The goal, world metres.
     */
    to: IAutoMovieVector3;

    /*
     * Extra walk parameters.
     */
    extra: Omit<IAutoMovieMotionHumanWalkParams, LocomotionCaseInputExtra>;

    /*
     * The prepared polygon men.
     */
    men: humanPolygonMan.IPolygonMan[];

    /*
     * Their motion bodies.
     */
    bodies: IAutoMovieMotionHumanBody[];
  }

  /*
   * The locomotion laws the sweep runs.
   */
  export type Law = IGait["law"];

  /*
   * A row's law and its pace, the pace one of that law's own.
   */
  export type IGait =
    | { law: "walk"; pace: LocomotionCaseOne }
    | { law: "run"; pace: LocomotionCaseOne2 };
}

/*
 * The record of `ILocomotionCasePartsResult`'s site.
 */
type ILocomotionCasePartsResult = { h: number; p: number; r: number };

/*
 * The alternatives of `LocomotionCasePhase`'s site.
 */
type LocomotionCasePhase = "stance" | "swing";

/*
 * The record of `ILocomotionCasePop`'s site.
 */
type ILocomotionCasePop = { value: number; where: string };

/*
 * The record of `ILocomotionCaseTurnEntry`'s site.
 */
type ILocomotionCaseTurnEntry = { value: number; where: string };

/*
 * The alternatives of `LocomotionCaseTurnEntry`'s site.
 */
type LocomotionCaseTurnEntry = "stance" | "swing";

/*
 * The record of `ILocomotionCaseReach`'s site.
 */
type ILocomotionCaseReach = { value: number; where: string };

/*
 * The record of `ILocomotionCaseSink`'s site.
 */
type ILocomotionCaseSink = { value: number; where: string };

/*
 * The record of `ILocomotionCaseSlip`'s site.
 */
type ILocomotionCaseSlip = { value: number; where: string };

/*
 * The record of `ILocomotionCaseDriftItem`'s site.
 */
type ILocomotionCaseDriftItem = { at: IAutoMovieVector3; drift: number };

/*
 * The record of `ILocomotionCaseTrailsItem`'s site.
 */
type ILocomotionCaseTrailsItem = { color: number; points: IAutoMovieVector3[] };

/*
 * The alternatives of `LocomotionCaseOne2`'s site.
 */
type LocomotionCaseOne2 = "jog" | "run" | "sprint";

/*
 * The alternatives of `LocomotionCaseOne`'s site.
 */
type LocomotionCaseOne = "slow" | "normal" | "fast";

/*
 * The alternatives of `LocomotionCaseInputExtra`'s site.
 */
type LocomotionCaseInputExtra = "to" | "pace";
