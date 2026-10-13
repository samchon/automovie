import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Seeded environmental billboard emitter with explicit transport and live-instance budgets. Fog, smoke and dust share the same bounded stream representation.
 *
 * @evidence contracts/common.md#principled-implementation Seeded emission, finite lifetime and size ranges, transport velocities and a maximum particle count define a repeatable bounded stream; sampling derives particle state from cue time and fixed simulation step rather than ambient random calls.
 * @evidence contracts/common.md#clear-and-simple-design Emission, appearance, motion and runtime budget form separate groups, with one closed effect-family discriminator and one supported alpha blend law.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Effect names do not select hidden subject presets or unbounded emission, and the declared live budget and deterministic distance thinning bound visible particles instead of changing their seed law.
 * @evidence contracts/common.md#meaningful-documentation States seed ownership, emission rate and duration, lifetime and metre size ranges, RGB appearance, opacity, metre-per-second transport and hard live-instance and LOD limits.
 * @author Samchon
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
