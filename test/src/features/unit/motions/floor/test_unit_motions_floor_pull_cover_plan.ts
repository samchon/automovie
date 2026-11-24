import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  HumanRefusal,
  lieDown,
  pullCover,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** How far out along its normal a site of the cover's way stands, metres. */
const OVER: number = 0.05;

/**
 * How near a hand's grip comes to its site, metres: the touch contract's 10 mm
 * disc and half the cover lattice's 8 cm spacing, the particle the grip binds.
 */
const REACH: number = 0.01 + 0.04;

/**
 * `pullCover`'s plan draws a cover laid over the lying legs up to the chest
 * with both hands, or pushes it back down: each hand runs its own side's way
 * from the thigh's front to the chest, `OVER` out along the surface.
 *
 * Scenarios, on both stored bodies lying on the back:
 *
 * 1. Pulling, each grip is at its thigh site at `ready` and at its chest site at
 *    `strokeEnd`.
 * 2. Pushing, the way runs back: chest at `ready`, thigh at `strokeEnd`.
 * 3. A pull while standing is refused on its base.
 */
export async function test_unit_motions_floor_pull_cover_plan(): Promise<void> {
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const lying: IAutoMovieMotionHumanActionPlan = lieDown.plan(
      motionActionContext(body, { kind: "supine", hold: 0.5 }),
    );
    const site = (
      bones: ReturnType<typeof R.bones>,
      region: AutoMovieHumanoidRegion,
    ): IAutoMovieVector3 => {
      const frame: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[region];
      const bone: IAutoMovieResolvedBone = bones.get(frame.bone)!;
      return Vector3.add(
        Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(bone.worldRotation, frame.point),
        ),
        Vector3.scale(
          Quaternion.rotateVector(bone.worldRotation, frame.normal),
          OVER,
        ),
      );
    };
    const lain: ReturnType<typeof R.bones> = R.bones(body, lying, lying.duration);
    for (const off of [false, true]) {
      const plan: IAutoMovieMotionHumanActionPlan = pullCover.plan(
        motionActionContext.after(body, lying, { prop: "cover", off }),
      );
      for (const side of ["left", "right"] as const) {
        const thigh: IAutoMovieVector3 = site(
          lain,
          side === "left" ? "thighFrontLeft" : "thighFrontRight",
        );
        const chest: IAutoMovieVector3 = site(
          lain,
          side === "left" ? "chestLeft" : "chestRight",
        );
        const grip = (t: number): IAutoMovieVector3 =>
          HumanHand.frame(body, R.bones(body, plan, t), side, "grip", "relaxed")
            .point;
        const ready: number = Vector3.distance(
          grip(R.event(plan, "ready")!),
          off ? chest : thigh,
        );
        const end: number = Vector3.distance(
          grip(R.event(plan, "strokeEnd")!),
          off ? thigh : chest,
        );
        TestValidator.predicate(
          `${name} ${off ? "push" : "pull"} ${side}: grips at ${ready} m, lets go at ${end} m`,
          ready <= REACH && end <= REACH,
        );
      }
    }
  }
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  let refused: unknown;
  try {
    pullCover.plan(motionActionContext(body, { prop: "cover" }));
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "standing is refused on the base",
    refused instanceof HumanRefusal && refused.axis === "base",
  );
}
