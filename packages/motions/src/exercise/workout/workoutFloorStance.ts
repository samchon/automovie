import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWorkout,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { floorEntry } from "../../floor/floorEntry";

/** The parts a held floor stance bears on. */
const BEARING = ["leftHand", "rightHand", "leftFoot", "rightFoot"] as const;

/**
 * Classify the entry.
 *
 * @param context The action's context.
 * @param kind The exercise.
 * @returns The entry.
 */
export function workoutFloorStance(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWorkout.IParams>,
  kind: IAutoMovieMotionHumanWorkoutKind,
): workoutFloorStance.IEntry {
  const p: IAutoMovieMotionHumanWorkout.IParams = context.params;
  const floorStance: boolean =
    p.on === undefined &&
    p.load === undefined &&
    kind.hands === true &&
    kind.base === "leaning" &&
    kind.anchor === "hips";
  const held: boolean =
    floorStance &&
    (p.kind === "plank" || p.kind === "pushUp") &&
    context.entry.base.kind === "leaning" &&
    BEARING.every((part: (typeof BEARING)[number]): boolean =>
      context.entry.supports.some(
        (
          support: IAutoMovieMotionHumanActionContext["entry"]["supports"][number],
        ): boolean =>
          support.part === part &&
          support.support.kind === "ground" &&
          (support.kind === "plant" || support.kind === "bear"),
      ),
    );
  const lowered: boolean =
    floorStance &&
    (context.entry.base.kind === "kneeling" ||
      context.entry.base.kind === "crouched");
  return {
    held,
    entered: lowered || held ? floorEntry.displayed(context) : null,
  };
}

/**
 * How a hands-down floor exercise is entered (`workout`): from standing, from a
 * lowered base (kneeling or crouched), or straight from a held floor stance (a
 * plank or push-up whose hands and feet already bear on the ground), when the
 * next exercise keeps that stance's palms and pins.
 */
export namespace workoutFloorStance {
  /** A floor entry. */
  export interface IEntry {
    /** Whether the exercise keeps the held floor stance it is entered in. */
    held: boolean;

    /**
     * The displayed posture a lowered or held entry starts from; null from
     * standing.
     */
    entered: IAutoMovieMotionHumanPosture | null;
  }
}
