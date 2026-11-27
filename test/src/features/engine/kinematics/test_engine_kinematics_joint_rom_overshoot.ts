import { AutoMovieEngineKinematics, AutoMovieEngineSwingTwistRange } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../internal/joint";
import { nclose } from "../../internal/nclose";

/**
 * A prepared joint scorer applies actual degree distances for every candidate
 * while sharing only its fixed constraint and clinical frame.
 *
 * Scenarios:
 *
 * 1. Box endpoints contribute no fault; crossing a lower or upper endpoint adds
 *    its distance, immobile axes add their magnitude, and null angles remain
 *    undriven even when a numeric zero would lie outside the box.
 * 2. A combined swing cap sees a null axis as zero rotation and adds to box
 *    overshoot. Candidate A/B/A reads cannot retain the previous answer.
 * 3. For cardinal F=X, A=Y, T=Z with clinical twist 10-rigTwist, pure swing 60
 *    exceeds a 45-degree reach by 15 and clinical twist 40 exceeds its upper
 *    bound 15 by 25. Together they score 40, independently of Euler boxes.
 * 4. Nonfinite gated candidates score Infinity before basis admission. Null
 *    constraints read no coordinate and score zero even for such input.
 */
export function test_engine_kinematics_joint_rom_overshoot(): void {
  const box: IAutoMovieJointConstraint = {
    flexion: { min: 10, max: 30 },
    abduction: null,
    twist: { min: -5, max: 5 },
  };
  const score: (value: IAutoMovieJointPose) => number =
    AutoMovieEngineKinematics.prepareJointRomOvershoot("leftLowerArm", box);
  for (const [value, expected] of [
    [joint("leftLowerArm"), 0],
    [joint("leftLowerArm", { flexion: 0 }), 10],
    [joint("leftLowerArm", { flexion: 10, abduction: 0, twist: -5 }), 0],
    [joint("leftLowerArm", { flexion: 30, twist: 5 }), 0],
    [joint("leftLowerArm", { flexion: -2, abduction: -7, twist: 8 }), 22],
    [joint("leftLowerArm", { flexion: 32, abduction: 7, twist: -8 }), 12],
  ] as const)
    TestValidator.predicate(
      "prepared box retains exact degree distances",
      nclose(score(value), expected, 1e-12),
    );
  const coupled: (value: IAutoMovieJointPose) => number =
    AutoMovieEngineKinematics.prepareJointRomOvershoot("leftUpperArm", {
      flexion: { min: -45, max: 45 },
      abduction: { min: -90, max: 90 },
      twist: null,
      swingDeg: 40,
    });
  for (const [value, expected] of [
    [joint("leftUpperArm", { flexion: 60 }), 35],
    [joint("leftUpperArm", { flexion: null, abduction: 60 }), 20],
    [joint("leftUpperArm", { flexion: 60, abduction: 0 }), 35],
    [joint("leftUpperArm", { flexion: 20 }), 0],
    [joint("leftUpperArm", { flexion: 60 }), 35],
  ] as const)
    TestValidator.predicate(
      "prepared cone sums actual current candidate faults",
      nclose(coupled(value), expected, 1e-10),
    );

  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const range: IAutoMovieJointConstraint = {
    flexion: { min: -45, max: 45 },
    abduction: { min: -45, max: 45 },
    twist: { min: -180, max: 180 },
    swingTwist: { twist: { min: -15, max: 15 }, reach: 45 },
  };
  const rig: ReturnType<typeof AutoMovieEngineSwingTwistRange.prepare> =
    AutoMovieEngineSwingTwistRange.prepare(
      "leftUpperArm",
      { axes, frame: { twist: { sign: -1, neutral: 10 } } },
      range,
    );
  const physical: (value: IAutoMovieJointPose) => number =
    AutoMovieEngineKinematics.prepareJointRomOvershoot("leftUpperArm", range, rig);
  for (const [flexion, twist, expected] of [
    [20, 10, 0],
    [60, 10, 15],
    [0, 40, 25],
    [60, 40, 40],
    [20, 10, 0],
  ] as const)
    TestValidator.predicate(
      "prepared physical swing and twist remain current",
      nclose(
        physical(joint("leftUpperArm", { flexion, abduction: 0, twist })),
        expected,
        1e-8,
      ),
    );

  const absent: (value: IAutoMovieJointPose) => number =
    AutoMovieEngineKinematics.prepareJointRomOvershoot("leftUpperArm", null, rig);
  const unread: IAutoMovieJointPose = {
    bone: "leftUpperArm",
    /** An unconstrained score has no dependency on this clinical coordinate. */
    get flexion(): number {
      throw new Error("unneeded angle read");
    },
    /** The immobility distinction belongs to actual constraints only. */
    get abduction(): number {
      throw new Error("unneeded angle read");
    },
    /**
     * Null constraint admission must leave the complete coordinate tuple
     * unread.
     */
    get twist(): number {
      throw new Error("unneeded angle read");
    },
  };
  TestValidator.predicate(
    "null constraints demand no joint coordinates",
    nclose(absent(unread), 0, 0),
  );
}
