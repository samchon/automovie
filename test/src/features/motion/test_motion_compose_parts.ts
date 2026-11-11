import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanJoints,
  HumanHand,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The part primitives' body-free rules: joint angles added on their own
 * channels, a hand's fingers on the way to a shape, an origin carried by the
 * performer's floor frame, and a reach's travel time.
 *
 * Scenarios:
 * 1. Angles for a shoulder girdle, the head and a right finger are written on
 *    the trunk, the head and the right hand, in the channel order.
 * 2. A joint primitive adds its angles to a joint the posture holds and to one
 *    it does not, leaves other joints alone, and throws at a second when it is
 *    given a bone outside its channels.
 * 3. A hand's fingers at weight 0 are the relaxed cascade and at weight 1 the
 *    asked shape; half way each flexion is the mean of the two; an extra curl
 *    of 10° flexes every finger segment but no thumb segment.
 * 4. An origin 0.1 m left, 1 m up and 0.3 m forward of a root at (2, 0, 5)
 *    heading 90° (facing +X) is at (2.3, 1, 4.9) in the world.
 * 5. A hand travels 0.4 m in 0.45 s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public primitives and reads the returned channels, joint angles, point and seconds; angles written on the wrong channel, a curl applied to the thumb or a frame turned the wrong way fails.
 * @evidence contracts/development/testing.md#independent-expectations Sums and means are computed by hand from the inputs, the finger end states are the hand's own published shapes, and the world point follows from the stated frame: at a heading of 90° forward is +X and left is -Z.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three channel kinds, a held and an absent joint, a refused bone, three weights, fingers against thumbs, a turned frame and the travel rule.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit that needs no body; it runs in CI. Arm goals and the balanced lean need a measured body and are judged by the motion captures.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_compose_parts(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  TestValidator.equals(
    "channels of a set of angles",
    AutoMovieMotionHumanJoints.channels({
      rightIndexProximal: [10, 0, 0],
      head: [5, 0, 0],
      leftShoulder: [0, 4, 0],
    }),
    ["trunk", "head", "rightHand"],
  );

  const posture: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [10, 2, 0], spine: [7, 0, 0] },
    limbs: {},
  };
  const nod: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanJoints.add({
    channels: ["head"],
    from: 0,
    to: 1,
    delta: (seconds: number): AutoMovieMotionHumanJoints.Angles =>
      seconds > 0.9
        ? { spine: [1, 0, 0] }
        : { head: [20 * seconds, 0, 1], neck: [4, 0, 0] },
  });
  TestValidator.equals(
    "angles are added to held and absent joints",
    nod.write(posture, 0.5).joints,
    { head: [20, 2, 1], spine: [7, 0, 0], neck: [4, 0, 0] },
  );
  TestValidator.error("a bone outside the channels", (): unknown =>
    nod.write(posture, 0.95),
  );

  const relaxed = HumanHand.shape("left", "relaxed");
  const fist = HumanHand.shape("left", "fist");
  const bones = Object.keys(fist) as (keyof typeof fist)[];
  const matches = (
    got: IHumanPosture["joints"],
    want: (bone: keyof typeof fist) => number,
  ): boolean =>
    bones.length > 0 &&
    bones.every((bone): boolean => close(got[bone]![0], want(bone)));
  TestValidator.predicate(
    "fingers go from the relaxed cascade to the shape",
    matches(
      AutoMovieMotionHumanArm.fingers("left", "fist", 0, 0),
      (b): number => relaxed[b]![0],
    ) &&
      matches(
        AutoMovieMotionHumanArm.fingers("left", "fist", 0, 1),
        (b): number => fist[b]![0],
      ) &&
      matches(
        AutoMovieMotionHumanArm.fingers("left", "fist", 0, 0.5),
        (b): number => (relaxed[b]![0] + fist[b]![0]) / 2,
      ),
  );
  TestValidator.predicate(
    "a curl flexes the fingers and not the thumb",
    bones.some((b): boolean => b.includes("Thumb")) &&
      matches(
        AutoMovieMotionHumanArm.fingers("left", "fist", 10, 1),
        (b): number => fist[b]![0] + (b.includes("Thumb") ? 0 : 10),
      ),
  );

  const world = AutoMovieMotionHumanArm.point(
    { root: { x: 2, y: 0, z: 5 }, yaw: 90 },
    { point: { x: 0.1, y: 1, z: 0.3 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
  );
  TestValidator.predicate(
    "an origin follows the root and the heading",
    close(world.x, 2.3) && close(world.y, 1) && close(world.z, 4.9),
  );
  TestValidator.predicate(
    "travel time of a reach",
    close(AutoMovieMotionHumanArm.transport(0.4), 0.45),
  );
}
