import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { useTool } from "../../tasks/useTool";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the cyclic tool-use family (#3255), four cycles each with
 * the right hand from quiet standing: `tool-hammer` on a nail at bench
 * height, `tool-saw` over a cut line at bench height, `tool-stir` in a pot on
 * a counter, `tool-screwdriver` on a screw in a wall at chest height.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot,
 * and that at every `contact<n>` the tool's working point, read from the
 * displayed grip socket and hand through the tool's offset in the hand,
 * lies within 10 mm of the work point (the issue's tip-meets-work bound, at
 * decision 11's declared accuracy).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and verdicts with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation The working point is the displayed hand carrying the plan's rigid tool.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over four tools over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function toolCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const tools: [useTool.Kind, IAutoMovieVector3][] = [
      ["hammer", { x: -0.2, y: 0.85, z: 0.5 }],
      ["saw", { x: -0.2, y: 0.85, z: 0.5 }],
      ["stir", { x: -0.15, y: 0.95, z: 0.4 }],
      ["screwdriver", { x: -0.2, y: 1.15, z: 0.55 }],
    ];
    for (const [tool, at] of tools) {
      const params: useTool.IParams = {
        tool,
        on: { kind: "point", at, frame: "world" },
      };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "tool",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("useTool", params),
      );
      const plan = performance.segments("a")[0]!.plan as useTool.IPlan;
      const tip = (t: number): IAutoMovieVector3 => {
        const bones = performance.bones("a", t);
        const frame = who.body.surfaces.sockets.gripRight;
        const grip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          frame,
          bones.get(frame.bone)!,
        ).point;
        return Vector3.add(
          grip,
          Quaternion.rotateVector(
            bones.get("rightHand")!.worldRotation,
            plan.tool.offset,
          ),
        );
      };
      let worst: { value: number; where: string } = { value: 0, where: "none" };
      for (let k: number = 1; k <= 4; k++) {
        const t: number = FamilyCaseKit.event(performance, `contact${k}`);
        const gap: number = Vector3.length(Vector3.subtract(tip(t), at));
        if (gap > worst.value)
          worst = { value: gap, where: `contact${k} at ${t.toFixed(2)} s` };
      }
      const trail: IAutoMovieVector3[] = [];
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
        trail.push(tip(t));
      out.push({
        name: `tool-${tool}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.15, [
          [FamilyCaseKit.event(performance, "contact1"), "contact1"],
        ]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        trails: [{ color: 0xd08020, points: trail }],
        targets: [{ at, radius: 0.015, color: 0xd04040 }],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          {
            name: "working point on the work at every contact",
            passed: worst.value <= 0.01,
            detail: `${(worst.value * 1000).toFixed(1)} mm (limit 10.0 mm), worst ${worst.where}`,
          },
        ],
      });
    }
  }
  return out;
}
