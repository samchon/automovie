import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The actor root's shot-local world transform at one sampled instant.
 *
 * @author Samchon
 */
export interface IAutoMovieActorWorldFrame {
  /** Actor-root position in world space. */
  position: IAutoMovieVector3;
  /** Actor-root orientation in world space. */
  rotation: IAutoMovieQuaternion;
  /** Authored yaw in degrees retained for locomotion synthesis. */
  facingDeg: number;
}
