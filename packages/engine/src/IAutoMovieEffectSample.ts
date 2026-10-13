import { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/** One bounded deterministic effect sample. */
export interface IAutoMovieEffectSample {
  /** Fixed-step shot time actually sampled. */
  time: number;
  /** Whether the cue is active at that step. */
  active: boolean;
  /** Sampled cue intensity. */
  intensity: number;
  /** Live particles after deterministic distance thinning and hard cap. */
  particles: IAutoMovieEffectParticle[];
}
