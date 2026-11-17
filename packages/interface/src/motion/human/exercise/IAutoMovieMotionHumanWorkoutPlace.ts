import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanExerciseKey } from "./IAutoMovieMotionHumanExerciseKey";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanWorkoutKind } from "./IAutoMovieMotionHumanWorkoutKind";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by WorkoutPlace.of.
 *
 * @evidence contracts/development/common.md#meaningful-documentation context: Borrowed body and entry state used to find an admissible exercise placement. borne: World-space point, metres, on which weight is borne; null means no externally supplied bearing point.
 * @evidence contracts/development/design.md#principled-representation context: Borrowed body and entry state used to find an admissible exercise placement. borne: World-space point, metres, on which weight is borne; null means no externally supplied bearing point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutPlace.ts (WorkoutPlace.of, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanWorkoutKind, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanExerciseKey.IKey, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWorkoutPlace {
  /**
   * The place the bearing bones keep. Input props of WorkoutPlace.of. The action's context, the kind, the standing posture the exercise is entered from, the first key, and the prop's place when one bears the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation context: Borrowed body and entry state used to find an admissible exercise placement. borne: World-space point, metres, on which weight is borne; null means no externally supplied bearing point.
   * @evidence contracts/development/design.md#principled-representation context: Borrowed body and entry state used to find an admissible exercise placement. borne: World-space point, metres, on which weight is borne; null means no externally supplied bearing point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutPlace.ts (WorkoutPlace.of, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanWorkoutKind, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanExerciseKey.IKey, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IOfProps = {
    /** Borrowed body and entry state used to find an admissible exercise placement. */
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">;
    /** Exercise family whose support geometry is being placed. */
    kind: IAutoMovieMotionHumanWorkoutKind;
    /** Reference standing posture before the exercise placement. */
    standing: IAutoMovieMotionHumanPosture;
    /** First exercise key whose contacts determine entry placement. */
    first: IAutoMovieMotionHumanExerciseKey.IKey;
    /** World-space point, metres, on which weight is borne; null means no externally supplied bearing point. */
    borne: IAutoMovieVector3 | null;
  };
}
