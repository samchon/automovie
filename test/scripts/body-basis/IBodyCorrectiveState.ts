import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

/** One owned census/axis state, with complete TT goals independent of Euler rows. */
export interface IBodyCorrectiveState {
  /** Stable label within the source set. */
  name: string;
  /** Census set or single-axis origin. */
  set: string;
  /** States that must be solved in order on one shard. */
  group: string;
  /** Named shape channel weights. */
  shape: Record<string, number>;
  /** Non-humeral clinical rows, null axes at rest. */
  pose: IAutoMovieJointPose[];
  /** Complete thorax-relative shoulder goals; omission keeps native shaped rest. */
  shoulders?: IAutoMovieHumanBodyShoulderPose[];
}
