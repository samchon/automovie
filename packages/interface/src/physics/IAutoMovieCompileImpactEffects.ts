import type { IAutoMovieEffectRecipe } from "../production/IAutoMovieEffectRecipe";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";

/** Compile contact-driven spray through the existing effect stream and sampler. */
export namespace IAutoMovieCompileImpactEffects {
  /**
   * Compile contact-driven spray through the existing effect stream and
   * sampler. Colour, accumulation and physical coefficients belong to the
   * provider or production; Engine has no skin, coat, blood or species preset.
   * Each stream seed/digest covers actual contact bytes and its complete
   * recipe. Kinematic callers must explicitly supply their formula-derived
   * impulse estimate.
   */
  export type IInput = {
    /** Chronological actual contact episodes, including source identity. */
    contacts: readonly IAutoMovieContactReceipt[];
    /** Formula-derived N s estimates for geometry-only receipts. */
    geometricImpulses: Readonly<Record<string, number>>;
    /** Provider-authored effect appearance, transport and budget. */
    recipe: IAutoMovieEffectRecipe;
    /** Film end, seconds; stains remain only to this cue end. */
    endSeconds: number;
    /** Absolute effect sample step in seconds. */
    fixedStepSeconds: number;
    /** Particle count per N s, before the recipe budget cap. */
    particlesPerImpulse: number;
    /** Outward speed in m/s per N s. */
    speedPerImpulse: number;
    /** World-up velocity fraction relative to outward speed. */
    upwardFraction: number;
    /** Explicit total stream cap; excess is refused, never silently dropped. */
    maximumEffects: number;
  };
}
