import type {
  IAutoMovieJointAxes,
  IAutoMovieRestFrame,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBeatEndState,
  IAutoMovieGait,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { makeStagingWrite } from "./filmFixtures";

/** Original shot compilation inputs for planted gait continuity. */
export interface IFilmCompileWalkInput {
  /** Original shot identity. */
  id: string;

  /** Original skeleton and rest pose. */
  rig: IAutoMovieSkeleton;

  /** Original actor and camera staging. */
  stage: ReturnType<typeof makeStagingWrite>;

  /** Original world-space walking target in metres. */
  target: IAutoMovieVector3;

  /** Optional original beat-end state carried into this shot. */
  previous?: IAutoMovieBeatEndState;

  /** Optional original walking speed in metres per second. */
  speed?: number;

  /** Optional original duration in seconds or automatic choice. */
  duration?: number | "auto";

  /** Optional original gait replacing the shared walk. */
  gait?: IAutoMovieGait;

  /** Optional original clinical axis mapping. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional original neutral frames. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
