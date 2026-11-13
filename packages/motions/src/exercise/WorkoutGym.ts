import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";

/**
 * The gym's remaining movements of the workout law: free-weight and
 * bodyweight exercises a programme names beside the ones the other tables
 * hold, shown here without their load. Standing: the bent-over row, the
 * curl, the overhead triceps extension, the lateral and the front raise,
 * the calf raise, the front and the goblet squat, the split squat, the wall
 * sit, the Romanian deadlift, the good morning, and the power clean and the
 * snatch as their phases. On the floor: the pike push-up, the superman, the
 * bird dog, the lying leg raise, the bicycle crunch, the Russian twist and
 * the dead bug. On two bars at the hips' height: the dip.
 *
 * Every angle is provisional, read off the exercise's usual description
 * (NSCA's Essentials of Strength Training and Conditioning, 4th ed.,
 * exercise technique chapters, for the lifts; ACSM's Guidelines, 11th ed.,
 * for the bodyweight exercises); none is a measured value.
 *
 * First pass: no bar, dumbbell or bell is held, so a hand's place is what
 * the arm's angles give; the wall of a wall sit and the bars of a dip are
 * places, not props; the clean and the snatch show their positions in
 * order at a keyed tempo, not the bar's flight; a shrug, a step-up, a box
 * jump, an incline or decline push-up and a hip thrust are not here (they
 * need the shoulder girdle's lift or a box or bench under a hand, a foot or
 * the back).
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

  /** Lying on the back with the arms by the sides. */
  const supine: ExerciseKey.IKey = ExerciseKey.of(
    { pitch: -90 },
    { ankle: -20, elbow: 5 },
  );

  /** A kind done lying or sitting on the floor, the pelvis kept. */
  const floor = (
    base: WorkoutKind["base"],
    supports: readonly WorkoutKind.ISupport[],
    reps: number,
    route: WorkoutKind["route"],
    alternate: boolean = false,
  ): WorkoutKind => ({
    base,
    anchor: "hips",
    pin: ["leftUpperLeg", "rightUpperLeg"],
    supports,
    alternate,
    enter: 2.4,
    reps,
    route,
  });

  /** The back bears. */
  const BACK: readonly WorkoutKind.ISupport[] = [{ part: "back", kind: "lie" }];

  /** The exercises' names. */
  export type Name =
    | "bentOverRow"
    | "curl"
    | "tricepsExtension"
    | "lateralRaise"
    | "frontRaise"
    | "calfRaise"
    | "frontSquat"
    | "gobletSquat"
    | "splitSquat"
    | "wallSit"
    | "romanianDeadlift"
    | "goodMorning"
    | "powerClean"
    | "snatch"
    | "pikePushUp"
    | "superman"
    | "birdDog"
    | "lyingLegRaise"
    | "bicycleCrunch"
    | "russianTwist"
    | "deadBug"
    | "dip";

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
    romanianDeadlift: pair(
      5,
      [ExerciseKey.of({}, { elbow: 3 }), 1.2, "rise", "top"],
      [
        squat(60, 15, 5, { shoulder: 60, raise: 0, elbow: 3 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

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

    /** A pike push-up: from the hips-high support on the hands and feet, the head lowered between the hands. */
    pikePushUp: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
      ],
      enter: 2,
      reps: 5,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 140, neck: 10 },
            { hip: 105, ankle: 35, shoulder: 175, elbow: 3, wrist: -50 },
          ),
          1,
          "press",
          "top",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 150, neck: 10 },
            { hip: 115, ankle: 35, shoulder: 150, elbow: 95, wrist: -50 },
          ),
          1.2,
          "lower",
          "bottom",
        ),
      ],
    },

    /** A superman: lying face down, the arms ahead and the legs lifted off the floor together. */
    superman: floor("lying", BACK, 5, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 88 },
          { ankle: -45, shoulder: 170, raise: 10, elbow: 5 },
        ),
        1,
        "lower",
        "down",
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 88, spine: [-12, 0, 0], chest: [-12, 0, 0], neck: -15 },
          { hip: -15, ankle: -45, shoulder: 185, raise: 10, elbow: 5 },
        ),
        1,
        "lift",
        "top",
        1,
      ),
    ]),

    /** A bird dog: on hands and knees, one arm and the opposite leg reached level, alternating. */
    birdDog: {
      base: "kneeling",
      anchor: "hips",
      pin: ["leftLowerLeg", "rightLowerLeg"],
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
      ],
      alternate: true,
      enter: 2.4,
      reps: 6,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 85, neck: -30 },
            { hip: 85, knee: 95, ankle: -40, shoulder: 85, elbow: 3 },
          ),
          1,
          "lower",
          "kneeling",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 85, neck: -30 },
            { hip: 85, knee: 95, ankle: -40, shoulder: 85, elbow: 3 },
            { hip: 0, knee: 5 },
            { shoulder: 175 },
          ),
          1,
          "reach",
          "level",
          1,
        ),
      ],
    },

    /** A lying leg raise: on the back, both straight legs raised to upright and lowered. */
    lyingLegRaise: floor("lying", BACK, 6, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(supine, 1.5, "lower", "down"),
      WorkoutKind.step(
        ExerciseKey.of({ pitch: -90 }, { hip: 88, ankle: -20, elbow: 5 }),
        1.2,
        "raise",
        "top",
      ),
    ]),

    /** A bicycle crunch: on the back, one knee drawn in as the opposite shoulder turns to it, alternating. */
    bicycleCrunch: floor(
      "lying",
      BACK,
      8,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90, chest: [15, 0, 0], neck: 15 },
            { hip: 40, knee: 20, shoulder: 60, raise: 60, elbow: 140 },
          ),
          0.5,
          "open",
          "extended",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90, spine: [15, 0, 25], chest: [20, 0, 20], neck: 15 },
            { hip: 40, knee: 20, shoulder: 60, raise: 60, elbow: 140 },
            {},
            { hip: 100, knee: 110 },
          ),
          0.5,
          "crunch",
          "kneeIn",
        ),
      ],
      true,
    ),

    /** A Russian twist: sitting leaned back with the knees bent, the trunk turned to each side in turn. */
    russianTwist: floor(
      "seated",
      [{ part: "seat", kind: "seat" }],
      8,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -35 },
            { hip: 85, knee: 80, ankle: -10, shoulder: 45, elbow: 90 },
          ),
          0.5,
          "centre",
          "middle",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -35, spine: [0, 0, 25], chest: [0, 0, 20] },
            { hip: 85, knee: 80, ankle: -10, shoulder: 45, elbow: 90 },
          ),
          0.5,
          "twist",
          "side",
        ),
      ],
      true,
    ),

    /** A dead bug: on the back with the arms up and the hips and knees square, one arm and the opposite leg lowered, alternating. */
    deadBug: floor(
      "lying",
      BACK,
      6,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90 },
            { hip: 90, knee: 90, shoulder: 90, raise: 0, elbow: 3 },
          ),
          1,
          "gather",
          "square",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90 },
            { hip: 90, knee: 90, shoulder: 90, raise: 0, elbow: 3 },
            { hip: 10, knee: 5 },
            { shoulder: 175 },
          ),
          1.2,
          "lower",
          "long",
          0.5,
        ),
      ],
      true,
    ),

    /** A dip on two bars at the hips' height: the body lowered between the hands until the upper arms are level, and pressed up. */
    dip: {
      base: "hanging",
      anchor: "bar",
      pin: ["leftHand", "rightHand"],
      supports: [
        { part: "leftHand", kind: "grip" },
        { part: "rightHand", kind: "grip" },
      ],
      enter: 1,
      reps: 5,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of({}, { knee: 70, raise: 8, elbow: 3 }),
          1,
          "press",
          "top",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 15 },
            { hip: 15, knee: 70, shoulder: -60, raise: 8, elbow: 95 },
          ),
          1.3,
          "lower",
          "bottom",
        ),
      ],
    },
  };
}
