import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanExerciseKey } from "./IAutoMovieMotionHumanExerciseKey";
import type { IAutoMovieMotionHumanWorkoutKind } from "./IAutoMovieMotionHumanWorkoutKind";

/** Contracts used by WorkoutPlace.of. */
export namespace IAutoMovieMotionHumanWorkoutPlace {
  /**
   * The place the bearing bones keep. Input props of WorkoutPlace.of. The
   * action's context, the kind, the standing posture the exercise is entered
   * from, the first key, and the prop's place when one bears the body.
   */
  export type IOfProps = {
    /**
     * Borrowed body and entry state used to find an admissible exercise
     * placement.
     */
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">;
    /** Exercise family whose support geometry is being placed. */
    kind: IAutoMovieMotionHumanWorkoutKind;
    /** Reference standing posture before the exercise placement. */
    standing: IAutoMovieMotionHumanPosture;
    /** First exercise key whose contacts determine entry placement. */
    first: IAutoMovieMotionHumanExerciseKey.IKey;
    /**
     * World-space point, metres, on which weight is borne; null means no
     * externally supplied bearing point.
     */
    borne: IAutoMovieVector3 | null;
  };
}
