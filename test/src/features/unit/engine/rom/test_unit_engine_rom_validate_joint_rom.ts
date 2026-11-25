import {
  ViolationCollector,
  compareCodeUnits,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The swing metric is a trigonometric closed form, to rounding. */
const SWING: number = 1e-9;

/** Overshoots are differences of whole degrees. */
const EXACT: number = 0;

/** Flexion 0..150, twist -30..30 and an immobile abduction. */
const ELBOW: IAutoMovieJointConstraint = {
  flexion: { min: 0, max: 150 },
  abduction: null,
  twist: { min: -30, max: 30 },
};

/** A joint pose with null for each omitted axis. */
const pose: (
  axes: Partial<Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">>,
) => IAutoMovieJointPose = (
  axes: Partial<Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">>,
): IAutoMovieJointPose => ({
  bone: "leftLowerArm",
  flexion: axes.flexion ?? null,
  abduction: axes.abduction ?? null,
  twist: axes.twist ?? null,
});

/** The violations of one pose against a constraint. */
const faults: (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
) => IAutoMovieConstraintViolation[] = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
): IAutoMovieConstraintViolation[] => {
  const collector: ViolationCollector = new ViolationCollector();
  validateJointRom({ joint, constraint, path: "$input", collector });
  return collector.items;
};

/**
 * `validateJointRom` files a violation for each axis outside its interval, with
 * the degrees past the nearest bound as the overshoot.
 *
 * Scenarios:
 *
 * 1. Flexion 90 inside 0..150, and null axes, file nothing.
 * 2. Flexion 175 files one fault at `$input.flexion`, overshoot 175 - 150 = 25.
 * 3. Flexion -10 files one fault, overshoot 0 - (-10) = 10.
 * 4. An immobile axis (null interval) at 20 files one fault, overshoot 20; at 0 it
 *    files nothing.
 * 5. A zero outside the interval 10..90 is a fault.
 * 6. Flexion 999 and twist 999 file exactly the flexion and twist paths.
 * 7. A 100 degree swing cap on wide axes: a 90/90 corner has swing 120 and files
 *    one `swing` fault, overshoot 20; 30/30, a lone abduction 50 and a lone
 *    flexion 50 file nothing; a lone flexion 150 files one fault whether the
 *    other axis is null or an explicit 0.
 * 8. The default shoulder read without its swing-twist gate at flexion 999 and
 *    twist 999 files exactly the flexion, swing and twist paths; with the
 *    table's gate, a hanging arm turned 170 degrees (past the 135 allowed from
 *    rest) files exactly a twist fault.
 */
export function test_unit_engine_rom_validate_joint_rom(): void {
  TestValidator.equals(
    "inside the interval",
    [faults(pose({ flexion: 90 }), ELBOW), faults(pose({}), ELBOW)].map(
      (items: IAutoMovieConstraintViolation[]): number => items.length,
    ),
    [0, 0],
  );
  const over: IAutoMovieConstraintViolation[] = faults(
    pose({ flexion: 175 }),
    ELBOW,
  );
  TestValidator.predicate(
    "past the maximum",
    over.length === 1 &&
      over[0]!.path === "$input.flexion" &&
      nclose(over[0]!.overshoot!, 25, EXACT),
  );
  const under: IAutoMovieConstraintViolation[] = faults(
    pose({ flexion: -10 }),
    ELBOW,
  );
  TestValidator.predicate(
    "below the minimum",
    under.length === 1 && nclose(under[0]!.overshoot!, 10, EXACT),
  );
  const immobile: IAutoMovieConstraintViolation[] = faults(
    pose({ abduction: 20 }),
    ELBOW,
  );
  TestValidator.predicate(
    "an immobile axis",
    immobile.length === 1 &&
      immobile[0]!.path === "$input.abduction" &&
      nclose(immobile[0]!.overshoot!, 20, EXACT) &&
      faults(pose({ abduction: 0 }), ELBOW).length === 0,
  );
  const excluded: IAutoMovieConstraintViolation[] = faults(
    pose({ flexion: 0 }),
    { ...ELBOW, flexion: { min: 10, max: 90 } },
  );
  TestValidator.predicate(
    "a zero outside the interval",
    excluded.length === 1 &&
      excluded[0]!.kind === "rom" &&
      excluded[0]!.path === "$input.flexion",
  );
  TestValidator.equals(
    "two bad axes",
    faults(pose({ flexion: 999, twist: 999 }), ELBOW)
      .map((item: IAutoMovieConstraintViolation): string => item.path)
      .sort(compareCodeUnits),
    ["$input.flexion", "$input.twist"],
  );
  const cone: IAutoMovieJointConstraint = {
    flexion: { min: -180, max: 180 },
    abduction: { min: -180, max: 180 },
    twist: null,
    swingDeg: 100,
  };
  const corner: IAutoMovieConstraintViolation[] = faults(
    pose({ flexion: 90, abduction: 90 }),
    cone,
  );
  TestValidator.predicate(
    "a corner past the cap",
    corner.length === 1 &&
      corner[0]!.path === "$input.swing" &&
      nclose(corner[0]!.overshoot!, 20, SWING),
  );
  TestValidator.equals(
    "inside the cap",
    [
      faults(pose({ flexion: 30, abduction: 30 }), cone),
      faults(pose({ abduction: 50 }), cone),
      faults(pose({ flexion: 50 }), cone),
    ].map((items: IAutoMovieConstraintViolation[]): number => items.length),
    [0, 0, 0],
  );
  const resting: IAutoMovieConstraintViolation[] = faults(
    pose({ flexion: 150 }),
    cone,
  );
  const zero: IAutoMovieConstraintViolation[] = faults(
    pose({ flexion: 150, abduction: 0 }),
    cone,
  );
  TestValidator.predicate(
    "a resting axis reads as zero",
    resting.length === 1 &&
      zero.length === 1 &&
      resting[0]!.path === zero[0]!.path &&
      nclose(resting[0]!.overshoot!, zero[0]!.overshoot!, EXACT),
  );
  const shoulder: IAutoMovieJointConstraint = getConstraint(
    "leftUpperArm",
    null,
  )!;
  const upper: (
    axes: Partial<Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">>,
  ) => IAutoMovieJointPose = (
    axes: Partial<Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">>,
  ): IAutoMovieJointPose => ({ ...pose(axes), bone: "leftUpperArm" });
  TestValidator.equals(
    "each bad axis and the swing file their own",
    faults(upper({ flexion: 999, twist: 999 }), {
      ...shoulder,
      swingTwist: null,
    })
      .map((item: IAutoMovieConstraintViolation): string => item.path)
      .sort(compareCodeUnits),
    ["$input.flexion", "$input.swing", "$input.twist"],
  );
  TestValidator.equals(
    "a hanging arm turned 170 degrees",
    faults(upper({ flexion: 0, abduction: 0, twist: 170 }), shoulder).map(
      (item: IAutoMovieConstraintViolation): string => item.path,
    ),
    ["$input.twist"],
  );
}
