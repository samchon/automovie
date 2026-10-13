import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One bounded deterministic environmental-effect emitter recipe. */
export interface IAutoMovieEffectRecipe {
  /** Stable recipe id. */
  id: string;

  /** Supported primitive effect family. */
  kind: "fog" | "smoke" | "dust";

  /** Explicit deterministic recipe seed. */
  seed: number;

  /** Bounded deterministic emission. */
  emission: {
    /** Particles emitted per second. */
    rate: number;

    /** Particles emitted at cue start. */
    burst: number;

    /** Maximum emitting duration in seconds. */
    duration: number;
  };

  /** Bounded billboard appearance. */
  particle: {
    /** Inclusive lifetime range in seconds. */
    lifetime: { min: number; max: number };

    /** Inclusive world-size range in meters. */
    size: { min: number; max: number };

    /** Exact opaque hexadecimal RGB color. */
    color: string;

    /** Inclusive alpha range from zero through one. */
    opacity: { min: number; max: number };
  };

  /** Bounded deterministic transport. */
  motion: {
    /** World-space meters per second. */
    wind: IAutoMovieVector3;

    /** Additional upward meters per second. */
    rise: number;

    /** Maximum seeded lateral velocity deviation. */
    turbulence: number;
  };

  /** Hard runtime and LOD budgets. */
  budget: {
    /** Maximum live billboard instances. */
    maxParticles: number;

    /** Distance beyond which deterministic thinning applies. */
    lodDistance: number;
  };

  /** Only supported transparency law. */
  blend: "alpha";
}
