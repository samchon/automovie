import { Quaternion } from "@automovie/engine";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanHand,
  AutoMovieMotionHumanJoints,
  AutoMovieMotionHumanLeg,
  AutoMovieMotionHumanRoot,
  HumanFoot,
  HumanHand,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The body-free rules of the root, leg, joint-pulse and hand-shape
 * primitives: a displacement in the performer's own frame, a foot's arc
 * between two placements, and shares that rise and fall on the clock.
 *
 * Scenarios:
 * 1. A root at (2, 0, 5) heading 90° (facing +X) displaced 0.1 m left, 0.05 m
 *    down and 0.3 m forward with a 30° turn is at (2.3, -0.05, 4.9) heading
 *    120°; pitch, roll, joints and limbs are untouched.
 * 2. An excursion that rises over 0.2 to 0.4 s and falls over 0.6 to 0.8 s
 *    claims the root over 0.2 to 0.8 s, holds half the displacement at 0.3 s
 *    and at 0.7 s and all of it at 0.5 s.
 * 3. A foot's arc with a 0.1 m clearance between ankles at (0, 0.08, 0) and
 *    (0.2, 0.08, 0.6) is at the first placement at progress 0, 0.075 m above
 *    the line a quarter of the way, 0.1 m above its midpoint half way with a
 *    heading half way between 0° and 90°, and at the second placement at and
 *    past progress 1.
 * 4. A pulse of head and shoulder-girdle angles claims the trunk and the
 *    head, adds half of each angle at 0.3 s and all of it at 0.5 s to what the
 *    posture holds.
 * 5. A right hand formed into a fist claims the right hand only, is half way
 *    between the relaxed cascade and the fist at 0.3 s and the fist at 0.5 s,
 *    and keeps the posture's other joints.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public primitives and reads the returned windows, channels, root, heading, ankle and joint angles; a displacement in the world frame instead of the performer's, an arc that does not land, or a share on the wrong window fails.
 * @evidence contracts/development/testing.md#independent-expectations World points follow by hand from the stated frame (at 90° forward is +X and left is -Z), arc heights from `4 c s (1 - s)` evaluated by hand, and shares from the clock's envelope at the midpoints of its windows; hand end states are the hand's own published shapes.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a turned frame with all three axes and a turn, rising, full and falling shares, four arc progresses including one past the end, two channel kinds for a pulse and a held joint beside written ones.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit that needs no body; it runs in CI. Leg goals and gaze need a measured body and are judged by the motion captures.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_compose_moves(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(1, [
    { name: "rise", seconds: 0.2 },
    { name: "peak", seconds: 0.4 },
    { name: "fall", seconds: 0.6 },
    { name: "rest", seconds: 0.8 },
  ]);
  const posture: IHumanPosture = {
    root: { x: 2, y: 0, z: 5 },
    yaw: 90,
    pitch: 3,
    roll: 4,
    joints: { head: [1, 1, 1] },
    limbs: {},
  };

  const offset: AutoMovieMotionHumanRoot.IOffset = {
    point: { x: 0.1, y: -0.05, z: 0.3 },
    yaw: 30,
  };
  const placed: IHumanPosture = AutoMovieMotionHumanRoot.place(posture, offset);
  TestValidator.predicate(
    "a root is displaced in its own frame",
    close(placed.root.x, 2.3) &&
      close(placed.root.y, -0.05) &&
      close(placed.root.z, 4.9) &&
      close(placed.yaw, 120) &&
      placed.pitch === 3 &&
      placed.roll === 4,
  );
  TestValidator.equals("joints are untouched", placed.joints, posture.joints);

  const excursion: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.excursion(
      clock,
      ["rise", "peak"],
      ["fall", "rest"],
      offset,
    );
  TestValidator.equals("an excursion claims the root", excursion.channels, [
    "root",
  ]);
  const half = (seconds: number): boolean => {
    const at: IHumanPosture = excursion.write(posture, seconds);
    return (
      close(at.root.x, 2.15) &&
      close(at.root.y, -0.025) &&
      close(at.root.z, 4.95) &&
      close(at.yaw, 105)
    );
  };
  const full: IHumanPosture = excursion.write(posture, 0.5);
  TestValidator.predicate(
    "an excursion rises, holds and falls",
    close(excursion.from, 0.2) &&
      close(excursion.to, 0.8) &&
      half(0.3) &&
      half(0.7) &&
      close(full.root.x, 2.3) &&
      close(full.root.z, 4.9) &&
      close(full.yaw, 120),
  );

  const from: HumanFoot.IPlacement = {
    ankle: { x: 0, y: 0.08, z: 0 },
    rotation: Quaternion.identity(),
  };
  const to: HumanFoot.IPlacement = {
    ankle: { x: 0.2, y: 0.08, z: 0.6 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const arc = (progress: number): HumanFoot.IPlacement =>
    AutoMovieMotionHumanLeg.arc(from, to, 0.1, progress);
  const ankle = (
    at: HumanFoot.IPlacement,
    x: number,
    y: number,
    z: number,
  ): boolean =>
    close(at.ankle.x, x) && close(at.ankle.y, y) && close(at.ankle.z, z);
  TestValidator.predicate(
    "a foot's arc leaves, clears and lands",
    ankle(arc(0), 0, 0.08, 0) &&
      ankle(arc(0.25), 0.05, 0.155, 0.15) &&
      ankle(arc(0.5), 0.1, 0.18, 0.3) &&
      ankle(arc(1), 0.2, 0.08, 0.6) &&
      ankle(arc(2), 0.2, 0.08, 0.6),
  );
  TestValidator.predicate(
    "a foot's heading turns with its arc",
    Math.abs(HumanFoot.heading(arc(0).rotation)) < 1e-6 &&
      Math.abs(HumanFoot.heading(arc(0.5).rotation) - 45) < 1e-6 &&
      Math.abs(HumanFoot.heading(arc(1).rotation) - 90) < 1e-6,
  );

  const pulse: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanJoints.pulse(
      clock,
      ["rise", "peak"],
      ["fall", "rest"],
      { head: [20, 0, 10], leftShoulder: [0, 6, 0] },
    );
  TestValidator.equals("a pulse claims its bones' channels", pulse.channels, [
    "trunk",
    "head",
  ]);
  const angles = (
    got: readonly [number, number, number] | undefined,
    want: readonly [number, number, number],
  ): boolean =>
    got !== undefined &&
    close(got[0], want[0]) &&
    close(got[1], want[1]) &&
    close(got[2], want[2]);
  const rising: IHumanPosture["joints"] = pulse.write(posture, 0.3).joints;
  const peaked: IHumanPosture["joints"] = pulse.write(posture, 0.5).joints;
  TestValidator.predicate(
    "a pulse adds a share of its angles",
    close(pulse.from, 0.2) &&
      close(pulse.to, 0.8) &&
      angles(rising.head, [11, 1, 6]) &&
      angles(rising.leftShoulder, [0, 3, 0]) &&
      angles(peaked.head, [21, 1, 11]) &&
      angles(peaked.leftShoulder, [0, 6, 0]),
  );

  const fist: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHand.form(
    clock,
    "right",
    ["rise", "peak"],
    ["fall", "rest"],
    "fist",
  );
  TestValidator.equals("a formed hand claims its hand", fist.channels, [
    "rightHand",
  ]);
  const relaxed = HumanHand.shape("right", "relaxed");
  const closed = HumanHand.shape("right", "fist");
  const bones = Object.keys(closed) as (keyof typeof closed)[];
  const forming: IHumanPosture["joints"] = fist.write(posture, 0.3).joints;
  const formed: IHumanPosture["joints"] = fist.write(posture, 0.5).joints;
  TestValidator.predicate(
    "a hand forms by the clock's share",
    bones.length > 0 &&
      bones.every(
        (b): boolean =>
          close(forming[b]![0], (relaxed[b]![0] + closed[b]![0]) / 2) &&
          close(formed[b]![0], closed[b]![0]),
      ) &&
      angles(formed.head, [1, 1, 1]),
  );
}
