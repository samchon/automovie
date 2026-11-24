import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A registered curtsy crosses behind its supporting foot, dips on both
 * grounded feet and returns to an uncrossed standing stance.
 *
 * Scenarios:
 * 1. Either crossing side places its rear sole behind the lead sole.
 *    The planted ankles stay put across the dip, the displayed soles stay
 *    at floor height, and the pelvis lowers and rises.
 * 2. The swing foot lifts off the floor and recovers to its entry footprint.
 * 3. Zero depth and an interruption in the dip are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the registered gesture, its phases and parameter refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the registered law and checks displayed hips, ankles and sole sockets at action events and mid-swing.
 * @evidence contracts/development/testing.md#independent-expectations Rearward placement and knee bending follow the taught curtsy. The positive separation and depth thresholds exceed the plant measurement tolerance without reproducing production constants.
 * @evidence contracts/development/testing.md#distinguishing-cases Both handed variants at different headings, swing and double plant, recovery and the excluded zero-depth boundary.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable motion feature test uses the public performance and resident average-sized bodies.
 */
export function test_motion_stance_curtsy(): void {
  const Chain: IAutoMovieMotionHumanChain.IExtension<{
    curtsy: typeof AutoMovieMotionHumanStance.curtsy;
  }> = HumanChain.extend({ curtsy: AutoMovieMotionHumanStance.curtsy });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  for (const side of ["left", "right"] as const) {
    const yaw: number = side === "left" ? 0 : 35;
    const perform = (
      depth?: number,
      cut?: "dip",
    ): IAutoMovieMotionHumanPerformance => {
      const chain = Chain.subject("a")
        .stand({ hold: 0.6, sway: 0 })
        .curtsy(depth === undefined ? { side } : { side, depth });
      return new HumanPerformance({
        seed: "curtsy",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw,
            proficiency: { level: "trained" },
          },
        ],
        laws: [AutoMovieMotionHumanStance.curtsy],
        composition: (cut === undefined
          ? chain
          : chain.until({ event: cut }).stand()
        ).node,
      });
    };
    const performance: IAutoMovieMotionHumanPerformance = perform();
    const segment: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const at = (name: string): number =>
      segment.start +
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share *
        segment.plan.duration;
    const lead: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const ankle = (
      foot: AutoMovieHumanSide,
      second: number,
    ): IAutoMovieVector3 =>
      performance.bones("a", second).get(`${foot}Foot`)!.worldPosition;
    const hips = (second: number): number =>
      performance.bones("a", second).get("hips")!.worldPosition.y;
    const sockets = (
      foot: AutoMovieHumanSide,
      second: number,
    ): IAutoMovieMotionHumanFoot.ISocket[] =>
      HumanFoot.sockets(body, performance.bones("a", second), foot);
    const sole = (foot: AutoMovieHumanSide, second: number): number[] =>
      sockets(foot, second).map(
        (socket: IAutoMovieMotionHumanFoot.ISocket): number => socket.point.y,
      );
    const crossed: number = at("crossed");
    const dip: number = at("dip");
    const raised: number = at("uncrossOff");
    const returned: number = at("returned");
    const entry: number = segment.start;
    const difference: IAutoMovieVector3 = Vector3.subtract(
      ankle(side, crossed),
      ankle(lead, crossed),
    );
    const rad: number = (yaw * Math.PI) / 180;
    const across: number =
      difference.x * Math.cos(rad) - difference.z * Math.sin(rad);
    const along = (foot: AutoMovieHumanSide): number[] =>
      sockets(foot, crossed).map(
        ({ point }): number =>
          point.x * Math.sin(rad) + point.z * Math.cos(rad),
      );
    const floor: number = Math.min(...sole(lead, entry));
    const knee = (second: number): number =>
      Math.abs(
        performance
          .pose("a", second)
          .joints.find((joint): boolean => joint.bone === `${lead}LowerLeg`)
          ?.flexion ?? 0,
      );

    TestValidator.predicate(
      `${side}: rear ankle crosses the lead ankle and the soles stay separated`,
      across * (side === "right" ? 1 : -1) > 0.015 &&
        Math.min(...along(lead)) - Math.max(...along(side)) > 0.01,
    );
    TestValidator.predicate(
      `${side}: pelvis dips and rises between plants`,
      hips(crossed) - hips(dip) > 0.02 &&
        hips(raised) - hips(dip) > 0.02 &&
        knee(dip) > knee(crossed),
    );
    for (const foot of [lead, side]) {
      TestValidator.predicate(
        `${foot}: ankle and sole sockets hold their stance through the dip`,
        [dip, raised].every(
          (second: number): boolean =>
            Vector3.length(
              Vector3.subtract(ankle(foot, second), ankle(foot, crossed)),
            ) < 0.01 &&
            sockets(foot, second).every(
              (socket, index): boolean =>
                Vector3.length(
                  Vector3.subtract(
                    socket.point,
                    sockets(foot, crossed)[index]!.point,
                  ),
                ) < 0.01,
            ),
        ),
      );
      TestValidator.predicate(
        `${foot}: sole stays on the floor through the dip`,
        [crossed, dip, raised].every((second: number): boolean =>
          sole(foot, second).every(
            (height: number): boolean => Math.abs(height - floor) < 0.01,
          ),
        ),
      );
      TestValidator.predicate(
        `${foot}: recovers its entry plant`,
        Vector3.length(
          Vector3.subtract(ankle(foot, returned), ankle(foot, entry)),
        ) < 0.01,
      );
    }
    const midSwing: number = (at("stepOff") + crossed) / 2;
    TestValidator.predicate(
      `${side}: clears floor while crossing`,
      Math.min(...sole(side, midSwing)) - floor > 0.015,
    );
    if (side === "right") {
      let refused: unknown;
      try {
        perform(0);
      } catch (error) {
        refused = error;
      }
      TestValidator.predicate(
        "zero depth is refused on the depth axis",
        refused instanceof HumanRefusal &&
          refused.kind === "parameter" &&
          refused.axis === "depth",
      );
      refused = undefined;
      try {
        perform(undefined, "dip");
      } catch (error: unknown) {
        refused = error;
      }
      TestValidator.predicate(
        "the curtsy refuses an interruption in the dip",
        refused instanceof HumanRefusal && refused.kind === "cut",
      );
    }
  }
}
