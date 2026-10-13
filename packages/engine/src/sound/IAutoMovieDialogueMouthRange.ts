import type { IAutoMovieProductionViseme } from "@automovie/interface";

/** One gap-free mouth range on the emission clock. */
export interface IAutoMovieDialogueMouthRange {
  /** Inclusive film-global emission frame. */
  startFrame: number;
  /** Exclusive film-global emission frame. */
  endFrame: number;
  /** Derived mouth preset or explicit rest. */
  viseme: IAutoMovieProductionViseme["viseme"];
}
