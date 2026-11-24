import { jointRomOvershoot } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A prepared joint scorer applies actual degree distances for every candidate
 * while sharing only its fixed constraint and clinical frame.
 *
 * Scenarios:
 * 1. Box endpoints contribute no fault; crossing a lower or upper endpoint
 *    adds its distance, immobile axes add their magnitude, and null angles
 *    remain undriven even when a numeric zero would lie outside the box.
 * 2. A combined swing cap sees a null axis as zero rotation and adds to box
 *    overshoot. Candidate A/B/A reads cannot retain the previous answer.
 * 3. For cardinal F=X, A=Y, T=Z with clinical twist 10-rigTwist, pure swing
 *    60 exceeds a 45-degree reach by 15 and clinical twist 40 exceeds its
 *    upper bound 15 by 25. Together they score 40, independently of Euler boxes.
 * 4. Nonfinite gated candidates score Infinity before basis admission.
 *    Null constraints read no coordinate and score zero even for such input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States degree units, null/immobile distinctions, ordered-distance sum, fixed-frame lifetime and four numerical/admission scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public prepared scorer with changing real joint records across box/cone/swing-twist paths, asserts finite degree scores or Infinity, observes lazy finite-basis admission and propagates an owned getter refusal on the first finite candidate.
 * @evidence contracts/development/testing.md#independent-expectations Box distances are literal endpoint subtractions. One-axis swing equals its absolute angle below 180 degrees. Orthogonal Rx(f)Rz(t) has swing |f| and twist t, so the supplied affine clinical map and 45-degree reach independently give the 15/25/40 scores without a cold scorer as oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers null versus zero, both interval endpoints and both sides, immobile signs, summed box/cone faults, noncommuting swing/twist, A/B/A sequence, all three nonfinite coordinates, null constraint bypass and an owned malformed-basis refusal. General inverse/contact search remains separately specified.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit owns every joint, constraint and cardinal frame. Its observational getter changes no foreign function, global, Human ROM table or acceptance bound and starts no host or compiler.
 */
export function test_rom_prepared_joint_overshoot(): void {
  const box: IAutoMovieJointConstraint = {
    flexion: { min: 10, max: 30 },
    abduction: null,
    twist: { min: -5, max: 5 },
  };
  const score: (value: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare("leftLowerArm", box);
  for (const [value, expected] of [
    [joint("leftLowerArm"), 0],
    [joint("leftLowerArm", { flexion: 0 }), 10],
    [joint("leftLowerArm", { flexion: 10, abduction: 0, twist: -5 }), 0],
    [joint("leftLowerArm", { flexion: 30, twist: 5 }), 0],
    [joint("leftLowerArm", { flexion: -2, abduction: -7, twist: 8 }), 22],
    [joint("leftLowerArm", { flexion: 32, abduction: 7, twist: -8 }), 12],
  ] as const)
    TestValidator.predicate("prepared box retains exact degree distances",
      nclose(score(value), expected, 1e-12),
    );
  const coupled: (value: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare("leftUpperArm", {
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
    TestValidator.predicate("prepared cone sums actual current candidate faults",
      nclose(coupled(value), expected, 1e-10),
    );

  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const rig: IAutoMovieJointRotationFrame = {
    axes, frame: { twist: { sign: -1, neutral: 10 } },
  };
  const range: IAutoMovieJointConstraint = {
    flexion: { min: -45, max: 45 },
    abduction: { min: -45, max: 45 },
    twist: { min: -180, max: 180 },
    swingTwist: { twist: { min: -15, max: 15 }, reach: 45 },
  };
  const physical: (value: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare("leftUpperArm", range, rig);
  for (const [flexion, twist, expected] of [
    [20, 10, 0], [60, 10, 15], [0, 40, 25], [60, 40, 40], [20, 10, 0],
  ] as const)
    TestValidator.predicate("prepared physical swing and twist remain current",
      nclose(physical(joint("leftUpperArm", { flexion, abduction: 0, twist })), expected, 1e-8),
    );

  let reads: number = 0;
  const invalidAxes: IAutoMovieJointAxes = {
    /** Refuse the owned basis only when a finite candidate actually needs it. */
    get flexion(): IAutoMovieVector3 {
      reads++;
      throw new Error("owned frame admission");
    },
    abduction: axes.abduction,
    twist: axes.twist,
  };
  const lazy: (value: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare("leftUpperArm", range, { axes: invalidAxes });
  for (const axis of ["flexion", "abduction", "twist"] as const)
    TestValidator.equals("nonfinite candidate scores Infinity before basis read",
      lazy({ ...joint("leftUpperArm"), [axis]: NaN }), Infinity,
    );
  TestValidator.equals("nonfinite candidates admitted no numerical basis", reads, 0);
  TestValidator.predicate("finite candidate propagates actual basis refusal",
    throwsError((): number => lazy(joint("leftUpperArm")), "owned frame admission"),
  );
  TestValidator.predicate("finite path did read its required basis", reads > 0);

  const absent: (value: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare("leftUpperArm", null, { axes: invalidAxes });
  const unread: IAutoMovieJointPose = {
    bone: "leftUpperArm",
    /** An unconstrained score has no dependency on this clinical coordinate. */
    get flexion(): number { throw new Error("unneeded angle read"); },
    /** The immobility distinction belongs to actual constraints only. */
    get abduction(): number { throw new Error("unneeded angle read"); },
    /** Null constraint admission must leave the complete coordinate tuple unread. */
    get twist(): number { throw new Error("unneeded angle read"); },
  };
  TestValidator.predicate("null constraints demand no joint coordinates",
    nclose(absent(unread), 0, 0),
  );
}
