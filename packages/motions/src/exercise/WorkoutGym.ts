import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";

/**
 * The gym's standing movements of the workout law: free-weight exercises a
 * programme names beside the ones the other tables hold, shown here without
 * their load unless the author names one (`load`): the bent-over row, the
 * curl, the overhead triceps extension, the lateral and the front raise,
 * the shrug, the calf raise, the front and the goblet squat, the split squat, the wall
 * sit, the Romanian deadlift, the good morning, and the power clean and the
 * snatch as their phases. The floor exercises and the dip are
 * `WorkoutBodyweight`'s.
 *
 * Every angle is provisional, read off the exercise's usual description
 * (NSCA's Essentials of Strength Training and Conditioning, 4th ed.,
 * exercise technique chapters); none is a measured value.
 *
 * First pass: no bar, dumbbell or bell is held, so a hand's place is what
 * the arm's angles give; the wall of a wall sit is a place, not a prop; the
 * clean and the snatch show their positions in
 * order at a keyed tempo, not the bar's flight; a step-up, an incline or
 * decline push-up and a hip thrust are `WorkoutEquipment`'s (they need a
 * box or bench under a hand, a foot or the back).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, the sources and that the angles are provisional, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres.
 */
export namespace WorkoutGym {
  /** A squat's bottom: the trunk pitched, the knees bent over shanks that lean, with the arms as given. */
  const squat = (
    pitch: number,
    knee: number,
    shank: number,
    arms: ExerciseKey.ILimb,
  ): ExerciseKey.IKey =>
    ExerciseKey.of(
      { pitch, neck: -10 },
      { ...ExerciseKey.stood(pitch, knee, shank), ...arms },
    );

