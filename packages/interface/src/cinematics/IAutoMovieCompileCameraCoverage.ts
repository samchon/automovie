import type { IAutoMovieProductionFrameRate } from "../production/IAutoMovieProductionFrameRate";
import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";
import type { IAutoMovieCameraCoverageEntry } from "./IAutoMovieCameraCoverageEntry";

/** Data and callback contracts shared by the CompileCameraCoverage operations. */
export namespace IAutoMovieCompileCameraCoverage {
  /**
   * Compile one coverage take: the alternate angle another staged camera plays
   * over a beat, as an {@link IAutoMovieShotCoverage} record.
   *
   * The camera clip comes from {@link compileCameraMove} with this camera as its
   * parameter, so the side staging gave it is the side the angle plays from,
   * and `cameraIntent` lists each entry's intent in entry order. The intent is
   * guide metadata for a render host and never feeds the solve. Entries must be
   * sorted by `start` and must not overlap, as for the hero take; an empty list
   * yields a locked-off take with `cameraMotion: null` and no intent spans.
   * Throws whatever {@link compileCameraMove} throws for a framing or move
   * outside the grammar.
   */
  export type IProps = {
    /** The covering camera, staged in the same scene as the hero. */
    camera: IAutoMovieCamera;

    /** Id the take's camera clip carries. */
    clipId: string;

    /** Frame entries with their intents, sorted by start and non-overlapping. */
    entries: IAutoMovieCameraCoverageEntry[];

    /** Shot length in seconds. */
    shotDuration: number;

    /** Frame width over height, as {@link compileCameraMove} reads it. */
    aspect?: number;

    /**
     * Exact delivery frame rate the moving paths are keyed at, as
     * {@link compileCameraMove} reads it.
     */
    frameRate?: IAutoMovieProductionFrameRate;
  };
}
