import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { dress } from "../../dressing/dress";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanHand } from "../../posture/HumanHand";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the dressing family (#3257), from quiet standing:
 * `dress-hat` (both palms on the head's surface at the brim's front quarters)
 * and `dress-glasses` (both index fingertips at the ears).
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion
 * overshoot. Beyond that: at `stroke` each hand's surface within 15 mm of
 * its place on the displayed head; no hand surface inside the head or neck
 * colliders by more than 10 mm through the action (decision 11's
 * penetration bound); and each upper arm's displayed elevation, its angle
 * from the chest's downward axis, at most 121 degrees, the smaller of the
 * functional ranges of daily tasks (flexion 121, abduction 128, Namdari et
 * al. 2012, the issue's ADL ranges). The elevation is read on the displayed
 * bones, since a joint's clinical flexion and abduction channels alias each
 * other once the arm is raised past the horizontal and turned.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed surfaces against the displayed head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over two items over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function dressCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const r: number = who.body.measure.headRadius;
    for (const item of ["hat", "glasses"] as const) {
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "dress",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("dress", { item }),
      );
      const stroke: number = FamilyCaseKit.event(performance, "stroke");
      const surface = (
        bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        side: "left" | "right",
      ): IAutoMovieVector3 =>
        item === "hat"
          ? resolveAutoMovieHumanoidSurfaces.place(
              who.body.surfaces.sockets[
                side === "left" ? "palmLeft" : "palmRight"
              ],
              bones.get(`${side}Hand`)!,
            ).point
          : HumanHand.frame(who.body, bones, side, "indexTip", "point").point;
      const want = (
        bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        side: "left" | "right",
      ): IAutoMovieVector3 => {
        const region =
          item === "hat" ? "crown" : side === "left" ? "earLeft" : "earRight";
        const frame = who.body.surfaces.regions[region];
        const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          frame,
          bones.get(frame.bone)!,
        ).point;
        if (item !== "hat") return at;
        // The head's displayed surface along the brim's direction.
        const direction: IAutoMovieVector3 = Vector3.normalize({
          x: (side === "left" ? 1 : -1) * dress.HAT.out,
          y: 0,
          z: dress.HAT.ahead,
        });
        return HumanColliders.cast(
          who.body,
          new Map([...bones].filter(([b]) => b === "head" || b === "neck")),
          Vector3.add(
            { ...at, y: at.y - dress.HAT.down * r },
            Vector3.scale(direction, 4 * r),
          ),
          Vector3.scale(direction, -1),
          8 * r,
        )!.point;
      };
      const bones = performance.bones("a", stroke);
      const placed: number = Math.max(
        ...(["left", "right"] as const).map((side) =>
          Vector3.length(
            Vector3.subtract(surface(bones, side), want(bones, side)),
          ),
        ),
      );
      let inside: number = Infinity;
      let elevation: number = 0;
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24) {
        const all = performance.bones("a", t);
        const head: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          new Map([...all].filter(([b]) => b === "head" || b === "neck"));
        for (const side of ["left", "right"] as const) {
          inside = Math.min(
            inside,
            HumanColliders.distance(who.body, head, surface(all, side))
              .distance,
          );
          const along: IAutoMovieVector3 = Vector3.normalize(
            Vector3.subtract(
              all.get(`${side}LowerArm`)!.worldPosition,
              all.get(`${side}UpperArm`)!.worldPosition,
            ),
          );
          const down: IAutoMovieVector3 = Quaternion.rotateVector(
            all.get("chest")!.worldRotation,
            { x: 0, y: -1, z: 0 },
          );
          elevation = Math.max(
            elevation,
            (Math.acos(Math.min(1, Math.max(-1, Vector3.dot(along, down)))) *
              180) /
              Math.PI,
          );
        }
      }
      out.push({
        name: `dress-${item}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.15, [[stroke, "on"]]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          everydayVerdicts.within(
            "hands on the item's places",
            placed,
            0.015,
            "mm",
          ),
          everydayVerdicts.within(
            "hand inside the head or neck",
            Math.max(0, -inside),
            0.01,
            "mm",
          ),
          everydayVerdicts.within(
            "shoulder elevation within daily range",
            elevation,
            121,
            "deg",
          ),
        ],
      });
    }
  }
  return out;
}
