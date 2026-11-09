import { type IAutoMovieResolvedBone, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { walk } from "../../actions/walk";
import { createHumanBody } from "../../body/createHumanBody";
import type { IHumanBody } from "../../body/IHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";

/**
 * Capture cases of the walk law on the polygon man (E0): the smallest, the
 * average and the tallest sweep bodies each walk 4 m ahead alone, one case
 * per body and pace (`walk-<pace>-<body>`).
 *
 * Instants are every 0.2 s, every heel strike and toe-off, and the end. The overlays are each ankle's trail and a drift marker for every 24 Hz
 * sample of a heel or ball on the floor in stance, coloured against the 5 mm
 * slip limit; each walker's destination is marked. The verdicts are the ones
 * a walk must keep: a heel or ball touching the floor (within 1 cm) in stance
 * slides under 5 mm across it, the foot-skate measure of Kovar, Schreiner
 * and Gleicher (2002), since the ankle itself moves as the foot rolls over
 * its rockers; no heel, ball or toe sinks more than 5 mm under the floor;
 * every displayed ankle meets its IK goal within 2 mm and every foot its goal
 * rotation within 1 degree, so a range-of-motion clamp shows; the walker stops
 * within 2 cm of the destination; and the steady speed, the pelvis between
 * the first and the second-to-last left heel strikes, lies within 10 % of
 * the pace's Froude speed `sqrt(Fr g l)`. Each failing verdict names the
 * walker, foot, point and second of its worst sample.
 *
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases, instants, overlays and every verdict with its bound.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures stance slip and floor penetration on the displayed bones and the body's own sockets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per pace; overlays and verdicts from one 24 Hz pass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stance windows come from the plan's contact windows, not from foot heights.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in samples times walkers.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function locomotionCases(): IMotionCaptureCase[] {
  return (["f-small", "m-average", "m-tall"] as const).flatMap((who) => {
  const names = [who] as const;
  const men = names.map((name) => MotionBodies.population(name));
  const bodies: IHumanBody[] = men.map((man) => createHumanBody(man.body.skeleton, man.body.profile));
  return (["slow", "normal", "fast"] as const).map((pace): IMotionCaptureCase => {
    const lanes: number[] = names.map((): number => 0);
    const goals: IAutoMovieVector3[] = lanes.map((x: number): IAutoMovieVector3 => ({ x, y: 0, z: 4 }));
    let chain: HumanChain | undefined;
    names.forEach((_, i: number): void => {
      const one: HumanChain = HumanChain.subject(`w${i}`).walk({ to: goals[i]!, pace });
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
    let slip: { value: number; where: string } = { value: 0, where: "none" };
    let sink: { value: number; where: string } = { value: 0, where: "none" };
    let reach: { value: number; where: string } = { value: 0, where: "none" };
    const turn: Record<"stance" | "swing", { value: number; where: string }> = { stance: { value: 0, where: "none" }, swing: { value: 0, where: "none" } };
    const misses: number[] = [];
    const speeds: string[] = [];
    let speedOk: boolean = true;
    names.forEach((_, i: number): void => {
      const subject: string = `w${i}`;
      const body: IHumanBody = bodies[i]!;
      const segment = performance.segments(subject)[0]!;
      const at = (name: string): number => segment.start + segment.plan.events.find((e) => e.name === name)!.share * segment.plan.duration;
      const stances = segment.plan.contacts.map((c) => ({
        part: c.part,
        from: segment.start + c.from * segment.plan.duration,
        to: segment.start + c.to * segment.plan.duration,
      }));
      const ankles: Record<"left" | "right", IAutoMovieVector3[]> = { left: [], right: [] };
      const touched: Map<string, IAutoMovieVector3> = new Map();
      for (let k: number = 0; k <= Math.ceil(end * 24); k++) {
        const t: number = Math.min(end, k / 24);
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = performance.bones(subject, t);
        const posture = performance.posture(subject, t);
        for (const side of ["left", "right"] as const) {
          const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
          ankles[side].push(ankle);
          const n: number = stances.findIndex((st) => st.part === `${side}Foot` && t >= st.from + 1e-9 && t <= st.to - 1e-9);
          const phase: "stance" | "swing" = n < 0 ? "swing" : "stance";
          const within: string = n < 0 ? "" : ` u=${((t - stances[n]!.from) / (stances[n]!.to - stances[n]!.from)).toFixed(2)}`;
          let error: number = 0;
          const limb = posture.limbs[side === "left" ? "leftLeg" : "rightLeg"];
          if (limb !== undefined) {
            const goal: IAutoMovieVector3 = limb.point;
            const miss: number = Math.hypot(ankle.x - goal.x, ankle.y - goal.y, ankle.z - goal.z);
            if (miss > reach.value) reach = { value: miss, where: `${names[i]} ${side} ${phase} t=${t.toFixed(2)}` };
            if (limb.rotation !== undefined) {
              const q = bones.get(`${side}Foot`)!.worldRotation;
              const r = limb.rotation;
              const angle: number = (2 * Math.acos(Math.min(1, Math.abs(q.x * r.x + q.y * r.y + q.z * r.z + q.w * r.w))) * 180) / Math.PI;
              error = angle;
              if (angle > turn[phase].value) {
                // Read both rotations as heading, pitch and roll, and the shank's lean.
                const read = (o: typeof q) => {
                  const fw = rotate(o, { x: 0, y: 0, z: 1 });
                  const up = rotate(o, { x: 0, y: 1, z: 0 });
                  return `h${((Math.atan2(fw.x, fw.z) * 180) / Math.PI).toFixed(1)} p${((Math.asin(fw.y) * 180) / Math.PI).toFixed(1)} r${((Math.atan2(up.x * Math.cos(Math.atan2(fw.x, fw.z)) - up.z * Math.sin(Math.atan2(fw.x, fw.z)), up.y) * 180) / Math.PI).toFixed(1)}`;
                };
                const knee: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
                const shankLean: number = (Math.atan2(knee.z - ankle.z, knee.y - ankle.y) * 180) / Math.PI;
                turn[phase] = { value: angle, where: `${names[i]} ${side} t=${t.toFixed(2)}${within} goal ${read(r)} shown ${read(q)} shank ${shankLean.toFixed(1)}` };
              }
            }
          }
          for (const socket of ["heel", "ball", "toe"] as const) {
            const frame = body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`];
            const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!).point;
            if (-p.y > sink.value) sink = { value: -p.y, where: `${names[i]} ${side} ${socket} ${phase} t=${t.toFixed(2)}` };
            // A contact point on the floor during a stance must not move across it.
            const key: string = `${side}${n}${socket}`;
            if (n < 0 || p.y > 0.01 || socket === "toe") {
              touched.delete(key);
              continue;
            }
            const first: IAutoMovieVector3 = touched.get(key) ?? p;
            touched.set(key, first);
            const d: number = Math.hypot(p.x - first.x, p.z - first.z);
            if (d > slip.value) slip = { value: d, where: `${names[i]} ${side} ${socket} t=${t.toFixed(2)}${within}, foot rotation off ${error.toFixed(1)} deg` };
            drift.push({ at: p, drift: d });
          }
        }
      }
      trails.push({ color: 0x3070c0, points: ankles.left }, { color: 0xc07030, points: ankles.right });
      const hips: IAutoMovieVector3 = performance.bones(subject, segment.end).get("hips")!.worldPosition;
      misses.push(Math.hypot(hips.x - goals[i]!.x, hips.z - goals[i]!.z));
      // Steady speed: the pelvis between the first and the last left heel strike after it.
      const strikes: number[] = segment.plan.events.filter((e) => /^leftHeelStrike\d+$/.test(e.name)).map((e) => at(e.name));
      const a: IAutoMovieVector3 = performance.bones(subject, strikes[0]!).get("hips")!.worldPosition;
      const until: number = strikes[Math.max(0, strikes.length - 2)]!;
      const b: IAutoMovieVector3 = performance.bones(subject, until).get("hips")!.worldPosition;
      const span: number = until - strikes[0]!;
      const speed: number = span > 0 ? Math.hypot(b.x - a.x, b.z - a.z) / span : 0;
      const froude: number = Math.sqrt(walk.FROUDE[pace] * 9.81 * body.measure.hipHeight);
      speeds.push(`${names[i]} ${speed.toFixed(2)}/${froude.toFixed(2)} m/s`);
      if (Math.abs(speed / froude - 1) > 0.1) speedOk = false;
    });
    return {
      name: `walk-${pace}-${who}`,
      times: instants(performance, end),
      performers: names.map((_, i: number): IMotionCaptureCase.IPerformer => ({
        id: `w${i}`,
        body: men[i]!.body,
        pose: (seconds: number): IAutoMoviePose => performance.pose(`w${i}`, seconds),
      })),
      trails,
      drift: [{ samples: drift, limit: 0.005 }],
      targets: goals.map((at: IAutoMovieVector3) => ({ at, radius: 0.04, color: 0xd04040 })),
      verdicts: [
        { name: "contact points on the floor slide under 5 mm", passed: slip.value <= 0.005, detail: `max ${(slip.value * 1000).toFixed(2)} mm at ${slip.where}` },
        { name: "heel, ball and toe stay above the floor within 5 mm", passed: sink.value <= 0.005, detail: `max sink ${(sink.value * 1000).toFixed(2)} mm at ${sink.where}` },
        { name: "stance feet meet their goal rotations within 1 degree", passed: turn.stance.value <= 1, detail: `max ${turn.stance.value.toFixed(2)} deg at ${turn.stance.where}` },
        { name: "swing feet meet their goal rotations within 1 degree", passed: turn.swing.value <= 1, detail: `max ${turn.swing.value.toFixed(2)} deg at ${turn.swing.where}` },
        { name: "displayed ankles meet their goals within 2 mm", passed: reach.value <= 0.002, detail: `max ${(reach.value * 1000).toFixed(2)} mm at ${reach.where}` },
        { name: "stops within 2 cm of the destination", passed: Math.max(...misses) <= 0.02, detail: misses.map((m: number): string => `${(m * 100).toFixed(1)} cm`).join(", ") },
        { name: "steady speed within 10 % of the Froude speed", passed: speedOk, detail: speeds.join("; ") },
      ],
    };
  });
  });
}

/** Every 0.2 s, and every heel strike and toe-off, labelled. */
function instants(performance: HumanPerformance, end: number): IMotionCaptureCase.ITime[] {
  const segment = performance.segments("w0")[0]!;
  const events: IMotionCaptureCase.ITime[] = segment.plan.events
    .filter((e) => /HeelStrike|ToeOff/.test(e.name))
    .map((e) => ({ seconds: segment.start + e.share * segment.plan.duration, label: e.name.replace(/^(left|right)/, (m: string): string => (m === "left" ? "L " : "R ")) }));
  const grid: IMotionCaptureCase.ITime[] = Array.from({ length: Math.floor(end / 0.2) + 1 }, (_, k: number) => ({ seconds: k * 0.2, label: `${(k * 0.2).toFixed(1)} s` }));
  return [...grid, ...events, { seconds: end, label: "end" }].sort((a, b): number => a.seconds - b.seconds);
}

/** A vector rotated by a unit quaternion. */
function rotate(q: { x: number; y: number; z: number; w: number }, v: IAutoMovieVector3): IAutoMovieVector3 {
  const ix: number = q.w * v.x + q.y * v.z - q.z * v.y;
  const iy: number = q.w * v.y + q.z * v.x - q.x * v.z;
  const iz: number = q.w * v.z + q.x * v.y - q.y * v.x;
  const iw: number = -q.x * v.x - q.y * v.y - q.z * v.z;
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  };
}
