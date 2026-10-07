import type { compileDefinedShot } from "@automovie/engine";
import type { IAutoMovieGait, IAutoMovieSkeleton, IAutoMovieTransform } from "@automovie/interface";
import type { makeStagingWrite } from "./filmFixtures";
import type { IFilmCompileWalkInput } from "./IFilmCompileWalkInput";

/** Original shared rig, grounded stage and gait compilation owners. */
export interface IFilmDefinedShotContinuityInputs {
  /** The existing bent-rest skeleton passed across shots. */
  rig: IAutoMovieSkeleton;

  /** Original translated and facing stage. */
  groundedStage: ReturnType<typeof makeStagingWrite>;

  /** Original walking gait definition. */
  WALK: IAutoMovieGait;

  /** Compile the same walking shot. */
  compileWalk(props: IFilmCompileWalkInput): ReturnType<typeof compileDefinedShot>;

  /** Construct an original rest transform. */
  restAt(x: number, y: number, z: number): IAutoMovieTransform;
}