  /** A standing kind on both feet whose repetition goes between two keys. */
  const pair = (
    reps: number,
    low: readonly [ExerciseKey.IKey, number, string, string],
    high: readonly [ExerciseKey.IKey, number, string, string],
  ): WorkoutKind =>
    WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      0.8,
      reps,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(low[0], low[1], low[2], low[3]),
        WorkoutKind.step(high[0], high[1], high[2], high[3]),
      ],
    );

  /** The exercises' names. */
  export type Name =
    | "bentOverRow"
    | "curl"
    | "tricepsExtension"
    | "lateralRaise"
    | "frontRaise"
    | "shrug"
    | "calfRaise"
    | "frontSquat"
    | "gobletSquat"
    | "splitSquat"
    | "wallSit"
    | "romanianDeadlift"
    | "goodMorning"
    | "powerClean"
    | "snatch";

  /** The exercises. */
  export const KINDS: Readonly<Record<Name, WorkoutKind>> = {
    /** A bent-over row: the trunk held at 60 degrees, the elbows drawn back past it. */
    bentOverRow: pair(
      5,
      [
        squat(60, 20, 8, { shoulder: 60, raise: 0, elbow: 3 }),
        1.2,
        "lower",
        "hang",
      ],
      [
        squat(60, 20, 8, { shoulder: 15, raise: 10, elbow: 110 }),
        0.9,
        "row",
        "top",
      ],
    ),

    /** A curl: the elbows bent from straight to full, the upper arms still. */
    curl: pair(
      5,
      [ExerciseKey.of({}, { raise: 5, elbow: 5, twist: 0 }), 1.2, "lower", "down"],
      [ExerciseKey.of({}, { raise: 5, elbow: 140 }), 0.9, "curl", "top"],
    ),

    /** An overhead triceps extension: the upper arms beside the head, the elbows straightened. */
    tricepsExtension: pair(
      5,
      [
        ExerciseKey.of({}, { shoulder: 172, raise: 0, elbow: 135 }),
        1.2,
        "lower",
        "bottom",
      ],
      [
        ExerciseKey.of({}, { shoulder: 172, raise: 0, elbow: 5 }),
        0.9,
        "extend",
        "lockout",
      ],
    ),

    /** A lateral raise: the arms lifted out to the shoulders' height. */
    lateralRaise: pair(
      5,
      [ExerciseKey.of({}, { raise: 8, elbow: 10 }), 1.2, "lower", "down"],
      [ExerciseKey.of({}, { raise: 88, elbow: 10 }), 0.9, "raise", "top"],
    ),

    /** A front raise: the arms lifted forward to the shoulders' height. */
    frontRaise: pair(
      5,
      [ExerciseKey.of({}, { raise: 3, elbow: 5 }), 1.2, "lower", "down"],
      [
        ExerciseKey.of({}, { shoulder: 88, raise: 3, elbow: 5 }),
        0.9,
        "raise",
        "top",
      ],
    ),

    /** A shrug: the shoulder girdles lifted 20 degrees toward the ears and lowered, the arms hanging (provisional). */
    shrug: pair(
      8,
      [ExerciseKey.of({}, { elbow: 5 }), 0.8, "lower", "down"],
      [ExerciseKey.of({}, { elbow: 5, shrug: 20 }), 0.6, "shrug", "top"],
    ),
    /** A calf raise: both heels lifted over the toes' joints, which stay. */
    calfRaise: WorkoutStance.of(
      ["leftToes", "rightToes"],
      WorkoutStance.FEET,
      0,
      8,
      (): WorkoutKind.IStep[] => [
        WorkoutStance.rest(0.8),
        WorkoutKind.step(
          ExerciseKey.of({}, { ankle: -30, toes: 30 }),
          0.6,
          "raise",
          "top",
          0.3,
        ),
      ],
      false,
      true,
    ),

    /** A front squat: the hands at the shoulders with the elbows high, the trunk more upright than a back squat's. */
    frontSquat: pair(
      5,
      [
        ExerciseKey.of({}, { shoulder: 85, raise: 5, elbow: 145 }),
        1.2,
        "rise",
        "top",
      ],
      [
        squat(20, 120, 35, { shoulder: 85, raise: 5, elbow: 145 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

    /** A goblet squat: both hands before the chest. */
    gobletSquat: pair(
      5,
      [
        ExerciseKey.of({}, { shoulder: 35, raise: 5, elbow: 135 }),
        1.2,
        "rise",
        "top",
      ],
      [
        squat(25, 120, 33, { shoulder: 35, raise: 5, elbow: 135 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

    /** A split squat: a split stance lowered and raised, the feet where the stance put them. */
    splitSquat: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1.2,
      5,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          WorkoutStance.stride(body, 22, {}, { elbow: 20 }),
          1,
          "rise",
          "top",
        ),
        WorkoutKind.step(
          WorkoutStance.stride(body, 40, {}, { elbow: 20 }),
          1.5,
          "lower",
          "bottom",
        ),
      ],
      false,
      true,
    ),

    /** A wall sit: the thighs level over upright shanks, the trunk upright, held 30 s. */
    wallSit: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1.5,
      1,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.pose(squat(0, 90, 0, { elbow: 10 }), 0, 30),
      ],
    ),

    /** A Romanian deadlift: a hinge to 60 degrees over soft knees, the arms hanging. */
    romanianDeadlift: {
      midfoot: true,
      ...pair(
        5,
        [ExerciseKey.of({}, { elbow: 3 }), 1.2, "rise", "top"],
        [
          squat(60, 15, 5, { shoulder: 60, raise: 0, elbow: 3 }),
          1.8,
          "lower",
          "bottom",
        ],
      ),
    },

    /** A good morning: the same hinge with the hands behind the head. */
    goodMorning: pair(
      5,
      [
        ExerciseKey.of({}, { shoulder: 20, raise: 80, elbow: 140 }),
        1.2,
        "rise",
        "top",
      ],
      [
        squat(65, 15, 5, { shoulder: 20, raise: 80, elbow: 140 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

    /** A power clean as its positions: the start over the bar, the full extension on the toes, the catch in a quarter squat with the hands at the shoulders, and standing up with them. */
    powerClean: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1,
      1,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          squat(65, 75, 25, { shoulder: 65, raise: 0, elbow: 3 }),
          1,
          "set",
          "start",
          0.3,
        ),
        WorkoutKind.step(
          ExerciseKey.of({ pitch: -5 }, { hip: -5, ankle: -15, elbow: 3 }),
          0.45,
          "pull",
          "extension",
        ),
        WorkoutKind.step(
          squat(10, 55, 18, { shoulder: 85, raise: 5, elbow: 145 }),
          0.3,
          "turnOver",
          "catch",
          0.2,
        ),
        WorkoutKind.step(
          ExerciseKey.of({}, { shoulder: 85, raise: 5, elbow: 145 }),
          0.8,
          "recover",
          "rack",
          0.5,
        ),
      ],
    ),

    /** A snatch as its positions: the wide start, the full extension, the catch in an overhead squat, and standing up under the locked arms. */
    snatch: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1,
      1,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          squat(60, 85, 28, { shoulder: 60, raise: 30, elbow: 3 }),
          1,
          "set",
          "start",
          0.3,
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -5 },
            { hip: -5, ankle: -15, raise: 30, elbow: 3 },
          ),
          0.45,
          "pull",
          "extension",
        ),
        WorkoutKind.step(
          squat(15, 115, 32, { shoulder: 165, raise: 30, elbow: 3 }),
          0.35,
          "turnOver",
          "catch",
          0.3,
        ),
        WorkoutKind.step(
          ExerciseKey.of({}, { shoulder: 172, raise: 30, elbow: 3 }),
          1,
          "recover",
          "overhead",
          0.5,
        ),
      ],
    ),
  };
}
