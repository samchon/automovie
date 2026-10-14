import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { IAutoMovieCompiledEffect, IAutoMovieWorldEffectZone, IAutoMovieShotContract, IAutoMovieShotEffectCue, IAutoMovieWorldDesign } from "@automovie/interface";
import { materializeCompiledEffects } from "../../../../packages/engine/src/effectRuntime/materializeCompiledEffects";
import { TestValidator } from "@nestia/e2e";
import { filmEffectRecipe, filmEffectWorld, filmEffectZone, nodeCanonicalDigest } from "./filmEffectRuntimeFixtures";
/**
 * Effect streams preserve their owner protocol, ordered cue identity and independent input data.
 *
 * Scenarios:
 * 1. Materialize sorted cues, skip unresolved zones/recipes and preserve optional events.
 * 2. Check shot/film domain-separated seeds, canonical digests and requested clocks.
 * 3. Mutate emitted bounds, recipe and intensity without changing authored inputs.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs materializeCompiledEffects and observes ordered records, event fields, seeds, digests and source isolation, catching owner mixing, omitted cue fields or shallow-copy mutation leaks.
 * @evidence contracts/testing.md#independent-expectations The documented protocol tags and authored ids/seeds define the SHA-256 seed record; Node crypto independently checks hashing. nodeCanonicalDigest shares the product canonicalizer, so it independently checks the digest primitive rather than every canonical ordering rule.
 * @evidence contracts/testing.md#distinguishing-cases Covers shot and film owners, altered owner identity, unresolved zone/recipe, optional event and mutable nested output fields; full film cue/clock admission belongs to effect_materialization.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns these in-memory stream cases and calls source directly; Node crypto is a portable reference within this process, without browser/GPU or cross-machine execution proof.
 */
export function test_film_effect_compiled_streams(): void {
  const contract: IAutoMovieShotContract = { id: "shot-1" } as IAutoMovieShotContract;
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

  const shot: IAutoMovieCompiledEffect[] = materializeCompiledEffects({
    world,
    contract,
    fixedStepSeconds: 1 / 30,
    cues,
  });
  TestValidator.predicate(
    "shot streams are ordered, filtered, and carry their event",
    filmEffectValuesClose(
      shot.map((stream: IAutoMovieCompiledEffect): { id: string; zone: string; kind: "fog" | "smoke" | "dust"; event: string | null | undefined; window: number[]; step: number; } => ({
      id: stream.id,
      zone: stream.zone,
      kind: stream.kind,
      event: "event" in stream ? stream.event : null,
      window: [stream.start, stream.end],
      step: stream.fixedStepSeconds,
    })),
      [
      {
        id: "a",
        zone: "yard",
        kind: "fog" as const,
        event: "door-opens",
        window: [0, 1],
        step: 1 / 30,
      },
      {
        id: "b",
        zone: "gate",
        kind: "fog" as const,
        event: null,
        window: [1, 2],
        step: 1 / 30,
      },
    ],
    ),
  );
  const zoneSeed: (id: string) => number = (id: string): number =>
    world.effectZones.find((zone: IAutoMovieWorldEffectZone): boolean => zone.id === id)!.seed;
  TestValidator.equals(
    "shot seeds and digests follow the shot stream protocol",
    shot.map((stream: IAutoMovieCompiledEffect): (string | number)[] => [stream.seed, stream.digest]),
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
  TestValidator.predicate(
    "emitted data does not alias the authored world or cue",
    filmEffectValuesClose(
      [
      world.effectZones[0]!.bounds.min.x,
      world.effectRecipes[0]!.seed,
      cues[1]!.intensity.from,
    ],
      [-1, 7, 1],
    ),
  );

  const owner: { production: string; film: string; } = { production: "p", film: "f" };
  const film: IAutoMovieCompiledEffect = materializeCompiledEffects({
    world,
    seedOwner: owner,
    fixedStepSeconds: 0.125,
    cues: [cues[1]!],
  })[0]!;
  TestValidator.predicate(
    "film streams follow the film seed protocol and the supplied step",
    filmEffectValuesClose(
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
    ),
  );
  TestValidator.equals(
    "owners separate seeds",
    film.seed === shot[0]!.seed,
    false,
  );
}
