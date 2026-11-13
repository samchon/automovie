import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";

/**
 * The standing poses and single acts of the workout law (#3377, #3378):
 * stretches and yoga poses (calf, chest, triceps, the lunge with a twist,
 * warrior I and II, the triangle, the standing half of a sun salutation),
 * karate's front stance and blocks, a footballer's header and traps, a
 * dancer's turn and closed hold and a thrower's turn.
 *
 * A split stance's front knee and a straddle's straight leg are solved on
 * the body so both feet reach the floor (`WorkoutStance`). Every stated
 * angle is provisional, read off the pose's usual description (ACSM's
 * Guidelines, 11th ed., for the stretches; Iyengar, Light on Yoga, for the
 * poses; Nakayama, Dynamic Karate, for the stance and the blocks).
 *
 * First pass: no ball is moved; a straddled foot's sideways tilt is not
 * flattened; a turn is one full turn on the left foot's ball without a rise
 * onto it; the partner of a closed hold or an underarm turn is not met.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what is solved, what is provisional with its sources and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per pose: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres.
 */
export namespace WorkoutPoses {
  /** A full turn on the left foot's ball with the arms as given at its half. */
  const turn = (seconds: number, arms: ExerciseKey.ILimb): WorkoutKind =>
    WorkoutStance.of(
      ["leftToes"],
      [{ part: "leftFoot", kind: "pivot" }],
      0,
      1,
      (): WorkoutKind.IStep[] => [
        WorkoutKind.step(ExerciseKey.STOOD, 0, "reset", "stood"),
        WorkoutKind.step(
          ExerciseKey.of({ yaw: 180 }, arms, {}, { hip: 25, knee: 50 }),
          seconds,
          "turn",
          "half",
        ),
        WorkoutKind.step(
          { ...ExerciseKey.STOOD, yaw: 360 },
          seconds,
          "close",
          "full",
        ),
      ],
    );

  /** A karate block's chamber: the fists at the hips, the blocking arm folded across. */
  const chamber: ExerciseKey.IKey = ExerciseKey.of(
    {},
    { shoulder: -10, elbow: 90 },
    {},
    { shoulder: 60, raise: 0, elbow: 140 },
  );

  /** The exercises' names. */
  export type Name =
    | "calfStretch"
    | "chestStretch"
    | "tricepsStretch"
    | "lungeTwist"
    | "warriorOne"
    | "triangle"
    | "warriorTwo"
    | "sunSalutation"
    | "frontStance"
    | "lowBlock"
    | "risingBlock"
    | "header"
    | "chestTrap"
    | "thighTrap"
    | "spin"
    | "underarmTurn"
    | "hammerTurn"
    | "closedHold";

