import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The bodyweight movements of the workout law a gym programme names beside
 * the ones the other tables hold. On the floor: the pike push-up, the
 * superman, the bird dog, the lying leg raise, the bicycle crunch, the
 * Russian twist and the dead bug. On two bars at the hips' height: the dip.
 *
 * Every angle is provisional, read off the exercise's usual description
 * (ACSM's Guidelines, 11th ed.; NSCA's Essentials of Strength Training and
 * Conditioning, 4th ed., for the dip); none is a measured value.
 *
 * First pass: the bars of a dip are places unless the author names a prop
 * (`on`); a bird dog's hands are kept by the angles alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, the sources and that the angles are provisional, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres.
 */
export namespace WorkoutBodyweight {
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
