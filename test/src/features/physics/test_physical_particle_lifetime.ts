import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { materializeCompiledEffects } from "../../../../packages/engine/src/effectRuntime/materializeCompiledEffects";
import { sampleCompiledEffect } from "../../../../packages/engine/src/sampleCompiledEffect";

/** Retention cannot resurrect a particle after its declared lifetime.
 *
 * Scenarios:
 * 1. A stain formed before expiry remains on later seeks.
 * 2. Landing at or after expiry produces no later stain.
 * 3. Random read order preserves the complete lifecycle.
 */
export function test_physical_particle_lifetime(): void {
  for (const height of [0.1, 9.81 / 2, 100]) {
    const recipe: IAutoMovieEffectRecipe = {
      id: "lifecycle",
      kind: "spray",
      seed: 1,
      emission: { rate: 0, burst: 1, duration: 0.1 },
      particle: {
        lifetime: { min: 1, max: 1 },
        size: { min: 0.01, max: 0.01 },
        color: "#335577",
        opacity: { min: 1, max: 1, envelope: "constant" },
      },
      motion: {
        wind: { x: 0, y: 0, z: 0 },
        rise: 0,
        turbulence: 0,
        ballistic: { gravity: 9.81, floor: 0, retainStains: true },
      },
      budget: { maxParticles: 1, lodDistance: 100 },
      blend: "alpha",
    };
    const effect: IAutoMovieCompiledEffect = materializeCompiledEffects({
      world: {
        effectRecipes: [recipe],
        effectZones: [
          {
            id: recipe.id,
            recipe: recipe.id,
            seed: 1,
            bounds: {
              min: { x: 0, y: height, z: 0 },
              max: { x: 0, y: height, z: 0 },
            },
          },
        ],
      },
      seedOwner: { production: "independent-lifecycle", film: "surface" },
      fixedStepSeconds: 1 / 120,
      cues: [
        {
          id: "lifecycle",
          zone: recipe.id,
          start: 0,
          end: 10,
          intensity: { from: 1, to: 1 },
        },
      ],
    })[0]!;
    const late: ReturnType<typeof sampleCompiledEffect> = sampleCompiledEffect(
      effect,
      8,
    );
    const landedLive: boolean = Math.sqrt((2 * height) / 9.81) < 1;
    TestValidator.equals(
      "only a live landing can retain a stain",
      late.particles.length,
      landedLive ? 1 : 0,
    );
    if (landedLive)
      TestValidator.predicate(
        "retained stain stays at its declared floor",
        Math.abs(late.particles[0]!.position.y) < 1e-12,
      );
    TestValidator.equals(
      "live airborne sample is present before expiry",
      sampleCompiledEffect(effect, 0.1).particles.length,
      1,
    );
    if (!landedLive)
      TestValidator.equals(
        "expired airborne sample remains absent",
        sampleCompiledEffect(effect, 2).particles.length,
        0,
      );
    sampleCompiledEffect(effect, 0.5);
    TestValidator.equals(
      "late lifecycle is seek-order independent",
      JSON.stringify(sampleCompiledEffect(effect, 8)),
      JSON.stringify(late),
    );
  }
}
