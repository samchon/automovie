import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Seeded environmental billboard emitter with explicit transport and live-instance budgets. Fog, smoke and dust share the same bounded stream representation.
 *
 * @evidence contracts/common.md#principled-implementation Seeded emission, lifetime/size ranges, transport velocities and an integer live-particle cap define the intended stream domain. sampleCompiledEffect derives state from cue time floored to the absolute step with a 1e-9 quotient allowance; the documented numeric ranges and positive step remain caller premises after whole-world gate retirement.
 * @evidence contracts/common.md#clear-and-simple-design Emission, appearance, motion and runtime budget form separate groups, with one closed effect-family discriminator and one supported alpha blend law.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Effect names select no hidden subject preset. With an admitted integer cap, sampling stops after maxParticles live outputs and far-distance thinning retains indices divisible by four; candidate arrays can exceed that cap, and the sampler does not validate malformed direct recipes.
 * @evidence contracts/common.md#meaningful-documentation States seed ownership, emission rate and duration, lifetime and metre size ranges, RGB appearance, opacity, metre-per-second transport and hard live-instance and LOD limits.
 */
export interface IAutoMovieEffectRecipe {
  /** Stable recipe id. */
  id: string;

  /** Supported primitive effect family. */
  kind: "fog" | "smoke" | "dust";

  /** Explicit nonnegative safe-integer deterministic seed. */
  seed: number;

  /** Bounded deterministic emission. */
  emission: {
    /** Finite particles per second, within `[0, 1024]`. */
    rate: number;

    /** Integer particles emitted at cue start, within `[0, 4096]`. */
    burst: number;

    /** Finite emitting duration in seconds, within `[1 / 240, 60]`. */
    duration: number;
  };

  /** Bounded billboard appearance. */
  particle: {
    /** Ordered inclusive lifetime endpoints in seconds, within `[1 / 240, 30]`. */
    lifetime: { min: number; max: number };

    /** Ordered inclusive world-size endpoints in metres, within `[0.01, 20]`. */
    size: { min: number; max: number };

    /** Exact opaque hexadecimal RGB color. */
    color: string;

    /** Inclusive alpha range from zero through one. */
    opacity: { min: number; max: number };
  };

  /** Bounded deterministic transport. */
  motion: {
    /** Finite world velocity components in metres per second, each within `[-50, 50]`. */
    wind: IAutoMovieVector3;

    /** Finite additional upward metres per second, within `[-50, 50]`. */
    rise: number;

    /** Finite maximum lateral velocity deviation in metres per second, within `[0, 50]`. */
    turbulence: number;
  };

  /** Hard runtime and LOD budgets. */
  budget: {
    /** Integer maximum live billboard instances, within `[1, 4096]`. */
    maxParticles: number;

    /** Finite thinning distance in metres, within `[0.1, 2000]`. */
    lodDistance: number;
  };

  /** Only supported transparency law. */
  blend: "alpha";
}
