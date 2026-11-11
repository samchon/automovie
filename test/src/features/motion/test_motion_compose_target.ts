import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTarget,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A target resolved to a place: the default place of an action without a
 * target, and which targets are solid.
 *
 * The body is a stub 1.7 m tall with an upper arm of 0.3 m, a forearm of 0.25
 * m and a half shoulder width of 0.2 m. The context's aim is a stub that
 * returns the point (9, 9, 9) facing +Y and counts its calls.
 *
 * Scenarios:
 * 1. For a root at (1, 0.9, 2) heading 90° (forward +X, left -Z), the `ahead`
 *    default (0.72 statures high, 0.8 arms away, facing the performer) is at
 *    (1.44, 1.224, 2) facing -X and is not solid; the root's own height is
 *    not read.
 * 2. A lateral share of 0.5 moves that place 0.1 m to the performer's left,
 *    to z = 1.9; the `desk` default faces up at a height of 0.714 m.
 * 3. An absent target and a bare `none` resolve to the default place without
 *    asking the aim.
 * 4. A `none` that states a range asks the aim and is not solid; a point
 *    without a normal is not solid and one with a normal is; a person and a
 *    prop are solid.
 * 5. A self target on a region carried by a hand throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads the place and the aim's call count; a default read from the root's height, a targetless action that asks the aim, or a bare point marked solid fails.
 * @evidence contracts/development/testing.md#independent-expectations The default's point is the stated shares times the stub's measures, worked out by hand in the stated floor frame; solidity is the rule the namespace documents per kind.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers two defaults and a lateral offset, both targetless forms, a `none` with a range, a point with and without a normal, a person, a prop and a refused self region.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; the body is a stub of the measures and the region table the resolver reads, and the aim is a stub because resolving a person or a prop belongs to the performance. A self region on the trunk and the hand and foot goals read a real body and are judged by the motion captures. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States both stubs and lists the 5 scenarios with their numbers.
 */
export function test_motion_compose_target(): void {
  const body: IHumanBody = {
    measure: {
      stature: 1.7,
      upperArm: 0.3,
      forearm: 0.25,
      shoulderHalfWidth: 0.2,
    },
    surfaces: { regions: { palmLeft: { bone: "leftHand" } } },
  } as unknown as IHumanBody;
  const posture: IHumanPosture = {
    root: { x: 1, y: 0.9, z: 2 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const at = (
    got: IAutoMovieVector3,
    x: number,
    y: number,
    z: number,
  ): boolean =>
    Math.abs(got.x - x) <= 1e-9 &&
    Math.abs(got.y - y) <= 1e-9 &&
    Math.abs(got.z - z) <= 1e-9;

  const ahead = AutoMovieMotionHumanTarget.fallback(
    body,
    posture,
    AutoMovieMotionHumanTarget.DEFAULTS.ahead,
  );
  TestValidator.predicate(
    "the default place ahead",
    at(ahead.point, 1.44, 1.224, 2) &&
      at(ahead.normal, -1, 0, 0) &&
      ahead.solid === false,
  );
  const desk = AutoMovieMotionHumanTarget.fallback(
    body,
    posture,
    AutoMovieMotionHumanTarget.DEFAULTS.desk,
  );
  TestValidator.predicate(
    "a lateral share and the desk default",
    at(
      AutoMovieMotionHumanTarget.fallback(body, posture, {
        ...AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        lateral: 0.5,
      }).point,
      1.44,
      1.224,
      1.9,
    ) &&
      at(desk.point, 1.33, 0.714, 2) &&
      at(desk.normal, 0, 1, 0),
  );

  let calls: number = 0;
  const context = {
    body,
    aim: (): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
      ++calls;
      return { point: { x: 9, y: 9, z: 9 }, normal: { x: 0, y: 1, z: 0 } };
    },
  };
  const resolve = (
    target: AutoMovieMotionTarget | undefined,
  ): AutoMovieMotionHumanTarget.IPlace =>
    AutoMovieMotionHumanTarget.resolve(
      context,
      target,
      0,
      posture,
      AutoMovieMotionHumanTarget.DEFAULTS.ahead,
    );
  TestValidator.predicate(
    "no target takes the default place without the aim",
    at(resolve(undefined).point, 1.44, 1.224, 2) &&
      at(resolve({ kind: "none" }).point, 1.44, 1.224, 2) &&
      resolve({ kind: "none" }).solid === false &&
      calls === 0,
  );

  const drill = resolve({ kind: "none", range: 1 });
  const bare = resolve({
    kind: "point",
    at: { x: 0, y: 1, z: 1 },
    frame: "performer",
  });
  const faced = resolve({
    kind: "point",
    at: { x: 0, y: 1, z: 1 },
    frame: "performer",
    normal: { x: 0, y: 1, z: 0 },
  });
  const person = resolve({ kind: "person", subject: "b", region: "chin" });
  const prop = resolve({ kind: "prop", subject: "bag", point: "centre" });
  TestValidator.predicate(
    "which targets are solid",
    at(drill.point, 9, 9, 9) &&
      drill.solid === false &&
      bare.solid === false &&
      faced.solid === true &&
      person.solid === true &&
      prop.solid === true &&
      calls === 5,
  );
  TestValidator.error("a self region on a limb", (): unknown =>
    resolve({ kind: "self", region: "palmLeft" }),
  );
}
