
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieMotionHumanCrawl, IAutoMovieMotionHumanLieDown, IAutoMovieMotionHumanPerformance, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./internal/everydayVerdicts";
import { floorCaseSpan } from "./internal/floorCaseSpan";

/** The alternatives of `FloorCasesRisesLimb`'s site. */
type FloorCasesRisesLimb = "leftHand" | "rightHand" | "leftKnee" | "rightKnee";

/** The record of `IFloorCasesKnee`'s site. */
type IFloorCasesKnee = { low: number; high: number };

/** The record of `IFloorCasesHeight`'s site. */
type IFloorCasesHeight = { low: number; high: number };

/** The record of `IFloorCasesSlip`'s site. */
type IFloorCasesSlip = { value: number; where: string };

/**
 * Capture cases of the lying and crawling family, each from quiet standing:
 *
 * - `floor-lie-supine`, `floor-lie-prone`, `floor-lie-lateralLeft`: lying down
 *   into the position; no range-of-motion overshoot, no collider below the
 *   floor by more than 10 mm at any frame, and at `settled` the trunk's
 *   colliders within -10 to +15 mm of the floor (the issue's supporting regions
 *   within 15 mm, penetration no worse than -10 mm).
 * - `floor-crawl`: three hands-and-knees cycles; no overshoot; each palm within
 *   -10 to +15 mm of the floor and sliding at most 5 mm through its plant
 *   windows; each shank's colliders within -10 to +15 mm of the floor at the
 *   middle of each knee stance; and the displayed lift-offs of the left hand
 *   and the right knee, and of the right hand and the left knee, within 10 % of
 *   a cycle of each other (the issue's diagonal pattern).
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
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
      const params: IAutoMovieMotionHumanLieDown.IParams = { kind: position };
      const performance: IAutoMovieMotionHumanPerformance =
        FamilyCaseKit.perform(
          "floor",
          [{ subject: "a", body: who.body }],
          HumanChain.subject("a").act("lieDown", params).node,
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
      const params: IAutoMovieMotionHumanCrawl.IParams = { count: 3 };
      const performance: IAutoMovieMotionHumanPerformance =
        FamilyCaseKit.perform(
          "floor",
          [{ subject: "a", body: who.body }],
          HumanChain.subject("a").act("crawl", params).node,
        );
      const segment = performance.segments("a")[0]!;
      const at = (share: number): number =>
        segment.start + share * segment.plan.duration;
      const palm = (side: AutoMovieHumanSide, t: number): IAutoMovieVector3 => {
        const frame =
          who.body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"];
        return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          frame,
          performance.bones("a", t).get(frame.bone)!,
        ).point;
      };
      let slip: IFloorCasesSlip = { value: 0, where: "none" };
      const height: IFloorCasesHeight = {
        low: Infinity,
        high: -Infinity,
      };
      for (const c of segment.plan.contacts) {
        if (c.part !== "leftHand" && c.part !== "rightHand") continue;
        const side: AutoMovieHumanSide =
          c.part === "leftHand" ? "left" : "right";
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
      const knee: IFloorCasesKnee = {
        low: Infinity,
        high: -Infinity,
      };
      for (const side of ["left", "right"] as const)
        for (let k: number = 1; k <= 3; k++) {
          const t: number =
            k === 3
              ? FamilyCaseKit.event(performance, `${side}KneeTouchdown${k}`) +
                0.1
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
      const rises = (limb: FloorCasesRisesLimb, k: number): number => {
        const planned: number = FamilyCaseKit.event(
          performance,
          `${limb}Liftoff${k}`,
        );
        const side: AutoMovieHumanSide = limb.startsWith("left")
          ? "left"
          : "right";
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
          floorCaseSpan("planted palm height", height),
          floorCaseSpan("knee on the floor mid-stance", knee),
          {
            name: "diagonal lift-offs within 10 % of a cycle",
            passed: lag <= 0.1 * period,
            detail: `${((lag / period) * 100).toFixed(1)} % of ${period.toFixed(2)} s`,
          },
        ],
      });
    }
  }
  return out;
}
