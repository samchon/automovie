import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One inclusive run of sampled ground-plus-tolerance contacts and its fixed
 * model-frame solve target. New targets use sampled ground Y; prior-beat
 * opening pins may supply another position. Reach and ROM constraints can leave
 * residual, so the record does not certify exact held contact. Start/end are
 * clip-local seconds, and position is shared with the per-frame targets.
 */
export interface IAutoMovieFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;

  /** Inclusive stance-run start, seconds. */
  start: number;

  /** Inclusive stance-run end, seconds. */
  end: number;

  /**
   * Fixed model-frame solve target; ground-snapped unless an opening pin
   * supplied it.
   */
  position: IAutoMovieVector3;
}
