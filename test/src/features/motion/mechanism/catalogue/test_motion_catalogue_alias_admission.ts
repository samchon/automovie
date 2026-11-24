import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanWorkoutGym,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  AutoMovieMotionHumanWorkout,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { everydayTake } from "../../../internal/everydayTake";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * The public sport catalogue resolves exercise, dance, swimming and ball
 * techniques to their authored law parameters.
 *
 * Scenarios:
 *
 * 1. Each authored name occurs exactly once in the public catalogue and identifies
 *    its expected law.
 * 2. Each named technique fixes its intended kind even if the caller supplies
 *    another kind.
 * 3. An alias without a fixed kind forwards the caller's parameters.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public catalogue, its lookup and its fixed-parameter contract.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the resolver registered under each public name.
 * @evidence contracts/development/testing.md#independent-expectations The table pairs each authored technique with its underlying action and kind.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers fixed-kind rows and parameter-transparent rows, including kinds whose spelling differs from the public name.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public catalogue in memory and needs no performer or host.
 */
export function test_motion_catalogue_alias_admission(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    checkSupportRoles(checks);
  } catch (error: unknown) {
    checks.check(`checkSupportRoles: ${everydayTake.describe(error)}`, false);
  }
  try {
    checkWorkoutRoutes(checks);
  } catch (error: unknown) {
    checks.check(`checkWorkoutRoutes: ${everydayTake.describe(error)}`, false);
  }
  for (const rows of Object.values(HUMAN_LEXICON)) {
    try {
      for (const row of rows) {
        if (row.resolve === undefined) continue;
        const fixed: object = row.resolve({});
        const conflicts: Record<string, unknown> = Object.fromEntries(
          Object.keys(fixed).map((key: string) => [key, null]),
        );
        const input = Object.freeze({ ...conflicts, callerArgument: row.name });
        checks.equals(
          row.name + " fixed assignments override caller values",
          row.resolve(input),
          { ...fixed, callerArgument: row.name },
        );
        checks.equals(
          row.name + " default remains independent",
          row.resolve({}),
          fixed,
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(rows)}: ${everydayTake.describe(error)}`, false);
    }
  }
  const bindings: readonly Binding[] = [
    ["stance", "handsOnHips", "rest", { left: "hip", right: "hip" }],
    ["stance", "thinking", "rest", { left: "elbowSupport", right: "chinRest" }],
    ["manipulate", "fret", "manipulate", { hand: "left" }],
    [
      "manipulate",
      "thumbText",
      "manipulate",
      { hand: "right", digit: "thumb" },
    ],
    ["sport", "childsPose", "kneel", { kind: "sitBack", hold: 10 }],
    [
      "sport",
      "toeTouch",
      "bend",
      { target: { kind: "self", region: "footTopRight" }, hold: 20 },
    ],
    ["sportGym", "curl", "workout", { kind: "curl" }],
  ];
  for (const [category, name, family, fixed] of bindings) {
    try {
      const row = HUMAN_LEXICON[category]?.find((law) => law.name === name);
      checks.equals(name + " named owner", row?.family, family);
      checks.equals(
        name + " authored fixed parameters",
        row?.resolve?.({}),
        fixed,
      );
    } catch (error: unknown) {
      checks.check(
        `${String(category)} ${String(name)} ${String(family)} ${String(fixed)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  const techniques: readonly Technique[] = [
    ["lunges", "exercise", "lunge"],
    ["highKnees", "exercise", "highKnees"],
    ["neckStretch", "stretch", "neckSide"],
    ["shoulderStretch", "stretch", "crossBody"],
    ["sideStretch", "stretch", "overheadSide"],
    ["quadStretch", "stretch", "quadriceps"],
    ["treePose", "stretch", "tree"],
    ["bounce", "dance", "bounce"],
    ["stepTouch", "dance", "stepTouch"],
    ["boxStep", "dance", "boxStep"],
    ["treadWater", "swim", "treadWater"],
    ["frontCrawl", "swim", "frontCrawl"],
    ["sprintStart", "athletics"],
    ["handstand", "gymnastics"],
    ["horseStance", "martialArt", "horseStance"],
    ["karatePunches", "martialArt", "chokuZuki"],
    ["taiChiPush", "martialArt", "taiChiPush"],
    ["dribble", "ballSport", "dribble"],
    ["volleyDig", "ballSport", "dig"],
    ["volleySet", "ballSport", "set"],
    ["throwIn", "ballSport", "throwIn"],
    ["catcherCrouch", "baseball", "catcherCrouch"],
    ["fieldGrounder", "baseball", "groundBall"],
    ["battingStance", "baseball", "battingStance"],
    ["readyPosition", "racket", "readyPosition"],
    ["splitStep", "racket", "splitStep"],
    ["golfAddress", "racket", "golfAddress"],
  ];
  const catalogue: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    HUMAN_LEXICON.sport!;
  const byName: Map<string, IAutoMovieMotionHumanActionLaw<never>> = new Map();
  for (const row of catalogue) {
    try {
      byName.set(row.name, row);
    } catch (error: unknown) {
      checks.check(`${String(row)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.equals("sport names are unique", byName.size, catalogue.length);
  for (const [name, family, kind] of techniques) {
    try {
      const row: IAutoMovieMotionHumanActionLaw<never> | undefined =
        byName.get(name);
      checks.equals(name, row?.family, family);
      checks.equals(
        name + " default parameters",
        row?.resolve?.({}),
        kind === undefined ? {} : { kind },
      );
      checks.equals(
        `${name} resolves the authored parameters`,
        row?.resolve?.({ kind: "caller" }),
        { kind: kind ?? "caller" },
      );
    } catch (error: unknown) {
      checks.check(
        `${String(name)} ${String(family)} ${String(kind)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("catalogue alias admission");
}

/** Public name, underlying action and the kind fixed by this alias, if any. */
type Technique = readonly [string, string, string?];

/** Catalogue category, authored name, owning law and declared fixed arguments. */
type Binding = readonly [string, string, string, object];

/**
 * Check both helpers and the supported actor before a performance binds their
 * bodies.
 */
function checkSupportRoles(checks: motionComplaints.IGatherer): void {
  const law = AutoMovieMotionHumanCarryPerson.HumanCoupled.supportWalk;
  const cast = {
    helper: "left escort",
    second: "right escort",
    helped: "walker",
  };
  const expected = [
    {
      name: "bearing",
      params: { carry: "supported", of: cast.helped, beside: cast.second },
    },
    {
      name: "bearing",
      params: { carry: "supportedLeft", of: cast.helped, beside: cast.helper },
    },
    {
      name: "borne",
      params: { carry: "supported", by: cast.helper, with: cast.second },
    },
  ];
  const ordered = ["helper", "second", "helped"] as const;
  checks.equals(
    "omitted duration leaves timing to each selected law",
    ordered.map((role) => law.act(role, {}, cast)),
    expected,
  );
  const seconds = 2;
  checks.equals(
    "authored duration reaches all three role-specific bindings",
    ordered.map((role) => law.act(role, { duration: seconds }, cast)),
    expected.map((act) => ({ ...act, params: { ...act.params, seconds } })),
  );
}
/**
 * Check fixed workout kinds against their defining joint and direction on both
 * body sizes.
 */
function checkWorkoutRoutes(checks: motionComplaints.IGatherer): void {
  const movements: readonly Movement[] = [
    ["curl", "rightLowerArm", 0, 1],
    ["tricepsExtension", "rightLowerArm", 0, -1],
    ["lateralRaise", "rightUpperArm", 1, 1],
    ["frontRaise", "rightUpperArm", 0, 1],
    ["shrug", "rightShoulder", 1, 1],
    ["gobletSquat", "rightLowerLeg", 0, 1],
    ["goodMorning", "rightUpperLeg", 0, 1],
  ];
  for (const [name, joint, axis, direction] of movements) {
    const row: IAutoMovieMotionHumanActionLaw<never> | undefined =
      HUMAN_LEXICON.sportGym!.find(
        (entry: IAutoMovieMotionHumanActionLaw<never>): boolean =>
          entry.name === name,
      );
    checks.equals(name + " belongs to workout", row?.family, "workout");
    checks.equals(name + " fixes the named workout", row?.resolve?.({}), {
      kind: name,
    });
    for (const performer of ["m-average", "f-small"] as const) {
      const steps: readonly IAutoMovieMotionHumanWorkoutKind.IStep[] =
        AutoMovieMotionHumanWorkout.WorkoutGym.KINDS[name].route(
          motionHumanBody(performer),
        );
      checks.equals(name + " has two postures", steps.length, 2);
      const initial: number | undefined = steps[0]!.key.joints[joint]?.[axis];
      const final: number | undefined = steps[1]!.key.joints[joint]?.[axis];
      checks.check(
        name + " moves " + joint + " on " + performer,
        initial !== undefined &&
          final !== undefined &&
          (final - initial) * direction > 0,
      );
    }
  }
}
/**
 * Workout, observed anatomical joint, flexion or abduction coordinate, and
 * expected change sign.
 */
type Movement = readonly [
  IAutoMovieMotionHumanWorkoutGym.Name,
  AutoMovieHumanoidBone,
  MovementAxis,
  MovementDirection,
];

/** Flexion or lateral joint axis. */
type MovementAxis = 0 | 1;
/** Direction of the authored movement. */
type MovementDirection = -1 | 1;
