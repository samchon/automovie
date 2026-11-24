import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanShiftStandingWeight,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose, qclose, vclose } from "../../../features/internal/predicates";

/**
 * A standing performer shifts the pelvis sideways with both feet fixed.
 *
 * Scenarios:
 * 1. The average man and small woman each shift 20 mm left and right at
 *    a 37 degree heading. The intermediate point lies between entry and
 *    target. During the hold the pelvis is shifted by exactly the request.
 * 2. Both shifts keep each displayed foot fixed throughout the witnesses.
 *    The left shift returns. The right shift finishes held.
 * 3. A one-metre request on the same body is refused on the distance axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, two bodies, and the successful and refused scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed upper-leg centers and foot transforms through the performance API.
 * @evidence contracts/development/testing.md#independent-expectations The author supplies the exact signed lateral distance. The foot transforms come from the displayed entry and the intermediate witnesses do not depend on the law's fit grid.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite sides and timings distinguish hold and return; a one-metre request distinguishes refusal from arbitrary root movement.
 * @evidence contracts/development/testing.md#execution-ownership Builds short performances of two polygon men in memory.
 */
export function test_motion_stance_shift_standing_weight(): void {
  const yaw: number = 37;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const perform = (
      params: IAutoMovieMotionHumanShiftStandingWeight,
    ): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "planted-shift",
        performers: [
          {
            subject: "actor",
            body,
            at: { x: 1, y: 0, z: -1 },
            yaw,
            proficiency: { level: "trained" },
          },
        ],
        laws: [AutoMovieMotionHumanStance.shiftStandingWeight],
        composition: HumanChain.subject("actor")
          .stand({ hold: 0.6, sway: 0 })
          .registered("shiftStandingWeight", params).node,
      });

    for (const by of [-0.02, 0.02] as const) {
      const returns: boolean = by > 0;
      const performance: IAutoMovieMotionHumanPerformance = perform({
        by,
        duration: 0.8,
        hold: 0.3,
        ...(returns ? { returnSeconds: 0.6 } : {}),
      });
      const shift: IAutoMovieMotionHumanSegment =
        performance.segments("actor")[1]!;
      const start: number = shift.start;
      const centre = (
        bones: ReturnType<typeof performance.bones>,
      ): IAutoMovieVector3 => {
        const left: IAutoMovieVector3 =
          bones.get("leftUpperLeg")!.worldPosition;
        const right: IAutoMovieVector3 =
          bones.get("rightUpperLeg")!.worldPosition;
        return {
          x: (left.x + right.x) / 2,
          y: (left.y + right.y) / 2,
          z: (left.z + right.z) / 2,
        };
      };
      const initial: ReturnType<typeof performance.bones> = performance.bones(
        "actor",
        start,
      );
      const heldAt: number = start + 0.95;
      const heldBones: ReturnType<typeof performance.bones> = performance.bones(
        "actor",
        heldAt,
      );
      const finalBones: ReturnType<typeof performance.bones> =
        performance.bones("actor", shift.end);
      const frame: IAutoMovieMotionHumanFrame = {
        origin: centre(initial),
        yaw,
      };
      const halfway: IAutoMovieVector3 = HumanFrame.local(
        frame,
        centre(performance.bones("actor", start + 0.4)),
      );
      const held: IAutoMovieVector3 = HumanFrame.local(
        frame,
        centre(heldBones),
      );
      const final: IAutoMovieVector3 = HumanFrame.local(
        frame,
        centre(finalBones),
      );
      TestValidator.predicate(
        name + " signed shift with stationary height and heading",
        halfway.x / by > 0.1 &&
          halfway.x / by < 0.9 &&
          vclose(held, { x: by, y: 0, z: 0 }, 0.001) &&
          vclose(final, { x: returns ? 0 : by, y: 0, z: 0 }, 0.001),
      );

      for (const [time, bones] of [
        [start + 0.19, performance.bones("actor", start + 0.19)],
        [start + 0.73, performance.bones("actor", start + 0.73)],
        [heldAt, heldBones],
        [shift.end, finalBones],
      ] as const) {
        for (const foot of ["leftFoot", "rightFoot"] as const) {
          const a: IAutoMovieResolvedBone = initial.get(foot)!;
          const b: IAutoMovieResolvedBone = bones.get(foot)!;
          TestValidator.predicate(
            name + " fixes " + foot + " at " + time,
            vclose(b.worldPosition, a.worldPosition, 0.004) &&
              qclose(b.worldRotation, a.worldRotation, 0.00002),
          );
        }
      }
      const eventTime = (name: string): number | undefined => {
        const event: IAutoMovieMotionEvent | undefined = shift.plan.events.find(
          (candidate: IAutoMovieMotionEvent): boolean =>
            candidate.name === name,
        );
        return event === undefined
          ? undefined
          : event.share * shift.plan.duration;
      };
      const shifted: number | undefined = eventTime("shifted");
      const release: number | undefined = eventTime("release");
      const returned: number | undefined = eventTime("returned");
      TestValidator.predicate(
        name + " declares the authored phase boundaries",
        shifted !== undefined &&
          nclose(shifted, 0.8) &&
          (returns
            ? release !== undefined &&
              returned !== undefined &&
              nclose(release, 1.1) &&
              nclose(returned, 1.7)
            : release === undefined && returned === undefined),
      );
    }

    let refused: unknown;
    try {
      perform({ by: 1 });
    } catch (error) {
      refused = error;
    }
    TestValidator.predicate(
      name + " refuses a shift outside the fixed-foot stance",
      refused instanceof HumanRefusal && refused.axis === "by",
    );
  }
}
