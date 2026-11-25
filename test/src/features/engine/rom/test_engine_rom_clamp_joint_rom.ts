import {
  ViolationCollector,
  clampJointRom,
  validateJointRom,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The cap pull is a bisection; its landing agrees to this many degrees. */
const CAP: number = 1e-6;

/** Flexion 10..90 and twist -30..30. */
const RANGE: IAutoMovieJointConstraint = {
  flexion: { min: 10, max: 90 },
  abduction: null,
  twist: { min: -30, max: 30 },
};

/** A pose with the given flexion and twist. */
const pose: (flexion: number, twist: number) => IAutoMovieJointPose = (
  flexion: number,
  twist: number,
): IAutoMovieJointPose => ({
  bone: "leftLowerArm",
  flexion,
  abduction: null,
  twist,
});

/**
 * `clampJointRom` moves each angle to the nearest bound of its interval.
 *
 * Scenarios:
 *
 * 1. A zero below the interval 10..90 moves to 10, and 200 moves to 90.
 * 2. Twist 50 moves to 30 and -50 to -30.
 * 3. Angles inside their intervals are unchanged.
 * 4. Under a 100 degree swing cap, a 90/90 corner (swing 120) is scaled to equal
 *    angles f with 2 acos(cos^2(f/2)) = 100, i.e. f = 2 acos(sqrt(cos 50)); a
 *    pose inside the cap is unchanged; a lone flexion 150, with abduction null
 *    or 0, is pulled to 100 and a null axis stays null.
 * 5. A box that excludes neutral keeps its own bound after the cap pull: flexion
 *    10..90 with abduction 90 under a 20 degree cap stays at or above 10, and
 *    the result validates, as does the mirrored max < 0 box.
 * 6. An immobile axis is forced to 0 and the lone flexion is pulled to 100.
 */
export function test_engine_rom_clamp_joint_rom(): void {
  TestValidator.equals(
    "flexion",
    [
      clampJointRom(pose(0, 0), RANGE).flexion,
      clampJointRom(pose(200, 0), RANGE).flexion,
    ],
    [10, 90],
  );
  TestValidator.equals(
    "twist",
    [
      clampJointRom(pose(45, 50), RANGE).twist,
      clampJointRom(pose(45, -50), RANGE).twist,
    ],
    [30, -30],
  );
  TestValidator.equals(
    "inside",
    clampJointRom(pose(45, 20), RANGE),
    pose(45, 20),
  );
  const cone: IAutoMovieJointConstraint = {
    flexion: { min: -180, max: 180 },
    abduction: { min: -180, max: 180 },
    twist: null,
    swingDeg: 100,
  };
  const swung: (
    flexion: number | null,
    abduction: number | null,
  ) => IAutoMovieJointPose = (
    flexion: number | null,
    abduction: number | null,
  ): IAutoMovieJointPose => ({
    bone: "leftUpperArm",
    flexion,
    abduction,
    twist: null,
  });
  const equal: number =
    (2 * Math.acos(Math.sqrt(Math.cos((50 * Math.PI) / 180))) * 180) / Math.PI;
  const corner: IAutoMovieJointPose = clampJointRom(swung(90, 90), cone);
  TestValidator.predicate(
    "a corner scaled onto the cap",
    nclose(corner.flexion!, equal, CAP) &&
      nclose(corner.abduction!, equal, CAP),
  );
  TestValidator.equals(
    "inside the cap",
    clampJointRom(swung(30, 30), cone),
    swung(30, 30),
  );
  const resting: IAutoMovieJointPose = clampJointRom(swung(150, null), cone);
  const zero: IAutoMovieJointPose = clampJointRom(swung(150, 0), cone);
  TestValidator.predicate(
    "a lone axis past the cap",
    nclose(resting.flexion!, 100, CAP) &&
      resting.abduction === null &&
      nclose(zero.flexion!, 100, CAP),
  );
  const valid: (
    joint: IAutoMovieJointPose,
    constraint: IAutoMovieJointConstraint,
  ) => boolean = (
    joint: IAutoMovieJointPose,
    constraint: IAutoMovieJointConstraint,
  ): boolean => {
    const collector: ViolationCollector = new ViolationCollector();
    validateJointRom({ joint, constraint, path: "$input", collector });
    return collector.items.length === 0;
  };
  const above: IAutoMovieJointConstraint = {
    flexion: { min: 10, max: 90 },
    abduction: { min: -90, max: 90 },
    twist: null,
    swingDeg: 20,
  };
  const below: IAutoMovieJointConstraint = {
    flexion: { min: -90, max: 90 },
    abduction: { min: -90, max: -10 },
    twist: null,
    swingDeg: 20,
  };
  const pulledAbove: IAutoMovieJointPose = clampJointRom(swung(10, 90), above);
  const pulledBelow: IAutoMovieJointPose = clampJointRom(swung(90, -10), below);
  TestValidator.predicate(
    "boxes that exclude neutral",
    pulledAbove.flexion! >= 10 - CAP &&
      valid(pulledAbove, above) &&
      pulledBelow.abduction! <= -10 + CAP &&
      valid(pulledBelow, below),
  );
  const hinge: IAutoMovieJointPose = clampJointRom(swung(150, 30), {
    flexion: { min: -180, max: 180 },
    abduction: null,
    twist: null,
    swingDeg: 100,
  });
  TestValidator.predicate(
    "an immobile axis",
    nclose(hinge.abduction!, 0, CAP) && nclose(hinge.flexion!, 100, CAP),
  );
}
