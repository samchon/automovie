import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  AutoMovieEngineMotionSampling,
  AutoMovieEngineMath,
  AutoMovieEngineKinematicsJointRotation,
} from "@automovie/engine";
import type {
  IAutoMovieJointRotationDomain,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutGym,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { ExerciseKey } from "../internal/ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";

/*
 * The gym's standing movements of the workout law: free-weight exercises a
 * programme names beside the ones the other tables hold, shown here without
 * their load unless the author names one (`load`): the bent-over row, the curl,
 * the overhead triceps extension, the lateral and the front raise, the shrug,
 * the calf raise, the front and the goblet squat, the split squat, the wall
 * sit, the Romanian deadlift, the good morning, and the power clean and the
 * snatch as their phases. The floor exercises and the dip are
 * `WorkoutBodyweight`'s.
 *
 * Every angle is provisional, read off the exercise's usual description (NSCA's
 * Essentials of Strength Training and Conditioning, 4th ed., exercise technique
 * chapters); none is a measured value.
 *
 * A loaded take fits its hands to the authored prop through `WorkoutLoad`. The
 * snatch and clean-and-jerk use separate catches and recoveries from the IWF's
 * definitions (https://iwf.sport/weightlifting_/rules/). The trajectories are
 * keyed kinematic staging. Nagao and Yamashita's example snatch bar path
 * (https://doi.org/10.1371/journal.pone.0263224, Fig. 3) motivates preserving
 * the continuous fore-aft path through turnover. The wall sit uses a place.
 * `WorkoutEquipment` owns bench and box support.
 */
export namespace WorkoutGym {
  /*
   * Prepare the two-handed bar path when the exercise has no prop.
   */
  export function prepareEmptyBar(
    body: IAutoMovieMotionHumanBody,
    kind: "snatch" | "cleanAndJerk",
  ): (
    key: IAutoMovieMotionHumanExerciseKey.IKey,
  ) => IAutoMovieMotionHumanExerciseKey.IKey {
    const snatch: boolean = kind === "snatch";
    const arms = (["left", "right"] as const).map((side) => {
      const bone = `${side}UpperArm` as const;
      const axes = HUMANOID_JOINT_AXES[bone]!;
      const frame = HUMANOID_REST_FRAME[bone];
      const direction = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
      const compose = AutoMovieEngineKinematicsJointRotation.prepareJointToQuaternionOnBasis(axes, frame);
      const domain: IAutoMovieJointRotationDomain = body.chains[`${side}Arm`]
        ?.upperDomain ?? {
        bone,
        constraint: DEFAULT_HUMANOID_ROM[bone] ?? null,
      };
      return { bone, axes, frame, direction, compose, domain };
    });
    return (key) => {
      const joints: IAutoMovieMotionHumanExerciseKey.IKey["joints"] = {
        ...key.joints,
      };
      for (const { bone, axes, frame, direction, compose, domain } of arms) {
        const [flexion, spread, twist] = key.joints[bone]!;
        // Keep the clean's rack. Bring its modest outboard grip in over the jerk drive.
        const share: number = snatch
          ? 1
          : AutoMovieEngineMotionSampling.minimumJerkShare((flexion - 85) / 45);
        if (share === 0) continue;
        const f: number = (flexion * Math.PI) / 180;
        const a: number = (spread * Math.PI) / 180;
        const width: number =
          ((snatch ? spread : Math.min(8, spread)) * Math.PI) / 180;
        const turn = compose({ flexion, abduction: spread, twist });
        // Swing the arm around the bar's lateral axis. Canonical abduction
        // alone makes the outboard direction reverse past shoulder height.
        const aimed = AutoMovieEngineMath.rotationBetween(
          Quaternion.rotateVector(turn, direction),
          {
            x:
              direction.x *
              ((1 - share) * Math.max(0, Math.sin(a) * Math.cos(f)) +
                share * Math.sin(width)),
            y:
              -Math.cos(f) *
              ((1 - share) * Math.cos(a) + share * Math.cos(width)),
            z: Math.sin(f) * (1 - share + share * Math.cos(width)),
          },
        );
        // Retain the keyed arm's axial rotation so the elbow does not flip at turnover.
        const angles = AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(
          Quaternion.multiply(aimed, turn),
          axes,
          frame,
          domain,
        );
        joints[bone] = [angles.flexion, angles.abduction, angles.twist];
      }
      return { ...key, joints };
    };
  }

  /*
   * A key from the whole body's part and the limbs' angles, on the body it is
   * built for (`ExerciseKey.from`).
   */
  const key =
    (
      trunk: IAutoMovieMotionHumanExerciseKey.ITrunk,
      both: IAutoMovieMotionHumanExerciseKey.ILimb,
    ): Keyed =>
    (body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanExerciseKey.IKey =>
      ExerciseKey.from(body, trunk, both);

  /*
   * A squat's bottom: the trunk pitched, the knees bent over shanks that lean,
   * with the arms as given.
   */
  const squat = (
    pitch: number,
    knee: number,
    shank: number,
    arms: IAutoMovieMotionHumanExerciseKey.ILimb,
  ): Keyed =>
    key(
      { pitch, neck: -10 },
      { ...ExerciseKey.stood(pitch, knee, shank), ...arms },
    );

  /*
   * A standing kind on both feet whose repetition goes between two keys.
   */
  const pair = (
    reps: number,
    low: readonly [Keyed, number, string, string],
    high: readonly [Keyed, number, string, string],
  ): IAutoMovieMotionHumanWorkoutKind =>
    WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      0.8,
      reps,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(low[0](body), low[1], low[2], low[3]),
        WorkoutKind.step(high[0](body), high[1], high[2], high[3]),
      ],
    );

  /*
   * The exercises.
   */
  export const KINDS: Readonly<
    Record<
      IAutoMovieMotionHumanWorkoutGym.Name,
      IAutoMovieMotionHumanWorkoutKind
    >
  > = {
    /*
     * A bent-over row: the trunk held at 60 degrees, the elbows drawn back past
     * it.
     */
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

    /*
     * A curl: the elbows bent from straight to full, the upper arms still.
     */
    curl: pair(
      5,
      [key({}, { raise: 5, elbow: 5, twist: 0 }), 1.2, "lower", "down"],
      [key({}, { raise: 5, elbow: 140 }), 0.9, "curl", "top"],
    ),

    /*
     * An overhead triceps extension: the upper arms beside the head, the elbows
     * straightened.
     */
    tricepsExtension: pair(
      5,
      [
        key({}, { shoulder: 172, raise: 0, elbow: 135 }),
        1.2,
        "lower",
        "bottom",
      ],
      [
        key({}, { shoulder: 172, raise: 0, elbow: 5 }),
        0.9,
        "extend",
        "lockout",
      ],
    ),

    /*
     * A lateral raise: the arms lifted out to the shoulders' height.
     */
    lateralRaise: pair(
      5,
      [key({}, { raise: 8, elbow: 10 }), 1.2, "lower", "down"],
      [key({}, { raise: 88, elbow: 10 }), 0.9, "raise", "top"],
    ),

    /*
     * A front raise: the arms lifted forward to the shoulders' height.
     */
    frontRaise: pair(
      5,
      [key({}, { raise: 3, elbow: 5 }), 1.2, "lower", "down"],
      [key({}, { shoulder: 88, raise: 3, elbow: 5 }), 0.9, "raise", "top"],
    ),

    /*
     * A shrug: the shoulder girdles lifted 20 degrees toward the ears and
     * lowered, the arms hanging (provisional).
     */
    shrug: pair(
      8,
      [key({}, { elbow: 5 }), 0.8, "lower", "down"],
      [key({}, { elbow: 5, shrug: 20 }), 0.6, "shrug", "top"],
    ),

    /*
     * A calf raise: both heels lifted over the toes' joints, which stay.
     */
    calfRaise: WorkoutStance(
      ["leftToes", "rightToes"],
      WorkoutStance.FEET,
      0,
      8,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutStance.rest(body, 0.8),
        WorkoutKind.step(
          key({}, { ankle: -30, toes: 30 })(body),
          0.6,
          "raise",
          "top",
          0.3,
        ),
      ],
      false,
      true,
    ),

    /*
     * A front squat: the hands at the shoulders with the elbows high, the trunk
     * more upright than a back squat's.
     */
    frontSquat: pair(
      5,
      [key({}, { shoulder: 85, raise: 5, elbow: 145 }), 1.2, "rise", "top"],
      [
        squat(20, 120, 35, { shoulder: 85, raise: 5, elbow: 145 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

    /*
     * A goblet squat: both hands before the chest.
     */
    gobletSquat: pair(
      5,
      [key({}, { shoulder: 35, raise: 5, elbow: 135 }), 1.2, "rise", "top"],
      [
        squat(25, 120, 33, { shoulder: 35, raise: 5, elbow: 135 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

    /*
     * A split squat: a split stance lowered and raised, the feet where the
     * stance put them.
     */
    splitSquat: WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1.2,
      5,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
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

    /*
     * A wall sit: the thighs level over upright shanks, the trunk upright, held
     * 30 s.
     */
    wallSit: WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1.5,
      1,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.pose(squat(0, 90, 0, { elbow: 10 })(body), 0, 30),
      ],
    ),

    /*
     * A Romanian deadlift: a hinge to 60 degrees over soft knees, the arms
     * hanging.
     */
    romanianDeadlift: {
      midfoot: true,
      ...pair(
        5,
        [key({}, { elbow: 3 }), 1.2, "rise", "top"],
        [
          squat(60, 15, 5, { shoulder: 60, raise: 0, elbow: 3 }),
          1.8,
          "lower",
          "bottom",
        ],
      ),
    },

    /*
     * A good morning: the same hinge with the hands behind the head.
     */
    goodMorning: pair(
      5,
      [key({}, { shoulder: 20, raise: 80, elbow: 140 }), 1.2, "rise", "top"],
      [
        squat(65, 15, 5, { shoulder: 20, raise: 80, elbow: 140 }),
        1.8,
        "lower",
        "bottom",
      ],
    ),

    /*
     * A power clean with the pull, catch and standing rack on separate events.
     */
    powerClean: WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1,
      1,
      clean,
    ),

    /*
     * A clean followed by a squat jerk. The IWF separates the rack and standing
     * recovery from the dip, drive and overhead receive; the squat receive
     * follows the shape compared with the lunge-style jerk in PMID 39337870.
     * The transition durations are authored staging values.
     */
    cleanAndJerk: WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1,
      1,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        ...clean(body),
        WorkoutKind.step(
          squat(5, 32, 13, { shoulder: 85, raise: 5, elbow: 145 })(body),
          0.3,
          "dip",
          "jerkDip",
        ),
        WorkoutKind.step(
          key({}, { shoulder: 135, raise: 12, elbow: 65 })(body),
          0.18,
          "drive",
          "jerkDrive",
        ),
        WorkoutKind.step(
          squat(10, 100, 28, { shoulder: 167, raise: 15, elbow: 3 })(body),
          0.28,
          "receive",
          "jerkCatch",
          0.15,
        ),
        WorkoutKind.step(
          key({}, { shoulder: 170, raise: 15, elbow: 3 })(body),
          0.85,
          "standOverhead",
          "jerkOverhead",
          0.5,
        ),
        WorkoutKind.step(
          key({}, { shoulder: 85, raise: 5, elbow: 145 })(body),
          0.6,
          "lowerToRack",
          "resetRack",
        ),
      ],
    ),

    /*
     * A snatch as its positions: the wide start, the full extension, the catch
     * in an overhead squat, and standing up under the locked arms.
     */
    snatch: WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      1,
      1,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          squat(60, 85, 28, { shoulder: 60, raise: 30, elbow: 3 })(body),
          1,
          "set",
          "start",
          0.3,
        ),
        WorkoutKind.step(
          key(
            { pitch: -5 },
            { hip: -5, ankle: -15, raise: 30, elbow: 3 },
          )(body),
          0.45,
          "pull",
          "extension",
        ),
        WorkoutKind.step(
          squat(15, 115, 32, { shoulder: 165, raise: 30, elbow: 3 })(body),
          0.35,
          "turnOver",
          "catch",
          0.3,
        ),
        WorkoutKind.step(
          key({}, { shoulder: 172, raise: 30, elbow: 3 })(body),
          1,
          "recover",
          "overhead",
          0.5,
        ),
      ],
    ),
  };

  /*
   * The clean's shared pull, receiving support and rack.
   */
  function clean(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanWorkoutKind.IStep[] {
    return [
      WorkoutKind.step(
        squat(65, 75, 25, { shoulder: 65, raise: 0, elbow: 3 })(body),
        1,
        "set",
        "start",
        0.3,
      ),
      WorkoutKind.step(
        key({ pitch: -5 }, { hip: -5, ankle: -15, elbow: 3 })(body),
        0.45,
        "pull",
        "extension",
      ),
      WorkoutKind.step(
        squat(10, 55, 18, { shoulder: 85, raise: 5, elbow: 145 })(body),
        0.3,
        "turnOver",
        "catch",
        0.2,
      ),
      WorkoutKind.step(
        key({}, { shoulder: 85, raise: 5, elbow: 145 })(body),
        0.8,
        "recover",
        "rack",
        0.5,
      ),
    ];
  }

  /*
   * A key of the body's, built once the body is known.
   */
  type Keyed = (
    body: IAutoMovieMotionHumanBody,
  ) => IAutoMovieMotionHumanExerciseKey.IKey;
}
