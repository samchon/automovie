import type { IAutoMovieEffectRecipe } from "../production/IAutoMovieEffectRecipe";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";

/**
 * Compile contact-driven spray through the existing effect stream and sampler.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents receipt authority, geometric impulse estimates, film timing and explicit effect budgets.
 * @evidence contracts/development/design.md#principled-representation Contact impulses are N s, sample clocks seconds, transport speed m/s and particle density particles per N s; the recipe owns appearance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileImpactEffects consumes canonical receipts and effect recipes, producing the existing effect stream rather than a material preset.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry-only receipts require explicit impulse estimates, and exceeding maximumEffects is refused instead of dropping authored effects.
 */
export namespace IAutoMovieCompileImpactEffects {
  /**
   * Compile contact-driven spray through the existing effect stream and sampler.
   * Colour, accumulation and physical coefficients belong to the provider or
   * production; Engine has no skin, coat, blood or species preset. Each stream
   * seed/digest covers actual contact bytes and its complete recipe. Kinematic
   * callers must explicitly supply their formula-derived impulse estimate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents receipt authority, geometric impulse estimates, film timing and explicit effect budgets.
   * @evidence contracts/development/design.md#principled-representation Contact impulses are N s, sample clocks seconds, transport speed m/s and particle density particles per N s; the recipe owns appearance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compileImpactEffects consumes canonical receipts and effect recipes, producing the existing effect stream rather than a material preset.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry-only receipts require explicit impulse estimates, and exceeding maximumEffects is refused instead of dropping authored effects.
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
