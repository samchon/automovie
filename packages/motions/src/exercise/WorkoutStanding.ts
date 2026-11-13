import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";

/**
 * The standing lifts and warm-up drills of the workout law (#3378): lifts
 * shown without their load (deadlift, back squat, kettlebell swing,
 * overhead press) and drills (arm circles, leg swings, butt kicks, the
 * B-skip, the skipping rope's hops).
 *
 * The feet stay where they stand: a key's legs are written by
 * `ExerciseKey.stood`, which keeps a foot level under a pitched trunk. A
 * drill that lifts a foot pins the pelvis or the standing foot instead.
 * Every stated angle is provisional, read off the exercise's usual
 * description (ACSM's Guidelines, 11th ed.; NSCA's Essentials of Strength
 * Training, 4th ed.).
 *
 * First pass: no bar, bell or rope is held or moved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what keeps the feet, what is provisional with its sources and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres; a hop is a share of the stature.
 */
export namespace WorkoutStanding {
  /** The exercises' names. */
  export type Name =
    | "deadlift"
    | "backSquat"
    | "kettlebellSwing"
    | "overheadPress"
    | "armCircles"
    | "legSwings"
    | "buttKicks"
    | "bSkip"
    | "jumpRope";

  /** The exercises. */
  export const KINDS: Readonly<Record<Name, WorkoutKind>> = {
    /** A deadlift: from standing down to the bar's height at the shins, the trunk at 70 degrees over knees bent 75, the arms hanging, and back. */
    deadlift: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0, 5, (): WorkoutKind.IStep[] => [
      WorkoutStance.rest(1.2),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 70, neck: -25 },
          { ...ExerciseKey.stood(70, 75, 25), shoulder: 70, elbow: 3 },
        ),
        1.5,
        "lower",
        "bottom",
      ),
    ]),

    /** A back squat: the hands at the shoulders, down to a level thigh and up. */
    backSquat: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0.8, 5, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 20, raise: 60, elbow: 140 }),
        1.2,
        "rise",
        "top",
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 35, neck: -10 },
          {
            ...ExerciseKey.stood(35, 115, 30),
            shoulder: 20,
            raise: 60,
            elbow: 140,
          },
        ),
        1.8,
        "lower",
        "bottom",
      ),
    ]),

    /** A kettlebell swing: from the hinge with the arms between the legs to standing with the arms level. */
    kettlebellSwing: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0.8, 8, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 50, neck: -20 },
          {
            ...ExerciseKey.stood(50, 30, 10),
            shoulder: 25,
            raise: 0,
            elbow: 3,
          },
        ),
        0.5,
        "drop",
        "back",
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: -3 },
          { hip: -3, shoulder: 87, raise: 0, elbow: 3 },
        ),
        0.4,
        "swing",
        "float",
      ),
    ]),

    /** An overhead press: from the hands at the shoulders to the arms locked out overhead. */
    overheadPress: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0.8, 5, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 70, raise: 20, elbow: 140 }),
        1,
        "lower",
        "rack",
      ),
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 178, raise: 0, elbow: 3 }),
        1,
        "press",
        "lockout",
      ),
    ]),

    /** Arm circles: both straight arms forward, overhead, out to the side and down. */
    armCircles: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0.3, 5, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(
        ExerciseKey.of({}, { elbow: 3 }),
        0.35,
        "lower",
        "down",
      ),
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 90, elbow: 3 }),
        0.35,
        "lift",
        "front",
      ),
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 175, elbow: 3 }),
        0.35,
        "raise",
        "up",
      ),
      WorkoutKind.step(
        ExerciseKey.of({}, { raise: 90, elbow: 3 }),
        0.35,
        "open",
        "side",
      ),
    ]),

    /** Leg swings: the right leg swung forward and back over the standing left foot. */
    legSwings: WorkoutStance.of(["leftFoot"], WorkoutStance.LEFT, 0, 6, (): WorkoutKind.IStep[] => [
      WorkoutStance.rest(0.4),
      WorkoutKind.step(
        ExerciseKey.of({}, {}, {}, { hip: 60, knee: 5 }),
        0.4,
        "swing",
        "front",
      ),
      WorkoutKind.step(
        ExerciseKey.of({ pitch: 5 }, {}, { hip: 5 }, { hip: -15, knee: 15 }),
        0.5,
        "swingBack",
        "behind",
      ),
    ]),

    /** Butt kicks in place: one heel brought to the seat, alternating. */
    buttKicks: WorkoutStance.of(
      ["hips"],
      [],
      0,
      8,
      (): WorkoutKind.IStep[] => [
        WorkoutStance.rest(0.2),
        WorkoutKind.step(
          ExerciseKey.of({}, { elbow: 80 }, {}, { knee: 120 }),
          0.2,
          "kick",
          "heelUp",
        ),
      ],
      true,
    ),

    /** The B-skip in place: the knee driven up and the shank reached forward, alternating. */
    bSkip: WorkoutStance.of(
      ["hips"],
      [],
      0,
      6,
      (): WorkoutKind.IStep[] => [
        WorkoutStance.rest(0.25),
        WorkoutKind.step(
          ExerciseKey.of({}, { elbow: 80 }, {}, { hip: 90, knee: 90 }),
          0.25,
          "drive",
          "kneeUp",
        ),
        WorkoutKind.step(
          ExerciseKey.of({}, { elbow: 80 }, {}, { hip: 70, knee: 10 }),
          0.15,
          "extend",
          "reach",
        ),
      ],
      true,
    ),

    /** A skipping rope's hops: both feet off the floor by 3 % of the stature (provisional), the elbows at the sides. */
    jumpRope: WorkoutStance.of(["hips"], [], 0.3, 10, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(
        ExerciseKey.of({}, { raise: 15, elbow: 80 }),
        0.15,
        "land",
        "landed",
      ),
      WorkoutKind.step(
        ExerciseKey.of({ lift: 0.03 }, { ankle: -25, raise: 15, elbow: 80 }),
        0.15,
        "hop",
        "airborne",
      ),
    ]),
  };
}
