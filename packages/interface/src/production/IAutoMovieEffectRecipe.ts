import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Seeded environmental billboard emitter with explicit transport and
 * live-instance budgets. Fog, smoke and dust share the same bounded stream
 * representation.
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

    /**
     * Ordered inclusive initial world-size endpoints in metres, within `[0.01,
     * 20]`.
     */
    size: {
      /** Smallest sampled billboard extent, world metres. */
      min: number;

      /** Largest sampled billboard extent, world metres, at least min. */
      max: number;

      /**
       * Final airborne billboard extent in metres, from max through 20. The
       * extent grows linearly from its seeded initial size over the particle
       * lifetime, or stops growing on landing. Omit for fixed size.
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
      /**
       * Alpha over a live particle's lifetime; defaults to the original sine
       * envelope.
       */ envelope?: "sine" | "constant";
    };
  };

  /** Bounded deterministic transport. */
  motion: {
    /**
     * Finite world velocity components in metres per second, each within `[-50,
     * 50]`.
     */
    wind: IAutoMovieVector3;

    /** Finite additional upward metres per second, within `[-50, 50]`. */
    rise: number;

    /**
     * Finite maximum lateral velocity deviation in metres per second, within
     * `[0, 50]`.
     */
    turbulence: number;

    /** Optional ballistic transport; omission preserves the original v1 stream. */
    ballistic?: {
      /** Nonnegative downward acceleration, m/s². */
      gravity: number;
      /** Horizontal landing plane, world metres. */
      floor: number;
      /**
       * Keep particles which land before their lifetime expires as floor-facing
       * stains through the cue end.
       */
      retainStains: boolean;
      /**
       * Independent world-axis initial velocity half-ranges, m/s, each 0..50;
       * omission adds no spread.
       */
      velocitySpread?: IAutoMovieVector3;
      /**
       * Landed billboard size multiplier, (0,16]; omission retains its airborne
       * size.
       */
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
