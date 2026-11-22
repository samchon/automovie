import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Seeded environmental billboard emitter with explicit transport and live-instance budgets. Fog, smoke and dust share the same bounded stream representation.
 *
 * @evidence contracts/development/design.md#principled-representation Seeded emission, lifetime and initial size ranges, an optional bounded final size, transport velocities and an integer live-particle cap define the intended stream domain. sampleCompiledEffect checks exact time membership and derives state using the fixed step and cue bounds. materializeCompiledEffects checks that a supplied final size is finite and between the maximum initial size and 20 metres. The other documented ranges and positive step remain caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Emission, appearance, motion and runtime budget form separate groups, with one closed effect-family discriminator and one supported alpha blend law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Effect names select no hidden subject preset. With an admitted integer cap, sampling stops after maxParticles live outputs and far-distance thinning retains indices divisible by four; candidate arrays can exceed that cap, and the sampler does not validate malformed direct recipes.
 * @evidence contracts/development/common.md#meaningful-documentation States seed ownership, emission rate and duration, lifetime and initial and final sizes in metres, RGB appearance, opacity, metre-per-second transport and hard live-instance and LOD limits.
 */
export interface IAutoMovieEffectRecipe {
  /** Stable recipe id. */
  id: string;

  /** Supported primitive effect family. */
  kind: "fog" | "smoke" | "dust" | "spray";

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
    lifetime: {
      /** Shortest sampled lifetime, seconds. */
      min: number;

      /** Longest sampled lifetime, seconds, at least min. */
      max: number;
    };

    /** Ordered inclusive initial world-size endpoints in metres, within `[0.01, 20]`. */
    size: {
      /** Smallest sampled billboard extent, world metres. */
      min: number;

      /** Largest sampled billboard extent, world metres, at least min. */
      max: number;

      /**
       * Final airborne billboard extent in metres, from max through 20.
       * The extent grows linearly from its seeded initial size over the
       * particle lifetime, or stops growing on landing. Omit for fixed size.
       */
      end?: number;
    };

    /** Exact opaque hexadecimal RGB color. */
    color: string;

    /** Inclusive alpha range from zero through one. */
    opacity: {
      /** Lower unitless sampled alpha, within [0, 1]. */
      min: number;

      /** Upper unitless sampled alpha, within [min, 1]. */
      max: number;
      /** Alpha over a live particle's lifetime; defaults to the original sine envelope. */ envelope?:
        | "sine"
        | "constant";
    };
  };

  /** Bounded deterministic transport. */
  motion: {
    /** Finite world velocity components in metres per second, each within `[-50, 50]`. */
    wind: IAutoMovieVector3;

    /** Finite additional upward metres per second, within `[-50, 50]`. */
    rise: number;

    /** Finite maximum lateral velocity deviation in metres per second, within `[0, 50]`. */
    turbulence: number;

    /** Optional ballistic transport; omission preserves the original v1 stream. */
    ballistic?: {
      /** Nonnegative downward acceleration, m/s². */
      gravity: number;
      /** Horizontal landing plane, world metres. */
      floor: number;
      /** Keep particles which land before their lifetime expires as floor-facing stains through the cue end. */
      retainStains: boolean;
      /** Independent world-axis initial velocity half-ranges, m/s, each 0..50; omission adds no spread. */
      velocitySpread?: IAutoMovieVector3;
      /** Landed billboard size multiplier, (0,16]; omission retains its airborne size. */
      stainSizeMultiplier?: number;
    };
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
