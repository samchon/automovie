import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { run } from "../../actions/run";
import { walk } from "../../actions/walk";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { FootSlip } from "./FootSlip";

/**
 * Capture cases of the walk law on the polygon man (E0): every body of
 * `MotionBodies.SWEEP` walks 4 m ahead alone, one case
 * per body and pace (`walk-<pace>-<body>`), the same bodies running 10 m at
 * a jog, a run and a sprint (`run-<pace>-<body>`, judged by the same verdicts
 * against the gait's Froude speed), and the average body walking
 * a bent path through a via point, turning to face +X at the end with a
 * shorter stride, a wider arm swing and the elbows out (`walk-path-m-average`),
 * whose verdicts add passing within 15 cm of the via point and the final
 * heading within 3°; its steady speed is not judged, the path being bent.
 *
 * Instants are every 0.2 s, every heel strike and toe-off, and the end. The overlays are each ankle's trail and a drift marker for every 24 Hz
 * sample of the planted point in stance, coloured against the 5 mm slip
 * limit; each walker's destination is marked. The verdicts are the ones a
 * walk must keep: the planted point, the lowest of heel, ball and toe pad
 * (the heel in the heel rocker, the toe pad in the forefoot rocker), while it
 * touches the floor (within 1 cm) in stance, slides under 5 mm across it
 * from where it first was the planted point of that stance ({@link FootSlip}),
 * the foot-skate measure of Kovar, Schreiner
 * and Gleicher (2002), since the ankle itself moves as the foot rolls over
 * its rockers; no heel, ball or toe sinks more than 5 mm under the floor;
 * every displayed ankle meets its IK goal within 2 mm and every swinging foot
 * its goal rotation within 1 degree, so a range-of-motion clamp shows, and
 * every stance foot too, except that a goal naming a contact declares the
 * heel-off of `HumanFoot.heelOff`, so such a foot may be more toes-down than
 * asked while its heading, roll and any toes-up miss still count; the walker stops
 * within 2 cm of the destination; and the steady speed, the pelvis between
 * the first and the second-to-last left heel strikes, lies within 10 % of
 * the pace's Froude speed `sqrt(Fr g l)`; and every displayed channel, the
 * root translation and every clinical angle, is continuous at every heel
 * strike and toe-off, within 0.5 degree and the root within 0.5 mm from 1
 * microsecond before the event to 1 after. Each failing verdict names the
 * walker, foot, point and second of its worst sample.
 *
 * @param kind Walking or running cases.
 * @param only Keeps the cases whose name it accepts, the others not being built; every case when absent.
 * @returns The cases, each built as it is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases, instants, overlays and every verdict with its bound.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures stance slip and floor penetration on the displayed bones and the body's own sockets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per pace; overlays and verdicts from one 24 Hz pass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stance windows come from the plan's contact windows, not from foot heights.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in samples times walkers.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function* locomotionCases(
  kind: "walk" | "run",
  only?: (name: string) => boolean,
): Iterable<IMotionCaptureCase> {
  for (const who of MotionBodies.SWEEP) {
    const names = [who] as const;
    // The bodies are prepared on the first case the filter keeps.
    let prepared:
      | { men: humanPolygonMan.IPolygonMan[]; bodies: IHumanBody[] }
      | undefined;
    const prepare = (): NonNullable<typeof prepared> => {
      if (prepared === undefined) {
        const men: humanPolygonMan.IPolygonMan[] = names.map((name) =>
          MotionBodies.population(name),
        );
        prepared = {
          men,
          bodies: men.map((man) =>
            createHumanBody(man.body.skeleton, man.body.profile),
          ),
        };
      }
      return prepared;
    };
    const all: {
      law: "walk" | "run";
      pace: string;
      froude: number;
      label: string;
      to: IAutoMovieVector3;
      extra: Omit<walk.IParams, "to" | "pace">;
    }[] = [
      ...(["slow", "normal", "fast"] as const).map((pace) => ({
        law: "walk" as const,
        pace,
        froude: walk.FROUDE[pace],
        label: pace,
        to: { x: 0, y: 0, z: 4 },
        extra: {},
      })),
      ...(["jog", "run", "sprint"] as const).map((pace) => ({
        law: "run" as const,
        pace,
        froude: run.GAITS[pace].froude,
        label: pace,
        to: { x: 0, y: 0, z: 10 },
        extra: {},
      })),
      ...(who === "m-average"
        ? [
            {
              law: "walk" as const,
              pace: "normal",
              froude: walk.FROUDE.normal,
              label: "path",
              to: { x: 1.5, y: 0, z: 4 },
              extra: {
                via: [{ x: 1.5, y: 0, z: 1.5 }],
                face: 90,
                stride: 0.9,
                armSwing: 1.5,
                elbows: 10,
              },
            },
          ]
        : []),
    ];
    for (const { law, pace, froude: fr, label, to, extra } of all) {
      if (law !== kind) continue;
      if (only !== undefined && !only(`${law}-${label}-${who}`)) continue;
      const { men, bodies } = prepare();
      yield ((): IMotionCaptureCase => {
        const lanes: number[] = names.map((): number => 0);
        const goals: IAutoMovieVector3[] = names.map(
          (): IAutoMovieVector3 => to,
        );
        let chain: HumanChain | undefined;
        names.forEach((_, i: number): void => {
          const one: HumanChain =
            law === "walk"
              ? HumanChain.subject(`w${i}`).walk({
                  to: goals[i]!,
                  pace: pace as "slow" | "normal" | "fast",
                  ...extra,
                })
              : HumanChain.subject(`w${i}`).run({
                  to: goals[i]!,
                  pace: pace as "jog" | "run" | "sprint",
                  ...extra,
                });
          chain = chain === undefined ? one : chain.with(one);
        });
        const performance: HumanPerformance = new HumanPerformance({
          seed: "walk",
          performers: bodies.map((body: IHumanBody, i: number) => ({
            subject: `w${i}`,
            body,
            at: { x: lanes[i]!, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" as const },
          })),
          composition: chain!.node,
        });
        const end: number = performance.duration;
        const trails: { color: number; points: IAutoMovieVector3[] }[] = [];
        const drift: { at: IAutoMovieVector3; drift: number }[] = [];
        let slip: { value: number; where: string } = {
          value: 0,
          where: "none",
        };
        let sink: { value: number; where: string } = {
          value: 0,
          where: "none",
        };
        let reach: { value: number; where: string } = {
          value: 0,
          where: "none",
        };
        const turn: Record<
          "stance" | "swing",
          { value: number; where: string }
        > = {
          stance: { value: 0, where: "none" },
          swing: { value: 0, where: "none" },
        };
        let pop: { value: number; where: string } = {
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
          const body: IHumanBody = bodies[i]!;
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
          const ankles: Record<"left" | "right", IAutoMovieVector3[]> = {
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
              const phase: "stance" | "swing" = n < 0 ? "swing" : "stance";
              const within: string =
                n < 0
                  ? ""
                  : ` u=${((t - stances[n]!.from) / (stances[n]!.to - stances[n]!.from)).toFixed(2)}`;
              let error: number = 0;
              const limb =
                posture.limbs[side === "left" ? "leftLeg" : "rightLeg"];
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
                  const parts = (
                    o: typeof q,
                  ): { h: number; p: number; r: number } => {
                    const fw = Quaternion.rotateVector(o, { x: 0, y: 0, z: 1 });
                    const up = Quaternion.rotateVector(o, { x: 0, y: 1, z: 0 });
                    const h: number = Math.atan2(fw.x, fw.z);
                    return {
                      h: (h * 180) / Math.PI,
                      p:
                        (Math.asin(Math.max(-1, Math.min(1, fw.y))) * 180) /
                        Math.PI,
                      r:
                        (Math.atan2(
                          up.x * Math.cos(h) - up.z * Math.sin(h),
                          up.y,
                        ) *
                          180) /
                        Math.PI,
                    };
                  };
                  const full: number =
                    (2 *
                      Math.acos(
                        Math.min(
                          1,
                          Math.abs(
                            q.x * r.x + q.y * r.y + q.z * r.z + q.w * r.w,
                          ),
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
                      const fw = Quaternion.rotateVector(o, {
                        x: 0,
                        y: 0,
                        z: 1,
                      });
                      const up = Quaternion.rotateVector(o, {
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
              const sole: FootSlip.IPoint[] = FootSlip.points(
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
              const planted: FootSlip.IPoint = FootSlip.contact(sole);
              if (n >= 0 && planted.point.y <= 0.01) {
                const d: number = FootSlip.drift(
                  touched,
                  `${side}${n}`,
                  planted,
                );
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
          const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
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
          const froude: number = Math.sqrt(fr * 9.81 * body.measure.hipHeight);
          speeds.push(
            `${names[i]} ${speed.toFixed(2)}/${froude.toFixed(2)} m/s`,
          );
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
          name: `${law}-${label}-${who}`,
          times: instants(performance, end),
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
                    passed:
                      Math.abs(((facing - extra.face + 540) % 360) - 180) <= 3,
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
      })();
    }
  }
}

/** Every 0.2 s, and every heel strike and toe-off, labelled. */
function instants(
  performance: HumanPerformance,
  end: number,
): IMotionCaptureCase.ITime[] {
  const segment = performance.segments("w0")[0]!;
  const events: IMotionCaptureCase.ITime[] = segment.plan.events
    .filter((e) => /HeelStrike|ToeOff/.test(e.name))
    .map((e) => ({
      seconds: segment.start + e.share * segment.plan.duration,
      label: e.name.replace(/^(left|right)/, (m: string): string =>
        m === "left" ? "L " : "R ",
      ),
    }));
  const grid: IMotionCaptureCase.ITime[] = Array.from(
    { length: Math.floor(end / 0.2) + 1 },
    (_, k: number) => ({
      seconds: k * 0.2,
      label: `${(k * 0.2).toFixed(1)} s`,
    }),
  );
  return [...grid, ...events, { seconds: end, label: "end" }].sort(
    (a, b): number => a.seconds - b.seconds,
  );
}
