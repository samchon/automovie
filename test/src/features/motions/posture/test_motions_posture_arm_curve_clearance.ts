import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";
import {
  HumanArmGeometry as Geometry,
  HumanArmTrajectoryAdmission as Admission,
  HumanArmTrajectoryKnots as Knots,
  HumanArmTrajectoryModel as Model,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { armTrajectoryReading as fixture } from "../../internal/armTrajectoryReading";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * A joint quintic visits a stationary self collider between two identical
 * endpoint poses. An endpoint chord stays clear. Direct forward kinematics
 * places a small sphere at the moving probe's mid-interval world point.
 */
export async function test_motions_posture_arm_curve_clearance(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const setup = fixture.setup(body, "right");
  const frame = fixture.frame(setup, 3 / 8, [1 / 8]);
  const times: number[] = [0, 1 / 4];
  const middle: number = times[1]! / 2;
  const pose: number[] = [30, 40, 0, 45, 0, 0, 0, 0, 0];
  const x: number[][][] = [[pose, pose]];
  const zero: number[] = fixture.zero();
  const from: number[] = [...zero];
  const to: number[] = [...zero];
  from[3] = 60;
  to[3] = -60;
  const rates: Knots.IRates = {
    velocities: [[from, to]],
    accelerations: [[zero, zero]],
  };
  const probe = (q: readonly number[]) =>
    Geometry.placed(setup, frame, q, true).probes[Geometry.SURFACE]![0];
  // Opposite endpoint rates of the quintic give a midpoint increment of
  // 5 h v / 16, by substitution into the Hermite basis.
  const midPose: number[] = [...pose];
  midPose[3]! += (5 * times[1]! * from[3]!) / 16;
  const centre = probe(midPose);
  const radius: number = 1 / 512;
  frame.shapes = [
    {
      bone: "hips",
      part: body.tangle.parts.findIndex((part) => part.bone === "hips"),
      centre,
      radius,
      pose: { position: centre, rotation: Quaternion.identity() },
      shape: fixture.sphere(radius),
    },
  ] satisfies IAutoMovieMotionHumanArmGeometry.IFrame["shapes"];
  const context: Model.IContext = {
    ...fixture.context([setup], [[frame, frame]], times, false),
    fixedSelf: [0, times[1]!],
  };
  const native = Model.evaluate(context, x);
  TestValidator.predicate(
    "the native endpoint chord clears the sphere",
    native.worst.value <= Model.TOLERANCE &&
      Vector3.distance(probe(pose), centre) > radius,
  );
  const reading = Admission.continuous(context, times, x, rates, native);
  TestValidator.predicate(
    "the exact quintic is refused at its physical interior collision",
    reading.worst.term === "swept" &&
      reading.curved?.[0]?.time === middle &&
      Math.abs(reading.worst.value - radius * 1000) < 1e-9,
  );
  const stationary = Admission.continuous(
    context,
    times,
    x,
    { ...rates, velocities: [[zero, zero]] },
    native,
  );
  TestValidator.predicate(
    "the same poses with stationary derivatives retain their passing verdict",
    stationary === native,
  );
}
