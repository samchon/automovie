import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWorkout,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { floorEntry } from "../floor/floorEntry";

/**
 * How a hands-down floor exercise is entered (`workout`): from standing,
 * from a lowered base (kneeling or crouched), or straight from a held floor
 * stance (a plank or push-up whose hands and feet already bear on the
 * ground), when the next exercise keeps that stance's palms and pins.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three entries and the condition of each.
 * @evidence contracts/development/design.md#principled-representation Two flags and the displayed entry posture an entry from the floor starts from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and the one classifier `workout.plan` calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each flag reads the entry's own base and supports; nothing is assumed of the previous action.
 */
export namespace workoutFloorStance {
  /**
   * A floor entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation Whether a held stance is kept, and the displayed posture a floor entry approaches the first key from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values `workout.plan` branches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `entered` is null exactly when the body enters from standing.
   */
  export interface IEntry {
    /** Whether the exercise keeps the held floor stance it is entered in. */
    held: boolean;

    /** The displayed posture a lowered or held entry starts from; null from standing. */
    entered: IAutoMovieMotionHumanPosture | null;
  }

  /**
   * Classify the entry.
   *
   * @param context The action's context.
   * @param kind The exercise.
   * @returns The entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A floor stance is a prop-free, unloaded, hands-down leaning kind pinned at the hips; it is held when a plank or push-up is entered leaning with both hands and both feet planted or bearing on the ground, and lowered when entered kneeling or crouched; either starts from the displayed entry (`floorEntry.displayed`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three predicates, then one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads only the entry's declared base and supports.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the entry's supports per bearing part.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each entry is read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the displayed posture and retains nothing else.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWorkout.IParams>,
    kind: IAutoMovieMotionHumanWorkoutKind,
  ): IEntry {
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

  /** The parts a held floor stance bears on. */
  const BEARING = ["leftHand", "rightHand", "leftFoot", "rightFoot"] as const;
}
