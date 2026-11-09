import type { IAutoMovieResolvedBone } from "@automovie/engine";
import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
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
 * average and the tallest sweep bodies walk 4 m ahead side by side, one case
 * per pace (`walk-slow`, `walk-normal`, `walk-fast`).
 *
 * Instants are the start, eight even instants up to the last arrival and the
 * end. The overlays are each ankle's trail and a drift marker for every 24 Hz
 * sample of a planted foot, coloured against the 5 mm slip limit; each
 * walker's destination is marked. The verdicts are the ones a walk must
 * keep: no planted foot slides more than 5 mm from where it landed, no heel,
 * toe or sole sinks more than 5 mm under the floor, the walker stops within
 * 2 cm of the destination, and the mean speed lies within 20 % of the pace's
 * Froude speed `sqrt(Fr g l)` (starting and stopping steps included, so the
 * bound is loose).
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
  const names = ["f-small", "m-average", "m-tall"] as const;
  const men = names.map((name) => MotionBodies.population(name));
  const bodies: IHumanBody[] = men.map((man) => createHumanBody(man.body.skeleton, man.body.profile));
  return (["slow", "normal", "fast"] as const).map((pace): IMotionCaptureCase => {
    const lanes: number[] = names.map((_, i: number): number => (i - 1) * 0.9);
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
    let slip: number = 0;
    let sink: number = 0;
    const misses: number[] = [];
    const speeds: string[] = [];
    let speedOk: boolean = true;
    names.forEach((_, i: number): void => {
      const subject: string = `w${i}`;
      const body: IHumanBody = bodies[i]!;
      const segment = performance.segments(subject)[0]!;
      const stances = segment.plan.contacts.map((c) => ({
        part: c.part,
        from: segment.start + c.from * segment.plan.duration,
        to: segment.start + c.to * segment.plan.duration,
      }));
      const ankles: Record<"left" | "right", IAutoMovieVector3[]> = { left: [], right: [] };
      const landed: Map<number, IAutoMovieVector3> = new Map();
      for (let k: number = 0; k <= Math.ceil(end * 24); k++) {
        const t: number = Math.min(end, k / 24);
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = performance.bones(subject, t);
        for (const side of ["left", "right"] as const) {
          const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
          ankles[side].push(ankle);
          for (const socket of ["heel", "toe", "sole"] as const) {
            const frame = body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`];
            sink = Math.max(sink, -resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!).point.y);
          }
          stances.forEach((s, n: number): void => {
            if (s.part !== `${side}Foot` || t < s.from + 1e-9 || t > s.to - 1e-9) return;
            const first: IAutoMovieVector3 = landed.get(n) ?? ankle;
            landed.set(n, first);
            const d: number = Math.hypot(ankle.x - first.x, ankle.y - first.y, ankle.z - first.z);
            slip = Math.max(slip, d);
            drift.push({ at: ankle, drift: d });
          });
        }
      }
      trails.push({ color: 0x3070c0, points: ankles.left }, { color: 0xc07030, points: ankles.right });
      const hips: IAutoMovieVector3 = performance.bones(subject, segment.end).get("hips")!.worldPosition;
      misses.push(Math.hypot(hips.x - goals[i]!.x, hips.z - goals[i]!.z));
      const start: IAutoMovieVector3 = performance.bones(subject, 0).get("hips")!.worldPosition;
      const speed: number = Math.hypot(hips.x - start.x, hips.z - start.z) / (segment.end - segment.entryTime);
      const froude: number = Math.sqrt(walk.FROUDE[pace] * 9.81 * body.measure.hipHeight);
      speeds.push(`${names[i]} ${speed.toFixed(2)}/${froude.toFixed(2)} m/s`);
      if (Math.abs(speed / froude - 1) > 0.2) speedOk = false;
    });
    return {
      name: `walk-${pace}`,
      times: [
        { seconds: 0, label: "start" },
        ...Array.from({ length: 8 }, (_, k: number) => ({ seconds: ((k + 1) * end) / 9, label: `${(((k + 1) * end) / 9).toFixed(2)} s` })),
        { seconds: end, label: "end" },
      ],
      performers: names.map((_, i: number): IMotionCaptureCase.IPerformer => ({
        id: `w${i}`,
        body: men[i]!.body,
        pose: (seconds: number): IAutoMoviePose => performance.pose(`w${i}`, seconds),
      })),
      trails,
      drift: [{ samples: drift, limit: 0.005 }],
      targets: goals.map((at: IAutoMovieVector3) => ({ at, radius: 0.04, color: 0xd04040 })),
      verdicts: [
        { name: "planted feet stay within 5 mm", passed: slip <= 0.005, detail: `max slip ${(slip * 1000).toFixed(2)} mm` },
        { name: "feet stay above the floor within 5 mm", passed: sink <= 0.005, detail: `max sink ${(sink * 1000).toFixed(2)} mm` },
        { name: "stops within 2 cm of the destination", passed: Math.max(...misses) <= 0.02, detail: misses.map((m: number): string => `${(m * 100).toFixed(1)} cm`).join(", ") },
        { name: "mean speed within 20 % of the Froude speed", passed: speedOk, detail: speeds.join("; ") },
      ],
    };
  });
}
