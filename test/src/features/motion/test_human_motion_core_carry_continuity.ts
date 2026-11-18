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

interface ICarriedRead {
  palms: IAutoMovieVector3[];
  thigh: IAutoMovieVector3;
}

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
 * 3. The same palms translated with the floor agree on every frame within
 *    one micrometre. The origin repeat checks determinism. Horizontal and
 *    vertical offsets, alone and together, check both frame dependencies.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares and writes the real carried arm and reads the palm on the resolved pose; a clearing turn switched in by the share, a span read off the weight's instants or a hand that misses the thigh fails.
 * @evidence contracts/development/testing.md#independent-expectations The weight's instants are written here, the travel bound is the audit's 80 mm per twenty-fourth of a second, the place is the body's own thigh region on the stance, and translating the whole scene translates each palm by the same offset.
 * @evidence contracts/development/testing.md#distinguishing-cases The rest, the first frames off it, the reach, the hold and the window's end.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, continuity and rigid-translation bounds.
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
  const span: IAutoMovieMotionHumanArmPlanned.ISpan | undefined =
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

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const side: AutoMovieHumanSide = "right";
  const region = body.surfaces.regions.thighOuterRight;
  const rate: number = 120;
  const frames: number = Math.round(end * rate);
  const plan = (floor: IAutoMovieVector3): ICarriedRead => {
    const quiet: IAutoMovieMotionHumanPosture = stand.posture(body, floor, 0);
    const resolved = resolveHumanPosture(body, quiet);
    const bones = poseBones(body, resolved);
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
    // Project the hanging palm onto the outer thigh's surface plane.
    const inward: number =
      (surface.point.x - hanging.x) * surface.normal.x +
      (surface.point.y - hanging.y) * surface.normal.y +
      (surface.point.z - hanging.z) * surface.normal.z;
    const thigh: IAutoMovieVector3 = {
      x: hanging.x + inward * surface.normal.x,
      y: hanging.y + inward * surface.normal.y,
      z: hanging.z + inward * surface.normal.z,
    };
    const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArm.goal(
      body,
      side,
      AutoMovieMotionHumanTarget.hand(
        body,
        quiet,
        side,
        { point: thigh, normal: surface.normal },
        { forward: { x: 0, y: -1, z: 0 } },
      ),
    );
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side,
        from: 0,
        to: end,
        rest: AutoMovieMotionHumanArm.angles(resolved, side),
        goal: (): IAutoMovieHumanLimbGoal => goal,
        weight,
        span: span!,
      },
    );
    const before = (): IAutoMovieMotionHumanPosture => quiet;
    arm.prepare!(before);
    const palms: IAutoMovieVector3[] = Array.from(
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
    return { palms, thigh };
  };

  // Continuity and translation share the unshifted trajectory.
  const { palms, thigh } = plan({ x: 0, y: 0, z: 0 });
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  TestValidator.predicate(
    "every frame is finite",
    palms.every(
      (p: IAutoMovieVector3): boolean =>
        Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z),
    ),
  );
  const step: number = Math.max(
    ...palms
      .slice(1)
      .map((p: IAutoMovieVector3, i: number): number => distance(p, palms[i]!)),
  );
  TestValidator.predicate(
    `the palm's largest step between frames, ${(step * 1000).toFixed(1)} mm, is within the audit's travel bound`,
    step <= (0.08 * 24) / rate,
  );
  const off: number = Math.max(
    ...palms
      .filter((_: IAutoMovieVector3, i: number): boolean => i / rate >= ready)
      .map((p: IAutoMovieVector3): number => distance(p, thigh)),
  );
  TestValidator.predicate(
    `the palm stays within ${(off * 1000).toFixed(1)} mm of the thigh from ready to the end`,
    off <= 0.011,
  );

  const offsets: Record<string, IAutoMovieVector3> = {
    "at the origin, planned again": { x: 0, y: 0, z: 0 },
    "along the floor": { x: 1.7, y: 0, z: -2.3 },
    up: { x: 0, y: 0.4, z: 0 },
    "along the floor and up": { x: 1.7, y: 0.4, z: -2.3 },
  };
  const complaints: string[] = [];
  for (const [label, offset] of Object.entries(offsets)) {
    const moved: IAutoMovieVector3[] = plan(offset).palms;
    let worst: number = 0;
    let at: number = 0;
    for (let i: number = 0; i <= frames; ++i) {
      const gap: number = Math.hypot(
        moved[i]!.x - offset.x - palms[i]!.x,
        moved[i]!.y - offset.y - palms[i]!.y,
        moved[i]!.z - offset.z - palms[i]!.z,
      );
      if (!(gap <= worst)) {
        worst = gap;
        at = i / rate;
        if (!Number.isFinite(gap)) break;
      }
    }
    if (!(worst <= 1e-6))
      complaints.push(
        `floor ${label}: the palm is ${(worst * 1000).toFixed(4)} mm off the moved original at ${at.toFixed(3)} s`,
      );
  }
  TestValidator.equals("the carry moves with its floor", complaints, []);
}
