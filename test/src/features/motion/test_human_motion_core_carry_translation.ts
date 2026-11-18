import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  HumanHand,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A carried arm is the same motion wherever the floor is: translating the
 * floor, and the performer standing on it with the goal, translates every
 * frame of the planned arm by the same offset and changes nothing else.
 *
 * Scenario: the average man's right hand, hanging in the quiet stance,
 * carried by a minimum-jerk weight (0 until 0.2 s, 1 from 1.0 s to the
 * window's end at 1.5 s) onto the outside of his right thigh, fingers down,
 * planned once on the floor at the origin and once on each floor translated
 * along it by (1.7, 0, -2.3) m, up by 0.4 m and by both, the stance and the
 * place translated with it. At every frame at 120 a second each translated
 * palm, less its offset, lies within a micrometre of the palm on the floor
 * at the origin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans and writes the real carried arm on both floors and reads the palm on the resolved poses; a world-frame height or position read into the plan moves the translated palm off the original one and fails at its frame.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the original run itself, moved by the offset written here: a rigid translation of the whole scene leaves a motion's own geometry unchanged.
 * @evidence contracts/development/testing.md#distinguishing-cases A translation along all three axes, so a leak of the floor's height and of a horizontal position both show; every frame from the rest through the reach and the hold.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the scenario, the offset and the bound.
 */
export function test_human_motion_core_carry_translation(): void {
  const start: number = 0.2;
  const ready: number = 1;
  const end: number = 1.5;
  const weight = (seconds: number): number => {
    const s: number = Math.min(
      1,
      Math.max(0, (seconds - start) / (ready - start)),
    );
    return s * s * s * (10 - 15 * s + 6 * s * s);
  };
  const span: IAutoMovieMotionHumanArmPlanned.ISpan =
    AutoMovieMotionHumanArm.stated(weight, 0, end)!;
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const side: AutoMovieHumanSide = "right";
  const rate: number = 120;
  const frames: number = Math.round(end * rate);

  /** Every frame's palm of the carry planned on a floor at `floor`. */
  const palms = (floor: IAutoMovieVector3): IAutoMovieVector3[] => {
    const quiet: IAutoMovieMotionHumanPosture = stand.posture(body, floor, 0);
    const bones = poseBones(body, resolveHumanPosture(body, quiet));
    const region = body.surfaces.regions.thighOuterRight;
    const surface = resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    );
    const hanging: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      side,
      "palm",
      "relaxed",
    ).point;
    const inward: number =
      (surface.point.x - hanging.x) * surface.normal.x +
      (surface.point.y - hanging.y) * surface.normal.y +
      (surface.point.z - hanging.z) * surface.normal.z;
    const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArm.goal(
      body,
      side,
      AutoMovieMotionHumanTarget.hand(
        body,
        quiet,
        side,
        {
          point: {
            x: hanging.x + inward * surface.normal.x,
            y: hanging.y + inward * surface.normal.y,
            z: hanging.z + inward * surface.normal.z,
          },
          normal: surface.normal,
        },
        { forward: { x: 0, y: -1, z: 0 } },
      ),
    );
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
      body,
      side,
      from: 0,
      to: end,
      rest: AutoMovieMotionHumanArm.angles(
        resolveHumanPosture(body, quiet),
        side,
      ),
      goal: (): IAutoMovieHumanLimbGoal => goal,
      weight,
      span,
    });
    const before = (): IAutoMovieMotionHumanPosture => quiet;
    arm.prepare!(before);
    return Array.from(
      { length: frames + 1 },
      (_: unknown, i: number): IAutoMovieVector3 =>
        HumanHand.frame(
          body,
          poseBones(
            body,
            resolveHumanPosture(body, arm.write(quiet, i / rate, before)),
          ),
          side,
          "palm",
          "flat",
        ).point,
    );
  };
  const origin: IAutoMovieVector3[] = palms({ x: 0, y: 0, z: 0 });
  const offsets: Record<string, IAutoMovieVector3> = {
    "not at all, planned again": { x: 0, y: 0, z: 0 },
    "along the floor": { x: 1.7, y: 0, z: -2.3 },
    "up": { x: 0, y: 0.4, z: 0 },
    "along the floor and up": { x: 1.7, y: 0.4, z: -2.3 },
  };
  const complaints: string[] = [];
  for (const [label, offset] of Object.entries(offsets)) {
    const moved: IAutoMovieVector3[] = palms(offset);
    let worst: number = 0;
    let at: number = 0;
    for (let i: number = 0; i <= frames; ++i) {
      const gap: number = Math.hypot(
        moved[i]!.x - offset.x - origin[i]!.x,
        moved[i]!.y - offset.y - origin[i]!.y,
        moved[i]!.z - offset.z - origin[i]!.z,
      );
      if (gap > worst) {
        worst = gap;
        at = i / rate;
      }
    }
    if (!(worst <= 1e-6))
      complaints.push(
        `floor moved ${label}: the palm is ${(worst * 1000).toFixed(4)} mm off the moved original at ${at.toFixed(3)} s`,
      );
  }
  TestValidator.equals("the carry moves with its floor", complaints, []);
}