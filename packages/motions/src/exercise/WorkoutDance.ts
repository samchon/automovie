import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWorkoutDance,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import { WorkoutStance } from "./WorkoutStance";
import { balletStep } from "./internal/balletStep";

/**
 * The dance steps of the workout law: ballet's plié, relevé and arabesque on
 * feet turned out `TURNOUT` degrees, breaking's baby freeze balanced on both
 * hands, and the street rock's alternating chest and head isolations over a
 * knee bounce. Each is data over the one workout planner: the pinned bones stay
 * where they stand, so a relevé rises about the toes and an arabesque stands on
 * its left foot.
 *
 * Angles are provisional, read off the steps' usual descriptions (Vaganova,
 * Basic Principles of Classical Ballet, for the plié, relevé and arabesque; the
 * baby freeze and the rock as breaking and hip-hop teaching describes them).
 */
export namespace WorkoutDance {
  /**
   * The ballet turnout, degrees of hip external rotation each side: the ballet
   * law's.
   */
  export const TURNOUT: number = balletStep.TURNOUT;

  /** The steps. */
  export const KINDS: Readonly<
    Record<
      IAutoMovieMotionHumanWorkoutDance.Name,
      IAutoMovieMotionHumanWorkoutKind
    >
  > = {
    /**
     * An arabesque: on the left foot, the right leg raised straight behind, the
     * arms out, held 3 s.
     */
    arabesque: WorkoutStance(
      ["leftFoot"],
      WorkoutStance.LEFT,
      1.5,
      1,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.pose(
          ExerciseKey.from(
            body,
            { pitch: 15 },
            { shoulder: 60, raise: 70, elbow: 10 },
            { turn: TURNOUT / 2, hip: 15, knee: 0 },
            { turn: TURNOUT, hip: -40, knee: 0, ankle: -30 },
          ),
          0,
          3,
        ),
      ],
    ),

    /**
     * A baby freeze: down onto both hands, the hips and knees folded over the
     * elbows, the feet off the floor, held 2 s.
     */
    babyFreeze: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftHand", "rightHand"],
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
      ],
      enter: 1.5,
      count: 1,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.pose(
          ExerciseKey.from(
            body,
            { pitch: 75, neck: 20 },
            {
              hip: 110,
              knee: 110,
              ankle: -20,
              shoulder: 75,
              raise: 15,
              elbow: 80,
            },
          ),
          0,
          2,
        ),
      ],
    },

    /**
     * A street rock: the knees bounce and the chest and head isolate left and
     * right on alternate counts, four times.
     */
    streetRock: WorkoutStance(
      WorkoutStance.ANKLES,
      WorkoutStance.FEET,
      0.5,
      4,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { chest: [5, 0, 15], spine: [5, 0, 5], neck: 10 },
            {
              hip: 15,
              knee: 25,
              ankle: 12,
              shoulder: 20,
              raise: 15,
              elbow: 70,
            },
          ),
          0.25,
          "drop",
          "down",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { chest: [0, 0, -15], spine: [0, 0, -5], neck: -5 },
            { hip: 5, knee: 8, ankle: 4, shoulder: 20, raise: 15, elbow: 70 },
          ),
          0.25,
          "rock",
          "up",
        ),
      ],
    ),
  };
}
