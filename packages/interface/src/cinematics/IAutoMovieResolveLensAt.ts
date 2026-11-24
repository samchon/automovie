import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * Data contracts of `resolveAutoMovieLensAt`, which reads a shot's lens intent
 * at one second as the stop and focused depth a directly rendered frame draws.
 */
export namespace IAutoMovieResolveLensAt {
  /** The shot's lens intent and where its camera stands at the second. */
  export type IProps = {
    /** The shot's `cameraIntent`, in any order. */
    intents: readonly IAutoMovieCameraIntent[];

    /** Shot-local second, on the clock of the intents' `start` and marks. */
    seconds: number;

    /** The camera's world position at that second, in metres. */
    position: IAutoMovieVector3;

    /**
     * The camera's world forward axis at that second, its local -Z; any
     * non-zero length.
     */
    forward: IAutoMovieVector3;
  };
}
