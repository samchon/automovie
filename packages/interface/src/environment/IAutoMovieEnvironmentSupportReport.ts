import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import type { IAutoMovieWallMount } from "./IAutoMovieWallMount";

/** Inputs of the scene-wide set-piece support report. */
export namespace IAutoMovieEnvironmentSupportReport {
  /**
   * The staged set of a composed environment and everything that can bear it.
   *
   * Instance-set populations are not set pieces and are not reported.
   */
  export type IProps = {
    /** Every staged set piece, reported in this order. */
    set: readonly IAutoMovieStageSetPiece[];

    /** Runtime models by id; a piece's rest extent is its model's. */
    models: readonly IAutoMovieModel[];

    /** Prop records; a prop with a `placement` is reported `declared`. */
    props: readonly IAutoMoviePropSpec[];

    /**
     * Merged stage space whose walkable surfaces bear pieces; omitted means
     * none.
     */
    space?: IAutoMovieSpace;

    /** Wall mounts of furnishing `wall` relations; omitted means none. */
    mounts?: readonly IAutoMovieWallMount[];

    /**
     * Composed buildings, each with the world height of its placement frame,
     * whose bodies the building support sweep judges.
     */
    buildings?: readonly IBuilding[];

    /** Contact slack in metres. Defaults to `AUTOMOVIE_SUPPORT_TOLERANCE`. */
    tolerance?: number;
  };

  /** One composed building and the ground height its sweep uses. */
  export interface IBuilding {
    /** The building record. */
    environment: IAutoMovieBuiltEnvironment;

    /** World height of the building's placement frame, in metres. */
    groundY: number;
  }
}
