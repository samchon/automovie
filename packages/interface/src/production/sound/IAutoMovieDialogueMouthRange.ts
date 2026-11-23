import type { IAutoMovieProductionViseme } from "../IAutoMovieProductionViseme";

/**
 * One half-open mouth interval on the film-global emission clock.
 */
export interface IAutoMovieDialogueMouthRange {
  /** Inclusive film-global emission frame. */
  startFrame: number;

  /** Exclusive film-global emission frame. */
  endFrame: number;

  /** Derived mouth preset or explicit rest. */
  viseme: IAutoMovieProductionViseme["viseme"];
}
