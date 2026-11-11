import {
  type AutoMovieComposition,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { AutoMovieHumanoidSocket } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { clinch } from "../../grappling/clinch";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the grappling family (#3242): performer `a` takes a
 * clinch grip on performer `b`, who stands 0.55 m away facing it, in the
 * plum (`grapple-plum`) and in the collar and sleeve grip
 * (`grapple-collarSleeve`).
 *
 * Every case reports each performer's foot slip at most 5 mm and no
 * range-of-motion overshoot, and that through every grip window each of
 * `a`'s gripping surfaces (the palm in the plum, the grip otherwise) stays
 * within 10 mm of its place on `b`'s displayed region (the issue's M11 grip
 * bound).
 *
 * @param bodies The sweep bodies, each gripping itself; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed sockets against the partner's displayed regions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over two grips over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function grappleCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const grip of ["plum", "collarSleeve"] as const) {
      const composition: AutoMovieComposition = {
        kind: "parallel",
        parts: [
          HumanChain.subject("a").act("clinch", { partner: "b", grip }).node,
          HumanChain.subject("b").act("stand", { seconds: 4 }).node,
        ],
      };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "grapple",
        [
          { subject: "a", body: who.body },
          {
            subject: "b",
            body: who.body,
            at: { x: 0, y: 0, z: 0.55 },
            yaw: 180,
          },
        ],
        composition,
      );
      const segment = performance.segments("a")[0]!;
      const table = clinch.regions(grip, "right");
      let worst: { value: number; where: string } = { value: 0, where: "none" };
      for (const c of segment.plan.contacts) {
        if (c.kind !== "grip") continue;
        const side: "left" | "right" = c.part === "leftHand" ? "left" : "right";
        const name: AutoMovieHumanoidSocket =
          grip === "plum"
            ? side === "left"
              ? "palmLeft"
              : "palmRight"
            : side === "left"
              ? "gripLeft"
              : "gripRight";
        const from: number = segment.start + c.from * segment.plan.duration;
        const to: number = segment.start + c.to * segment.plan.duration;
        for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
          const frame = who.body.surfaces.sockets[name];
          const hand = resolveAutoMovieHumanoidSurfaces.place(
            frame,
            performance.bones("a", t).get(frame.bone)!,
          ).point;
          const want = clinch.place(
            who.body,
            performance.bones("b", t),
            table[side].region,
            table[side].across,
          ).point;
          const gap: number = Vector3.length(Vector3.subtract(hand, want));
          if (gap > worst.value)
            worst = { value: gap, where: `${side} at ${t.toFixed(2)} s` };
        }
      }
      out.push({
        name: `grapple-${grip}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.25, [
          [FamilyCaseKit.event(performance, "ready"), "grip"],
        ]),
        performers: [
          FamilyCaseKit.figure(performance, who.man, "a"),
          FamilyCaseKit.figure(performance, who.man, "b"),
        ],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          ...everydayVerdicts.standard(performance, "b", who.body),
          {
            name: "grip held on the partner's region within 10 mm",
            passed: worst.value <= 0.01,
            detail: `${(worst.value * 1000).toFixed(1)} mm, worst ${worst.where}`,
          },
        ],
      });
    }
  }
  return out;
}
