import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { crawl } from "../../floor/crawl";
import type { lieDown } from "../../floor/lieDown";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the lying and crawling family (#3237), each from quiet
 * standing:
 *
 * - `floor-lie-supine`, `floor-lie-prone`, `floor-lie-lateralLeft`: lying
 *   down into the position; no range-of-motion overshoot, no collider below
 *   the floor by more than 10 mm at any frame, and at `settled` the trunk's
 *   colliders within -10 to +15 mm of the floor (the issue's supporting
 *   regions within 15 mm, penetration no worse than -10 mm).
 * - `floor-crawl`: three hands-and-knees cycles; no overshoot; each palm
 *   within -10 to +15 mm of the floor and sliding at most 5 mm through its
 *   plant windows; each shank's colliders within -10 to +15 mm of the floor
 *   at the middle of each knee stance; and the displayed lift-offs of the
 *   left hand and the right knee, and of the right hand and the left knee,
 *   within 10 % of a cycle of each other (the issue's diagonal pattern).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its verdicts with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Measures displayed colliders and sockets against the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two blocks over the shared kit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read displayed poses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function floorCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const TRUNK = (b: string): boolean =>
    b === "hips" || b === "spine" || b === "chest" || b === "upperChest";
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;

    for (const position of ["supine", "prone", "lateralLeft"] as const) {
      const params: lieDown.IParams = { position };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "floor",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("lieDown", params),
      );
      const settled: number = FamilyCaseKit.event(performance, "settled");
      let deepest: number = Infinity;
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
        deepest = Math.min(
          deepest,
          FamilyCaseKit.lowest(performance, who.body, "a", t, () => true),
        );
      out.push({
        name: `floor-lie-${position}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.3, [[settled, "settled"]]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts: [
          everydayVerdicts.within(
            "a ROM overshoot",
            everydayVerdicts.overshoot(performance, "a"),
            1e-6,
            "deg",
          ),
          everydayVerdicts.within(
            "deepest collider below the floor",
            Math.max(0, -deepest),
            0.01,
            "mm",
          ),
          FamilyCaseKit.band(
            "trunk on the floor at settled",
            FamilyCaseKit.lowest(performance, who.body, "a", settled, TRUNK),
            -0.01,
            0.015,
            "mm",
          ),
        ],
      });
    }

    {
      const params: crawl.IParams = { cycles: 3 };
      const performance: HumanPerformance = FamilyCaseKit.perform(
        "floor",
        [{ subject: "a", body: who.body }],
        HumanChain.subject("a").act("crawl", params),
      );
      const segment = performance.segments("a")[0]!;
      const at = (share: number): number =>
        segment.start + share * segment.plan.duration;
      const palm = (side: "left" | "right", t: number): IAutoMovieVector3 => {
        const frame =
          who.body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"];
        return resolveAutoMovieHumanoidSurfaces.place(
          frame,
          performance.bones("a", t).get(frame.bone)!,
        ).point;
      };
      let slip: { value: number; where: string } = { value: 0, where: "none" };
      const height: { low: number; high: number } = {
        low: Infinity,
        high: -Infinity,
      };
      for (const c of segment.plan.contacts) {
        if (c.part !== "leftHand" && c.part !== "rightHand") continue;
        const side: "left" | "right" = c.part === "leftHand" ? "left" : "right";
        const anchor: IAutoMovieVector3 = palm(side, at(c.from));
        for (let t: number = at(c.from); t <= at(c.to) + 1e-9; t += 1 / 24) {
          const p: IAutoMovieVector3 = palm(side, t);
          const drift: number = Math.hypot(p.x - anchor.x, p.z - anchor.z);
          if (drift > slip.value)
            slip = { value: drift, where: `${side} at ${t.toFixed(2)} s` };
          height.low = Math.min(height.low, p.y);
          height.high = Math.max(height.high, p.y);
        }
      }
      const knee: { low: number; high: number } = {
        low: Infinity,
        high: -Infinity,
      };
      for (const side of ["left", "right"] as const)
        for (let k: number = 1; k <= 3; k++) {
          const t: number =
            k === 3
              ? FamilyCaseKit.event(performance, `${side}KneeTouchdown${k}`) + 0.1
              : (FamilyCaseKit.event(performance, `${side}KneeTouchdown${k}`) +
                  FamilyCaseKit.event(
                    performance,
                    `${side}KneeLiftoff${k + 1}`,
                  )) /
                2;
          const low: number = FamilyCaseKit.lowest(
            performance,
            who.body,
            "a",
            t,
            (b) => b === `${side}LowerLeg`,
          );
          knee.low = Math.min(knee.low, low);
          knee.high = Math.max(knee.high, low);
        }

      // Displayed lift-offs: the first frame each limb rises 10 mm.
      const period: number =
        FamilyCaseKit.event(performance, "leftHandLiftoff3") -
        FamilyCaseKit.event(performance, "leftHandLiftoff2");
      const rises = (
        limb: "leftHand" | "rightHand" | "leftKnee" | "rightKnee",
        k: number,
      ): number => {
        const planned: number = FamilyCaseKit.event(
          performance,
          `${limb}Liftoff${k}`,
        );
        const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
        for (
          let t: number = planned - 0.25 * period;
          t <= planned + 0.25 * period;
          t += 1 / 120
        ) {
          const y: number = limb.endsWith("Hand")
            ? palm(side, t).y
            : FamilyCaseKit.lowest(
                performance,
                who.body,
                "a",
                t,
                (b) => b === `${side}LowerLeg`,
              );
          if (y > 0.01) return t;
        }
        return Infinity;
      };
      const lag: number = Math.max(
        Math.abs(rises("leftHand", 2) - rises("rightKnee", 2)),
        Math.abs(rises("rightHand", 2) - rises("leftKnee", 2)),
      );
      out.push({
        name: `floor-crawl${suffix}`,
        times: FamilyCaseKit.times(performance, 0.25, [
          [FamilyCaseKit.event(performance, "down"), "down"],
        ]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts: [
          everydayVerdicts.within(
            "a ROM overshoot",
            everydayVerdicts.overshoot(performance, "a"),
            1e-6,
            "deg",
          ),
          {
            name: "planted palm slip",
            passed: slip.value <= 0.005,
            detail: `${(slip.value * 1000).toFixed(1)} mm (limit 5.0 mm), worst ${slip.where}`,
          },
          span("planted palm height", height),
          span("knee on the floor mid-stance", knee),
          {
            name: "diagonal lift-offs within 10 % of a cycle",
            passed: lag <= 0.1 * period,
            detail: `${(lag / period * 100).toFixed(1)} % of ${period.toFixed(2)} s`,
          },
        ],
      });
    }
  }
  return out;
}

/** A verdict that a measured range of heights lies within -10 to +15 mm of the floor. */
function span(
  name: string,
  range: { low: number; high: number },
): IMotionCaptureCase.IVerdict {
  return {
    name,
    passed: range.low >= -0.01 && range.high <= 0.015,
    detail: `${(range.low * 1000).toFixed(1)} to ${(range.high * 1000).toFixed(1)} mm (band -10.0 to 15.0 mm)`,
  };
}
