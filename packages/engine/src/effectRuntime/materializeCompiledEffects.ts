import {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieShotContract,
  IAutoMovieShotEffectCue,
  IAutoMovieWorldDesign,
  IAutoMovieWorldEffectZone,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * Materialize effect cues into builder-owned deterministic streams.
 *
 * A shot contract owns shot-local cues and a production and film pair owns film-global cues; each owner derives a domain-separated stream seed from its identity, the cue, and the recipe and zone it activates. The shot protocol `automovie.effect-stream.v1` hashes the shot id with the recipe and zone seeds, and the film protocol `automovie.film-effect-seed.v1` hashes the owner pair with the whole recipe and zone records. The seed is the first 13 hex digits of that SHA-256, a 52-bit safe integer. Domain tags distinguish the serialized inputs; truncation still permits different inputs to share a seed.
 *
 * A cue whose zone or recipe is absent materializes nothing, because the owner's validator reports that refusal. Streams are ordered by code-unit cue id, every stream steps at the caller's `fixedStepSeconds`, and each carries the SHA-256 of its canonical JSON, computed without a Node built-in and equal to the Node builder digest of the same stream. Bounds, recipe and intensity are deep copies, so editing a stream never edits the world or the cue.
 *
 * @evidence contracts/common.md#principled-implementation Seeds come from SHA-256 over canonical JSON v2 of a protocol-tagged owner record, so distinct owner fields and protocols have unambiguous serialized inputs; retaining 13 hexadecimal digits gives an exact 52-bit integer but permits output collisions. The full stream digest hashes every field except itself, matching validateProductionFilmEffectRuntime's recomputation.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the stream record for both owners, which differ only in the seed protocol chosen by the `contract` or `seedOwner` branch of the argument union; zone and recipe lookups are two maps built once per call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The world and the step are required inputs, so no frame rate or empty-world answer is assumed for a caller that omits them, and a cue with a missing zone or recipe is skipped only because its owner's validator already refuses it with a named code.
 * @evidence contracts/common.md#meaningful-documentation States both owners and their seed protocols, how the seed is cut from the digest, the drop rule for unresolved cues and who reports it, the output order, the step source, digest equivalence with the Node builder, and that emitted records do not alias the inputs.
 * @evidence contracts/performance.md#efficient-algorithms For C cues over R recipes and Z zones, maps cost O(R + Z) and cue sorting costs O(C log C). Each cue's canonicalizations traverse its owner and stream records and sort object keys with sum(K log K) work before two linear SHA-256 byte passes; the cue sort preserves the caller's order by copying its array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call materializes one owner's cues from scratch; the film writer calls it once for all of its cues, and no stream is cached across builds because the world, owner and step are all inputs of the digest.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The two lookup maps live only for the call. Returned streams own copied bounds, recipes and intensities, so retained storage grows with all nested copied records and text, including repeated recipes across cues; the caller owns their release.
 */
export function materializeCompiledEffects (
  props: {
    world: IAutoMovieWorldDesign;
    fixedStepSeconds: number;
    cues: readonly IAutoMovieShotEffectCue[];
  } & (
    | { contract: IAutoMovieShotContract; seedOwner?: never }
    | {
        contract?: never;
        seedOwner: { production: string; film: string };
      }
  ),
): IAutoMovieCompiledEffect[] {
  const recipes: Map<string, IAutoMovieEffectRecipe> = new Map(
    props.world.effectRecipes.map(
      (recipe: IAutoMovieEffectRecipe): [string, IAutoMovieEffectRecipe] => [
        recipe.id,
        recipe,
      ],
    ),
  );
  const zones: Map<string, IAutoMovieWorldEffectZone> = new Map(
    props.world.effectZones.map(
      (zone: IAutoMovieWorldEffectZone): [string, IAutoMovieWorldEffectZone] => [
        zone.id,
        zone,
      ],
    ),
  );
  return [...props.cues]
    .sort((left: IAutoMovieShotEffectCue, right: IAutoMovieShotEffectCue): number =>
      compareCodeUnits(left.id, right.id),
    )
    .flatMap((cue: IAutoMovieShotEffectCue): IAutoMovieCompiledEffect[] => {
      const zone: IAutoMovieWorldEffectZone | undefined = zones.get(cue.zone);
      const recipe: IAutoMovieEffectRecipe | undefined =
        zone === undefined ? undefined : recipes.get(zone.recipe);
      if (zone === undefined || recipe === undefined) return [];
      const seedDigest: string = autoMovieRenderDigest(
        canonicalizeAutoMovieJson(
          props.seedOwner === undefined
            ? {
                protocol: "automovie.effect-stream.v1",
                shot: props.contract.id,
                cue: cue.id,
                recipeSeed: recipe.seed,
                zoneSeed: zone.seed,
              }
            : {
                protocol: "automovie.film-effect-seed.v1",
                owner: props.seedOwner,
                cue: cue.id,
                recipe,
                zone,
              },
        ),
      );
      const core: Omit<IAutoMovieCompiledEffect, "digest"> = {
        version: 1,
        id: cue.id,
        zone: zone.id,
        kind: recipe.kind,
        bounds: structuredClone(zone.bounds),
        seed: Number.parseInt(seedDigest.slice(7, 20), 16),
        recipe: structuredClone(recipe),
        start: cue.start,
        end: cue.end,
        intensity: structuredClone(cue.intensity),
        ...(cue.event === undefined ? {} : { event: cue.event }),
        fixedStepSeconds: props.fixedStepSeconds,
      };
      return [
        {
          ...core,
          digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(core)),
        },
      ];
    });
}
