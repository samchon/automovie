import type { ISpringStep } from "@automovie/engine";

/**
 * One axis's displayed angle and the solver state carried to the next frame.
 * Null keeps a never-authored, never-sprung axis absent; an existing spring may
 * still decay after its target disappears. State retention is the player's.
 *
 * @author Samchon
 */
export interface IAutoMovieSpringAxisSettlement {
  /**
   * Sprung pose angle in degrees, or null when both target and spring history are absent.
   */
  angle: number | null;

  /** Axis value and velocity retained by this player's per-joint spring map. */
  next: ISpringStep;
}
