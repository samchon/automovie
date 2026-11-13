import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The standing exercises of the workout law (#3377, #3378): lifts shown
 * without their load (deadlift, back squat, kettlebell swing, overhead
 * press), warm-up drills (arm circles, leg swings, butt kicks, the B-skip,
 * the skipping rope's hops), standing stretches and yoga poses (calf,
 * chest, triceps, the lunge with a twist, warrior I, the triangle), a
 * dancer's turn and closed hold, a footballer's header and traps, a
 * thrower's turn and karate's front stance and blocks.
 *
 * The feet stay where they stand: a key's legs are written by
 * `ExerciseKey.stood`, which keeps a foot level under a pitched trunk, and a
 * split stance's front knee is solved on the body so both feet reach the
 * floor (`split`). A drill that lifts a foot pins the pelvis or the standing
 * foot instead. Every stated angle is provisional, read off the exercise's
 * usual description (ACSM's Guidelines, 11th ed.; NSCA's Essentials of
 * Strength Training, 4th ed.).
 *
 * First pass: no bar, bell, rope or ball is held or moved; a straddled
 * foot's sideways tilt is not flattened; a turn is one full turn on the
 * left foot's ball without a rise onto it; the partner of a closed hold or
 * an underarm turn is not met.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what keeps the feet, what is solved, what is provisional with its sources and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and the one solved angle it shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres; a hop is a share of the stature.
 */
export namespace WorkoutStanding {
  /**
   * The front thigh's forward angle of a split stance whose straight back
   * leg leans back by an angle: the front shank stays upright and both feet
   * stand on the floor.
   *
   * @param body The body.
   * @param back The back leg's lean from the vertical, degrees.
   * @returns Degrees; the front hip's and knee's flexion under an upright trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and what the result is used as.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis's height over the back foot is the leg's length times the lean's cosine; over the front foot it is the shank plus the thigh times its angle's cosine; the two are equal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arccosine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lean past what the thigh can make up clamps at a level thigh.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function split(body: IHumanBody, back: number): number {
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    const height: number =
      (thigh + shank) * Math.cos((back * Math.PI) / 180) - shank;
    return (
      (Math.acos(Math.max(0, Math.min(1, height / thigh))) * 180) / Math.PI
    );
  }

  /** A split stance under a trunk pitched forward: the left leg back and straight, the right knee over its foot. */
  const stride = (
    body: IHumanBody,
    back: number,
    trunk: ExerciseKey.ITrunk,
    arms: ExerciseKey.ILimb,
  ): ExerciseKey.IKey => {
    const front: number = split(body, back);
    const pitch: number = trunk.pitch ?? 0;
    return ExerciseKey.of(
      trunk,
      arms,
      { hip: pitch - back, ankle: back },
      { hip: pitch + front, knee: front },
    );
  };

  /** Standing, as the step every repetition returns to. */
  const rest = (seconds: number): WorkoutKind.IStep =>
    WorkoutKind.step(ExerciseKey.STOOD, seconds, "recover", "stood");

  /** Both feet bear. */
  const FEET: readonly WorkoutKind.ISupport[] = [
    { part: "leftFoot", kind: "plant" },
    { part: "rightFoot", kind: "plant" },
  ];

  /** The left foot bears. */
  const LEFT: readonly WorkoutKind.ISupport[] = [
    { part: "leftFoot", kind: "plant" },
  ];

  /** A standing kind: the named bones stay where they stand. */
  const kind = (
    pin: readonly AutoMovieHumanoidBone[],
    supports: readonly WorkoutKind.ISupport[],
    enter: number,
    reps: number,
    route: WorkoutKind["route"],
    alternate: boolean = false,
  ): WorkoutKind => ({
    base: "standing",
    anchor: "stance",
    pin,
    supports,
    enter,
    reps,
    route,
    alternate,
  });

  /** A full turn on the left foot's ball with the arms as given at its half. */
  const turn = (seconds: number, arms: ExerciseKey.ILimb): WorkoutKind =>
    kind(
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

  /** The two feet's ankles. */
  const ANKLES: readonly AutoMovieHumanoidBone[] = ["leftFoot", "rightFoot"];

  /** A karate block's chamber: the fists at the hips, the blocking arm folded across. */
  const chamber: ExerciseKey.IKey = ExerciseKey.of(
    {},
    { shoulder: -10, elbow: 90 },
    {},
    { shoulder: 60, raise: 0, elbow: 140 },
  );

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
    | "jumpRope"
    | "calfStretch"
    | "chestStretch"
    | "tricepsStretch"
    | "lungeTwist"
    | "warriorOne"
    | "triangle"
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
    /** A deadlift: a hip hinge to 55 degrees and back, the arms hanging. */
    deadlift: kind(ANKLES, FEET, 0, 5, (): WorkoutKind.IStep[] => [
      rest(1.2),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 55, neck: -15 },
          { ...ExerciseKey.stood(55, 35, 15), shoulder: 55, elbow: 3 },
        ),
        1.5,
        "lower",
        "bottom",
      ),
    ]),

    /** A back squat: the hands at the shoulders, down to a level thigh and up. */
    backSquat: kind(ANKLES, FEET, 0.8, 5, (): WorkoutKind.IStep[] => [
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
    kettlebellSwing: kind(ANKLES, FEET, 0.8, 8, (): WorkoutKind.IStep[] => [
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
    overheadPress: kind(ANKLES, FEET, 0.8, 5, (): WorkoutKind.IStep[] => [
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
    armCircles: kind(ANKLES, FEET, 0.3, 5, (): WorkoutKind.IStep[] => [
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
    legSwings: kind(["leftFoot"], LEFT, 0, 6, (): WorkoutKind.IStep[] => [
      rest(0.4),
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
    buttKicks: kind(
      ["hips"],
      [],
      0,
      8,
      (): WorkoutKind.IStep[] => [
        rest(0.2),
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
    bSkip: kind(
      ["hips"],
      [],
      0,
      6,
      (): WorkoutKind.IStep[] => [
        rest(0.25),
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
    jumpRope: kind(["hips"], [], 0.3, 10, (): WorkoutKind.IStep[] => [
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

    /** A standing calf stretch: the left leg back and straight with its heel down, the hands forward, held 20 s. */
    calfStretch: kind(
      ANKLES,
      FEET,
      1.5,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          stride(body, 25, { pitch: 10 }, { shoulder: 80, elbow: 20 }),
          0,
          20,
        ),
      ],
    ),

    /** A chest stretch: both straight arms opened behind the line of the shoulders, held 20 s. */
    chestStretch: kind(ANKLES, FEET, 1.5, 1, (): WorkoutKind.IStep[] => [
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
    tricepsStretch: kind(ANKLES, FEET, 1.5, 1, (): WorkoutKind.IStep[] => [
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
    lungeTwist: kind(
      ANKLES,
      FEET,
      0,
      4,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        rest(1),
        WorkoutKind.step(
          stride(
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
    warriorOne: kind(
      ANKLES,
      FEET,
      2,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          stride(body, 40, {}, { shoulder: 175, elbow: 3 }),
          0,
          15,
        ),
      ],
    ),

    /** The triangle of yoga: a straddle with the trunk bent to the side and the arms in one line, held 15 s. */
    triangle: kind(ANKLES, FEET, 2, 1, (): WorkoutKind.IStep[] => [
      WorkoutKind.pose(
        ExerciseKey.of(
          { spine: [0, 25, 0], chest: [0, 20, 0] },
          { spread: 30, raise: 90, elbow: 3 },
        ),
        0,
        15,
      ),
    ]),

    /** Karate's front stance (zenkutsu-dachi): a split stance with the fists at the hips, held 3 s. */
    frontStance: kind(
      ANKLES,
      FEET,
      1,
      1,
      (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          stride(body, 30, {}, { shoulder: -10, elbow: 90 }),
          0,
          3,
        ),
      ],
    ),

    /** Karate's low block (gedan-barai) with the right arm. */
    lowBlock: kind(ANKLES, FEET, 0.4, 1, (): WorkoutKind.IStep[] => [
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
    risingBlock: kind(ANKLES, FEET, 0.4, 1, (): WorkoutKind.IStep[] => [
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
    header: kind(ANKLES, FEET, 0, 1, (): WorkoutKind.IStep[] => [
      rest(0.3),
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
    chestTrap: kind(ANKLES, FEET, 0, 1, (): WorkoutKind.IStep[] => [
      rest(0.4),
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
    thighTrap: kind(["leftFoot"], LEFT, 0, 1, (): WorkoutKind.IStep[] => [
      rest(0.4),
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
    closedHold: kind(ANKLES, FEET, 1, 1, (): WorkoutKind.IStep[] => [
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
