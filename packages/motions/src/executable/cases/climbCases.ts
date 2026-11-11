import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { climbLadder } from "../../climbing/climbLadder";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the climbing family (#3238): `climb-ladder`, three rungs
 * of a fixed ladder with 0.3 m spacing (OSHA 1910.23) in the four-beat
 * pattern, from quiet standing before it.
 *
 * It reports foot slip at most 5 mm in the plant windows and no
 * range-of-motion overshoot; each gripping hand's grip socket within 10 mm
 * of its rung's axis through its grip windows (the issue's hand-on-rung
 * bound); and, from `handsOn` on, at least three limbs on the ladder at
 * every frame (Jensen and Holland 2020's three points of control), a hand
 * counting within 15 mm of a rung's axis and a foot with a sole socket within
 * 15 mm of a rung's top or the floor.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the case and its verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed sockets against the ladder the plan resolved.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function climbCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const params: climbLadder.IParams = { rungs: 3 };
    const performance: HumanPerformance = FamilyCaseKit.perform(
      "climb",
      [{ subject: "a", body: who.body }],
      HumanChain.subject("a").act("climbLadder", params),
    );
    const segment = performance.segments("a")[0]!;
    const ladder: climbLadder.ILadder = (segment.plan as climbLadder.IPlan)
      .ladder;
    const local = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.local(ladder.frame, p);

    // Distance of a point to the nearest rung's axis, and height over its top.
    const toRung = (p: IAutoMovieVector3): number => {
      const q: IAutoMovieVector3 = local(p);
      const i: number = Math.max(1, Math.round(q.y / ladder.spacing));
      return Math.hypot(q.y - i * ladder.spacing, q.z - ladder.ahead);
    };
    const onTop = (p: IAutoMovieVector3): number => {
      const q: IAutoMovieVector3 = local(p);
      if (Math.abs(q.z - ladder.ahead) > 0.05) return Math.abs(q.y);
      const i: number = Math.round(q.y / ladder.spacing);
      return Math.abs(q.y - (i * ladder.spacing + climbLadder.RUNG));
    };
    const grip = (side: "left" | "right", t: number): IAutoMovieVector3 => {
      const frame =
        who.body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
      return resolveAutoMovieHumanoidSurfaces.place(
        frame,
        performance.bones("a", t).get(frame.bone)!,
      ).point;
    };
    const at = (share: number): number =>
      segment.start + share * segment.plan.duration;

    let held: { value: number; where: string } = { value: 0, where: "none" };
    for (const c of segment.plan.contacts) {
      if (c.kind !== "grip") continue;
      const side: "left" | "right" = c.part === "leftHand" ? "left" : "right";
      for (let t: number = at(c.from); t <= at(c.to) + 1e-9; t += 1 / 24) {
        const d: number = toRung(grip(side, t));
        if (d > held.value)
          held = { value: d, where: `${side} at ${t.toFixed(2)} s` };
      }
    }
    let fewest: { value: number; at: number } = { value: 4, at: 0 };
    const handsOn: number = FamilyCaseKit.event(performance, "handsOn");
    for (let t: number = handsOn; t <= performance.duration + 1e-9; t += 1 / 24) {
      const bones = performance.bones("a", t);
      let count: number = 0;
      for (const side of ["left", "right"] as const) {
        if (toRung(grip(side, t)) <= 0.015) count++;
        if (
          HumanFoot.sockets(who.body, bones, side).some(
            (s) => onTop(s.point) <= 0.015,
          )
        )
          count++;
      }
      if (count < fewest.value) fewest = { value: count, at: t };
    }

    const boxes: NonNullable<IMotionCaptureCase["boxes"]> = [];
    for (let i: number = 1; i <= 3 + 6; i++)
      boxes.push({
        centre: climbLadder.rung(ladder, i, 0),
        half: { x: 0.22, y: climbLadder.RUNG, z: climbLadder.RUNG },
        color: 0x9aa4b0,
      });
    out.push({
      name: `climb-ladder${suffix}`,
      times: FamilyCaseKit.times(performance, 0.4, [[handsOn, "handsOn"]]),
      performers: [FamilyCaseKit.figure(performance, who.man)],
      boxes,
      verdicts: [
        ...everydayVerdicts.standard(performance, "a", who.body),
        everydayVerdicts.within("gripping hand on its rung", held.value, 0.01, "mm"),
        {
          name: "three limbs on the ladder at every frame",
          passed: fewest.value >= 3,
          detail: `${fewest.value} limbs at ${fewest.at.toFixed(2)} s`,
        },
      ],
    });
  }
  return out;
}
