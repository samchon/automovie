import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  HumanHand,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A carried arm planned over the span its weight states moves continuously
 * from the moment its weight leaves 0: a hand carried from hanging onto the
 * thigh takes its clearance on one planned trajectory, not a turn switched in
 * by the share.
 *
 * Scenarios:
 * 1. A minimum-jerk weight that leaves 0 at 0.2 s, reaches 1 at 1.0 s and
 *    holds it to the window's end at 1.5 s states that span: start 0.2 s
 *    within 1e-9 s, ready 1.0 s within 1e-5 s (the weight is flat to third
 *    order there, so it is 1 to double precision some 2e-6 s early), relax
 *    and end at 1.5 s.
 * 2. The average man's right hand, hanging in the quiet stance, carried by
 *    that weight onto the outside of his right thigh, at the hanging palm's
 *    own height with the fingers down: every frame at 120 a
 *    second is finite; the palm moves no farther between two frames than
 *    the audit's travel bound allows, the first frames after the weight
 *    leaves 0 included; and from ready to the end it lies within 11 mm of
 *    its place, the planner's 10 mm site disc and a millimetre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares and writes the real carried arm and reads the palm on the resolved pose; a clearing turn switched in by the share, a span read off the weight's instants or a hand that misses the thigh fails.
 * @evidence contracts/development/testing.md#independent-expectations The weight's instants are written here, the travel bound is the audit's 80 mm per twenty-fourth of a second, and the place is the body's own thigh region on the stance.
 * @evidence contracts/development/testing.md#distinguishing-cases The rest, the first frames off it, the reach, the hold and the window's end.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the 2 scenarios and their bounds.
 */
export function test_human_motion_core_carry_continuity(): void {
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

  // 1. The span the weight states.
  const span: AutoMovieMotionHumanArm.ISpan | undefined =
    AutoMovieMotionHumanArm.stated(weight, 0, end);
  TestValidator.predicate(
    "the weight states its span",
    span !== undefined &&
      Math.abs(span.start - start) <= 1e-9 &&
      // Flat to third order at its end, the weight is 1 to double
      // precision some 2e-6 s before it.
      Math.abs(span.ready - ready) <= 1e-5 &&
      span.relax === end &&
      span.end === end,
  );

  // 2. A hanging hand carried onto the thigh.
  const body: IHumanBody = motionHumanBody("m-average");
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const side: HumanHand.Side = "right";
  const bones = poseBones(body, resolveHumanPosture(body, quiet));
  const region = body.surfaces.regions.thighOuterRight;
  const surface = resolveAutoMovieHumanoidSurfaces.place(
    region,
    bones.get(region.bone)!,
  );
  // The outer thigh's surface plane at the hanging palm's own height: the
  // palm brought in onto it, fingers down.
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
  const thigh = {
    point: {
      x: hanging.x + inward * surface.normal.x,
      y: hanging.y + inward * surface.normal.y,
      z: hanging.z + inward * surface.normal.z,
    },
    normal: surface.normal,
  };
  const goal: IHumanPosture.IGoal = AutoMovieMotionHumanArm.goal(
    body,
    side,
    AutoMovieMotionHumanTarget.hand(body, quiet, side, thigh, {
      forward: { x: 0, y: -1, z: 0 },
    }),
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
    goal: (): IHumanPosture.IGoal => goal,
    weight,
    span: span!,
  });
  const before = (): IHumanPosture => quiet;
  arm.prepare!(before);
  const palm = (seconds: number): IAutoMovieVector3 =>
    HumanHand.frame(
      body,
      poseBones(
        body,
        resolveHumanPosture(body, arm.write(quiet, seconds, before)),
      ),
      side,
      "palm",
      "flat",
    ).point;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const rate: number = 120;
  const frames: number = Math.round(end * rate);
  const read: IAutoMovieVector3[] = Array.from(
    { length: frames + 1 },
    (_: unknown, i: number): IAutoMovieVector3 => palm(i / rate),
  );
  TestValidator.predicate(
    "every frame is finite",
    read.every(
      (p: IAutoMovieVector3): boolean =>
        Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z),
    ),
  );
  const step: number = Math.max(
    ...read
      .slice(1)
      .map((p: IAutoMovieVector3, i: number): number => distance(p, read[i]!)),
  );
  TestValidator.predicate(
    `the palm's largest step between frames, ${(step * 1000).toFixed(1)} mm, is within the audit's travel bound`,
    step <= (0.08 * 24) / rate,
  );
  const off: number = Math.max(
    ...read
      .filter((_: IAutoMovieVector3, i: number): boolean => i / rate >= ready)
      .map((p: IAutoMovieVector3): number => distance(p, thigh.point)),
  );
  TestValidator.predicate(
    `the palm stays within ${(off * 1000).toFixed(1)} mm of the thigh from ready to the end`,
    off <= 0.011,
  );
}
