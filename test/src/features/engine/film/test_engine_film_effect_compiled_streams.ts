import { AutoMovieEngineEffect } from "@automovie/engine";
import {
  IAutoMovieCompiledEffect,
  IAutoMovieShotContract,
  IAutoMovieShotEffectCue,
  IAutoMovieWorldDesign,
  IAutoMovieWorldEffectZone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectRecipe } from "../../internal/filmEffectRecipe";
import { filmEffectWorld } from "../../internal/filmEffectWorld";
import { filmEffectZone } from "../../internal/filmEffectZone";
import { nodeCanonicalDigest } from "../../internal/nodeCanonicalDigest";
import { shotContractFixture } from "../../internal/shotContractFixture";

/**
 * Effect streams preserve their owner protocol, ordered cue identity and
 * independent input data.
 *
 * Scenarios:
 *
 * 1. Materialize sorted cues, skip unresolved zones/recipes and preserve optional
 *    events.
 * 2. Check shot/film domain-separated seeds, canonical digests and requested
 *    clocks.
 * 3. Mutate emitted bounds, recipe and intensity without changing authored inputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify sorted declared cues, missing binding cases, shot and film identity, and independent output data.
 * @evidence contracts/development/testing.md#behavioral-verification The test materializes effects under both ownership protocols and observes order, seeds, digests, event references and clocks. It mutates the returned bounds, recipe and intensity, then checks the original input.
 * @evidence contracts/development/testing.md#independent-expectations The authored cue IDs and protocol inputs establish the expected order, selected resources and independent digest. Distinct shot and film domains require their distinct seeds. A returned copy must preserve the original authored records after mutation.
 */
export function test_engine_film_effect_compiled_streams(): void {
  const contract: IAutoMovieShotContract = shotContractFixture("shot-1");
  const world: IAutoMovieWorldDesign = {
    ...filmEffectWorld(),
    effectZones: [
      filmEffectZone("yard"),
      filmEffectZone("gate", "fog-recipe", 5),
      filmEffectZone("ruin", "missing-recipe", 9),
    ],
  };
  const cues: IAutoMovieShotEffectCue[] = [
    { id: "b", zone: "gate", start: 1, end: 2, intensity: { from: 0, to: 1 } },
    {
      id: "a",
      zone: "yard",
      start: 0,
      end: 1,
      intensity: { from: 1, to: 0.5 },
      event: "door-opens",
    },
    {
      id: "lost",
      zone: "moat",
      start: 0,
      end: 1,
      intensity: { from: 1, to: 1 },
    },
    {
      id: "orphan",
      zone: "ruin",
      start: 0,
      end: 1,
      intensity: { from: 1, to: 1 },
    },
  ];

  const shot: IAutoMovieCompiledEffect[] = AutoMovieEngineEffect.materializeCompiledEffects({
    world,
    contract,
    fixedStepSeconds: 1 / 30,
    cues,
  });
  TestValidator.equals(
    "shot streams are ordered, filtered, and carry their event",
    shot.map(
        (
          stream: IAutoMovieCompiledEffect,
        ): {
          id: string;
          zone: string;
          kind: IAutoMovieCompiledEffect["kind"];
          event: string | null;
          window: number[];
          step: number;
        } => ({
          id: stream.id,
          zone: stream.zone,
          kind: stream.kind,
          event: stream.event ?? null,
          window: [stream.start, stream.end],
          step: stream.fixedStepSeconds,
        }),
      ),
      [
        {
          id: "a",
          zone: "yard",
          kind: "fog",
          event: "door-opens",
          window: [0, 1],
          step: 1 / 30,
        },
        {
          id: "b",
          zone: "gate",
          kind: "fog",
          event: null,
          window: [1, 2],
          step: 1 / 30,
        },
      ],
  );
  const zoneSeed: (id: string) => number = (id: string): number =>
    world.effectZones.find(
      (zone: IAutoMovieWorldEffectZone): boolean => zone.id === id,
    )!.seed;
  TestValidator.equals(
    "shot seeds and digests follow the shot stream protocol",
    shot.map((stream: IAutoMovieCompiledEffect): (string | number)[] => [
      stream.seed,
      stream.digest,
    ]),
    shot.map((stream: IAutoMovieCompiledEffect): (string | number)[] => [
      Number.parseInt(
        nodeCanonicalDigest({
          protocol: "automovie.effect-stream.v1",
          shot: "shot-1",
          cue: stream.id,
          recipeSeed: 7,
          zoneSeed: zoneSeed(stream.zone),
        }).slice(7, 20),
        16,
      ),
      nodeCanonicalDigest({ ...stream, digest: undefined }),
    ]),
  );
  shot[0]!.bounds.min.x = 99;
  shot[0]!.recipe.seed = 99;
  shot[0]!.intensity.from = 99;
  TestValidator.equals(
    "emitted data does not alias the authored world or cue",
    [
        world.effectZones[0]!.bounds.min.x,
        world.effectRecipes[0]!.seed,
        cues[1]!.intensity.from,
      ],
    [-1, 7, 1],
  );

  const owner: { production: string; film: string } = {
    production: "p",
    film: "f",
  };
  const film: IAutoMovieCompiledEffect = AutoMovieEngineEffect.materializeCompiledEffects({
    world,
    seedOwner: owner,
    fixedStepSeconds: 0.125,
    cues: [cues[1]!],
  })[0]!;
  TestValidator.equals(
    "film streams follow the film seed protocol and the supplied step",
    [film.seed, film.fixedStepSeconds, film.digest],
      [
        Number.parseInt(
          nodeCanonicalDigest({
            protocol: "automovie.film-effect-seed.v1",
            owner,
            cue: "a",
            recipe: filmEffectRecipe(),
            zone: filmEffectZone("yard"),
          }).slice(7, 20),
          16,
        ),
        0.125,
        nodeCanonicalDigest({ ...film, digest: undefined }),
      ],
  );
  TestValidator.equals(
    "owners separate seeds",
    film.seed === shot[0]!.seed,
    false,
  );
}
