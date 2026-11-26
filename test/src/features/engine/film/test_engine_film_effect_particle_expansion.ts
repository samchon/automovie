import {
  AutoMovieEngineEffect,
  materializeCompiledEffects,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieEffectSample,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectRecipe } from "../../internal/filmEffectRecipe";
import { nclose, throwsError } from "../../internal/predicates";

/**
 * A localized effect can widen by individual particle age and stop growing at
 * landing.
 *
 * Scenarios:
 *
 * 1. Grow staggered particles from their initial extent, independent of seek
 *    order.
 * 2. Keep an omitted endpoint at its seeded extent and stop a retained stain's
 *    growth at landing.
 * 3. Admit the lower and upper endpoints and refuse illegal sizes at
 *    materialization.
 */
export function test_engine_film_effect_particle_expansion(): void {
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
  const older: IAutoMovieEffectSample = AutoMovieEngineEffect.sample(
    expanding,
    1.75,
  );
  const halfway: IAutoMovieEffectSample = AutoMovieEngineEffect.sample(
    expanding,
    1.5,
  );
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
    nclose(AutoMovieEngineEffect.sample(fixed, 1.75).particles[0].size, 0.1) &&
      nclose(AutoMovieEngineEffect.sample(stain, 1.5).particles[0].size, 0.4) &&
      nclose(AutoMovieEngineEffect.sample(stain, 2.25).particles[0].size, 0.4),
  );

  const endpoints: readonly [number, number][] = [
    [0.1, 0.1],
    [20, 10.05],
  ];
  for (const [end, halfwaySize] of endpoints)
    TestValidator.predicate(
      `endpoint ${end} m is accepted and used at half life`,
      nclose(
        AutoMovieEngineEffect.sample(compile(end), 1.5).particles[0].size,
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
