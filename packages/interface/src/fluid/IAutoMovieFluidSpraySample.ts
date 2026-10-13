import { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/** One bounded decorative spray sample at an absolute step. */
export interface IAutoMovieFluidSpraySample {
  /** Absolute integer step index sampled. */
  step: number;

  /** Absolute domain-clock second sampled. */
  time: number;

  /** Live particles after distance thinning and the hard per-emitter cap. */
  particles: IAutoMovieFluidSprayParticle[];
}
