import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidSocket,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { carry } from "../../carrying/carry";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the load-carriage family (#3258): a 2.5 m walk ahead
 * carrying a load of 15 % of the body's mass in each way: `carry-oneHand`
 * (right hand), `carry-twoHands`, `carry-hip` (left hip) and `carry-push`.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion
 * overshoot, and that each step is at most 0.45 of the stature (the
 * handoff's carry verdict; Grieve and Gear 1966). Beyond that:
 *
 * - the trunk leans the way the load asks: the chest's offset from the
 *   hips, averaged over the walk's second stride so the gait's own sway
 *   cancels, against its offset at the start, moves away
 *   from a one-hand or hip load, back behind a front box and forward over a
 *   pushed handle;
 * - for the two-handed holds, the distance between the two hands' surfaces
 *   varies by at most 1 mm once the hold is taken (a rigid load, the issue's
 *   object-within-1-mm bound), and each surface stays within 10 mm of its
 *   hold place.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed bones and sockets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over four ways of carrying over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function carryCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const how of ["oneHand", "twoHands", "hip", "push"] as const) {
      const loaded: "left" | "right" = how === "hip" ? "left" : "right";
      const params: carry.IParams = {
        to: { x: 0, y: 0, z: 2.5 },
        how,
        side: loaded,
        load: 0.15,
      };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "carry",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("carry", params),
      );
      const segment = performance.segments("a")[0]!;
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", who.body),
      ];

      // Step lengths between successive plants of alternate feet.
      const plants = segment.plan.contacts
        .filter((c) => c.kind === "plant")
        .map((c) => {
          const t: number =
            segment.start + ((c.from + c.to) / 2) * segment.plan.duration;
          return {
            part: c.part,
            from: c.from,
            z: performance
              .bones("a", t)
              .get(c.part === "leftFoot" ? "leftFoot" : "rightFoot")!
              .worldPosition.z,
          };
        })
        .sort((a, b) => a.from - b.from);
      let longest: number = 0;
      for (let i: number = 1; i < plants.length; i++)
        if (plants[i]!.part !== plants[i - 1]!.part)
          longest = Math.max(
            longest,
            Math.abs(plants[i]!.z - plants[i - 1]!.z),
          );
      verdicts.push(
        everydayVerdicts.within(
          "step length at most 0.45 of the stature",
          longest,
          0.45 * who.body.measure.stature,
          "mm",
        ),
      );

      // The trunk's lean against the start.
      const chest = (t: number): IAutoMovieVector3 => {
        const bones = performance.bones("a", t);
        return Vector3.subtract(
          bones.get("upperChest")?.worldPosition ??
            bones.get("chest")!.worldPosition,
          bones.get("hips")!.worldPosition,
        );
      };
      // The walk sways the chest over the hips once a stride, so the lean is
      // the offset's mean over the walk's second stride.
      const stride: [number, number] = ["rightToeOff2", "rightToeOff3"].map(
        (name: string): number =>
          segment.start +
          segment.plan.events.find((e) => e.name === name)!.share *
            segment.plan.duration,
      ) as [number, number];
      const SAMPLES: number = 48;
      let mean: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (let i: number = 0; i < SAMPLES; i++)
        mean = Vector3.add(
          mean,
          Vector3.scale(
            chest(stride[0] + ((i + 0.5) / SAMPLES) * (stride[1] - stride[0])),
            1 / SAMPLES,
          ),
        );
      const shift: IAutoMovieVector3 = Vector3.subtract(mean, chest(0));
      const lean: number =
        how === "oneHand" || how === "hip"
          ? (loaded === "left" ? -1 : 1) * shift.x
          : how === "twoHands"
            ? -shift.z
            : shift.z;
      verdicts.push({
        name: "trunk leans the way the load asks",
        passed: lean > 0,
        detail: `${(lean * 1000).toFixed(1)} mm the asked way over the walk's second stride`,
      });

      // A rigid two-handed load.
      if (how === "twoHands" || how === "push") {
        const name = (side: "left" | "right"): AutoMovieHumanoidSocket =>
          how === "push"
            ? side === "left"
              ? "gripLeft"
              : "gripRight"
            : side === "left"
              ? "palmLeft"
              : "palmRight";
        const surface = (
          side: "left" | "right",
          t: number,
        ): IAutoMovieVector3 => {
          const frame = who.body.surfaces.sockets[name(side)];
          return resolveAutoMovieHumanoidSurfaces.place(
            frame,
            performance.bones("a", t).get(frame.bone)!,
          ).point;
        };
        let low: number = Infinity;
        let high: number = -Infinity;
        let off: number = 0;
        for (
          let t: number = carry.RAMP;
          t <= performance.duration + 1e-9;
          t += 1 / 24
        ) {
          const d: number = Vector3.length(
            Vector3.subtract(surface("left", t), surface("right", t)),
          );
          low = Math.min(low, d);
          high = Math.max(high, d);
          const posture = segment.plan.posture(t - segment.start);
          for (const side of ["left", "right"] as const)
            off = Math.max(
              off,
              Vector3.length(
                Vector3.subtract(
                  surface(side, t),
                  carry.place(who.body, posture, how, side, loaded)!.point,
                ),
              ),
            );
        }
        verdicts.push(
          everydayVerdicts.within(
            "hands keep the load's width",
            high - low,
            0.001,
            "mm",
          ),
          everydayVerdicts.within(
            "hands on their hold places",
            off,
            0.01,
            "mm",
          ),
        );
      }

      out.push({
        name: `carry-${how}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.25, []),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts,
      });
    }
  }
  return out;
}