  /** The exercises. */
  export const KINDS: Readonly<Record<Name, WorkoutKind>> = {
    /** A standing calf stretch: the left leg back and straight with its heel down, the hands forward, held 20 s. */
    calfStretch: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1.5,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          WorkoutStance.stride(body, 25, { pitch: 10 }, { shoulder: 80, elbow: 20 }),
          0,
          20,
        ),
      ],
    ),

    /** A chest stretch: both straight arms opened behind the line of the shoulders, held 20 s. */
    chestStretch: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 1.5, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.pose(
        ExerciseKey.of(
          { chest: [-10, 0, 0] },
          { shoulder: -15, raise: 90, elbow: 3 },
        ),
        0,
        20,
      ),
    ]),

    /** A triceps stretch: the right elbow overhead and bent, the left hand brought to it, held 20 s. */
    tricepsStretch: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 1.5, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.pose(
        ExerciseKey.of(
          {},
          {},
          { shoulder: 150, raise: 0, elbow: 100 },
          { shoulder: 170, raise: 0, elbow: 140 },
        ),
        0,
        20,
      ),
    ]),

    /** A lunge with a twist, in place: a split stance with the trunk turned over the front leg, alternating. */
    lungeTwist: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      0,
      4,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutStance.rest(1),
        WorkoutKind.step(
          WorkoutStance.stride(
            body,
            35,
            { spine: [0, 0, -30], chest: [0, 0, -25] },
            { shoulder: 80, elbow: 10 },
          ),
          1,
          "lunge",
          "twist",
          0.5,
        ),
      ],
      true,
    ),

    /** Warrior I of yoga: a split stance with the arms overhead, held 15 s. */
    warriorOne: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      2,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          WorkoutStance.stride(body, 40, {}, { shoulder: 175, elbow: 3 }),
          0,
          15,
        ),
      ],
    ),

    /** The triangle of yoga: a straddle with the trunk bent to the side and the arms in one line, held 15 s. */
    triangle: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 2, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.pose(
        ExerciseKey.of(
          { spine: [0, 25, 0], chest: [0, 20, 0] },
          { spread: 30, raise: 90, elbow: 3 },
        ),
        0,
        15,
      ),
    ]),

    /** Warrior II of yoga: a straddle with the right thigh turned out and bent 60 degrees over an upright shank, the arms level to the sides, held 15 s; the straight leg's spread is solved so both feet stand. */
    warriorTwo: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      2,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          ExerciseKey.of(
            {},
            { raise: 90, elbow: 3 },
            { spread: WorkoutStance.straight(body, 60) },
            { spread: 60, turn: 90, knee: 60 },
          ),
          0,
          15,
        ),
      ],
    ),

    /** The standing half of a sun salutation: the arms raised, the trunk folded over the legs, lifted half way with a flat back, folded again and raised; the plank, the cobra and the dog that complete the flow are their own rows. */
    sunSalutation: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0, 1, (): WorkoutKind.IStep[] => [
      WorkoutStance.rest(1.5),
      WorkoutKind.step(
        ExerciseKey.of({ neck: -15 }, { shoulder: 175, raise: 0, elbow: 3 }),
        1.5,
        "raise",
        "armsUp",
        0.5,
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 100, neck: 20 },
          { hip: 100, shoulder: 100, raise: 0, elbow: 3 },
        ),
        2,
        "fold",
        "folded",
        1,
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 70, neck: -20 },
          { hip: 70, shoulder: 45, raise: 0, elbow: 3 },
        ),
        1.2,
        "lift",
        "halfLift",
        0.5,
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 100, neck: 20 },
          { hip: 100, shoulder: 100, raise: 0, elbow: 3 },
        ),
        1.2,
        "foldAgain",
        "foldedAgain",
        0.5,
      ),
    ]),

    /** Karate's front stance (zenkutsu-dachi): a split stance with the fists at the hips, held 3 s. */
    frontStance: WorkoutStance.of(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          WorkoutStance.stride(body, 30, {}, { shoulder: -10, elbow: 90 }),
          0,
          3,
        ),
      ],
    ),

    /** Karate's low block (gedan-barai) with the right arm. */
    lowBlock: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0.4, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(chamber, 0.3, "chamber", "chambered"),
      WorkoutKind.step(
        ExerciseKey.of(
          {},
          { shoulder: -10, elbow: 90 },
          {},
          { shoulder: 30, raise: 10, elbow: 10 },
        ),
        0.2,
        "block",
        "blocked",
        0.3,
      ),
    ]),

    /** Karate's rising block (age-uke) with the right arm. */
    risingBlock: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0.4, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(chamber, 0.3, "chamber", "chambered"),
      WorkoutKind.step(
        ExerciseKey.of(
          {},
          { shoulder: -10, elbow: 90 },
          {},
          { shoulder: 100, raise: 30, elbow: 100 },
        ),
        0.2,
        "block",
        "blocked",
        0.3,
      ),
    ]),

    /** A football header: the trunk drawn back and snapped forward through the ball. */
    header: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0, 1, (): WorkoutKind.IStep[] => [
      WorkoutStance.rest(0.3),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: -12, neck: -10 },
          { hip: -12, raise: 25, elbow: 40 },
        ),
        0.3,
        "load",
        "loaded",
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 15, neck: 15 },
          { hip: 15, raise: 25, elbow: 40 },
        ),
        0.12,
        "snap",
        "contact",
      ),
    ]),

    /** A chest trap: the trunk leaned back under the ball with the arms out. */
    chestTrap: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 0, 1, (): WorkoutKind.IStep[] => [
      WorkoutStance.rest(0.4),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: -12, chest: [-8, 0, 0] },
          { hip: -12, raise: 50, elbow: 30 },
        ),
        0.3,
        "open",
        "contact",
        0.2,
      ),
    ]),

    /** A thigh trap: the right thigh raised under the ball over the standing left foot. */
    thighTrap: WorkoutStance.of(["leftFoot"], WorkoutStance.LEFT, 0, 1, (): WorkoutKind.IStep[] => [
      WorkoutStance.rest(0.4),
      WorkoutKind.step(
        ExerciseKey.of({}, { raise: 30 }, {}, { hip: 70, knee: 80 }),
        0.3,
        "lift",
        "contact",
        0.2,
      ),
    ]),

    /** A dancer's full turn on the left foot. */
    spin: turn(0.4, { raise: 30, elbow: 60 }),

    /** The follower's underarm turn: a full turn under the raised right hand. */
    underarmTurn: turn(
      0.6,
      { raise: 20, elbow: 40 },
    ),

    /** One turn of a hammer or discus thrower, the arms long ahead; the release is a throw after it. */
    hammerTurn: turn(0.5, { shoulder: 80, raise: 0, elbow: 3 }),

    /** A ballroom closed hold: the left hand out at the shoulder's height, the right arm round the partner, held 5 s. */
    closedHold: WorkoutStance.of(WorkoutStance.ANKLES, WorkoutStance.FEET, 1, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.pose(
        ExerciseKey.of(
          {},
          {},
          { shoulder: 60, raise: 70, elbow: 80 },
          { shoulder: 70, raise: 30, elbow: 85 },
        ),
        0,
        5,
      ),
    ]),
  };
}
