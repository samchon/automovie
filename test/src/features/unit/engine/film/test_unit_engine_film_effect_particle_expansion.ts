import {
  materializeCompiledEffects,
  sampleCompiledEffect,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieEffectSample,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectRecipe } from "../../../internal/filmEffectRecipe";
import { nclose, throwsError } from "../../../internal/predicates";

/**
 * A localized effect can widen by individual particle age and stop growing at landing.
 *
 * Scenarios:
 * 1. Grow staggered particles from their initial extent, independent of seek order.
 * 2. Keep an omitted endpoint at its seeded extent and stop a retained stain's growth at landing.
 * 3. Admit the lower and upper endpoints and refuse illegal sizes at materialization.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Materializes authored recipes and reads the sampler's returned extents at birth, midlife and after landing; this detects cue-clock growth, changing old recipes, and growth of retained stains.
 * @evidence contracts/development/testing.md#independent-expectations A one-second lifetime and 0.1 m to 0.3 m interpolation give 0.2 m at half life and 0.25 m at three-quarter life. A 0.5 m drop at 1 m/s lands after 0.5 s and leaves a 0.4 m stain after doubling. The midpoint of 0.1 m and the admitted 20 m endpoint is 10.05 m. Numerical comparisons allow floating-point rounding without judging a rendered plume.
 * @evidence contracts/development/testing.md#distinguishing-cases Burst and regular particles at one step distinguish individual ages. Omission, equality, the 20 m upper limit, malformed endpoints, reverse seeking and the retained stain distinguish each new decision. General stream ordering and ownership belong to the film materialization tests.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous test runs shared materialization and sampling on in-memory records and starts no production host or viewer.
 * @evidence contracts/development/common.md#meaningful-documentation Names the growth, omission, settling and admission cases and their observable results.
 */
export function test_unit_engine_film_effect_particle_expansion(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 0.5, z: 0 };
  const compile: (
    end?: number,
    ballistic?: boolean,
  ) => IAutoMovieCompiledEffect = (
    end?: number,
    ballistic: boolean = false,
  ): IAutoMovieCompiledEffect => {
    const recipe: IAutoMovieEffectRecipe = filmEffectRecipe();
    recipe.emission = { rate: 2, burst: 1, duration: 1 };
    recipe.particle.lifetime = { min: 1, max: 1 };
    recipe.particle.size = {
      min: 0.1,
      max: 0.1,
      ...(end === undefined ? {} : { end }),
    };
    recipe.motion = {
      wind: { x: 0, y: 0, z: 0 },
      rise: ballistic ? -1 : 1,
      turbulence: 0,
      ...(ballistic
        ? {
            ballistic: {
              gravity: 0,
              floor: 0,
              retainStains: true,
              stainSizeMultiplier: 2,
            },
          }
        : {}),
    };
    const [effect]: IAutoMovieCompiledEffect[] = materializeCompiledEffects({
      world: {
        effectRecipes: [recipe],
        effectZones: [
          {
            id: "outlet",
            recipe: recipe.id,
            seed: 11,
            bounds: { min: origin, max: origin },
          },
        ],
      },
      seedOwner: { production: "production", film: "film" },
      fixedStepSeconds: 0.25,
      cues: [
        {
          id: "release",
          zone: "outlet",
          start: 1,
          end: 3,
          intensity: { from: 1, to: 1 },
        },
      ],
    });
    return effect;
  };

  const expanding: IAutoMovieCompiledEffect = compile(0.3);
  const older: IAutoMovieEffectSample = sampleCompiledEffect(expanding, 1.75);
  const halfway: IAutoMovieEffectSample = sampleCompiledEffect(expanding, 1.5);
  TestValidator.predicate(
    "different birth times produce different extents at one seek",
    older.particles.length === 2 &&
      halfway.particles.length === 2 &&
      nclose(older.particles[0].size, 0.25) &&
      nclose(older.particles[1].size, 0.15) &&
      nclose(halfway.particles[0].size, 0.2) &&
      nclose(halfway.particles[1].size, 0.1),
  );

  const fixed: IAutoMovieCompiledEffect = compile();
  const stain: IAutoMovieCompiledEffect = compile(0.3, true);
  TestValidator.predicate(
    "legacy extent stays fixed and the retained stain keeps its landing extent",
    nclose(sampleCompiledEffect(fixed, 1.75).particles[0].size, 0.1) &&
      nclose(sampleCompiledEffect(stain, 1.5).particles[0].size, 0.4) &&
      nclose(sampleCompiledEffect(stain, 2.25).particles[0].size, 0.4),
  );

  const endpoints: readonly [number, number][] = [
    [0.1, 0.1],
    [20, 10.05],
  ];
  for (const [end, halfwaySize] of endpoints)
    TestValidator.predicate(
      `endpoint ${end} m is accepted and used at half life`,
      nclose(
        sampleCompiledEffect(compile(end), 1.5).particles[0].size,
        halfwaySize,
      ),
    );
  for (const invalid of [0.09, 20.01, NaN, Infinity])
    TestValidator.predicate(
      `final extent ${invalid} fails materialization`,
      throwsError((): void => {
        compile(invalid);
      }, "Invalid effect final particle extent"),
    );
}
