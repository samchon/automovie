import type { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/** The fields every advice state carries. */
export interface IAutoMovieShotPhysicsAdviceBase {
  /** Advice id chosen by the supplier; non-blank and unique within the shot. */
  id: string;

  /**
   * The engine-computed collision response: impact, recoil push and, when a
   * struck chain was given, the ROM-bounded flinch pose.
   */
  proposal: IAutoMovieCollisionResponse;
}
