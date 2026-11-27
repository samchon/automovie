import {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  type IAutoMovieMaterializeCompiledEffects,
  IAutoMovieShotEffectCue,
  IAutoMovieWorldEffectZone,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineCanonicalJson } from "../../text/AutoMovieEngineCanonicalJson";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { admitEffectTransport } from "./admitEffectTransport";

/*
 * Materialize effect cues into builder-owned deterministic streams.
 *
 * A shot contract owns shot-local cues and a production and film pair owns
 * film-global cues; each owner derives a domain-separated stream seed from its
 * identity, the cue, and the recipe and zone it activates. The shot protocol
 * `automovie.effect-stream.v1` hashes the shot id with the recipe and zone
 * seeds, and the film protocol `automovie.film-effect-seed.v1` hashes the owner
 * pair with the whole recipe and zone records. The seed is the first 13 hex
 * digits of that SHA-256, a 52-bit safe integer. Domain tags distinguish the
 * serialized inputs; truncation still permits different inputs to share a
 * seed.
 *
 * A cue whose zone or recipe is absent materializes nothing, because the
 * owner's validator reports that refusal. Streams are ordered by code-unit cue
 * id, every stream steps at the caller's `fixedStepSeconds`, and each carries
 * the SHA-256 of its canonical JSON, computed without a Node built-in and equal
 * to the Node builder digest of the same stream. Bounds, recipe and intensity
 * are deep copies, so editing a stream never edits the world or the cue.
 */
export function materializeCompiledEffects(
  props: IAutoMovieMaterializeCompiledEffects.IProps,
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
      (
        zone: IAutoMovieWorldEffectZone,
      ): [string, IAutoMovieWorldEffectZone] => [zone.id, zone],
    ),
  );
  return [...props.cues]
    .sort(
      (left: IAutoMovieShotEffectCue, right: IAutoMovieShotEffectCue): number =>
        AutoMovieEngineText.compareCodeUnits(left.id, right.id),
    )
    .flatMap((cue: IAutoMovieShotEffectCue): IAutoMovieCompiledEffect[] => {
      const zone: IAutoMovieWorldEffectZone | undefined = zones.get(cue.zone);
      const recipe: IAutoMovieEffectRecipe | undefined =
        zone === undefined ? undefined : recipes.get(zone.recipe);
      if (zone === undefined || recipe === undefined) return [];
      admitEffectTransport(recipe);
      const seedDigest: string = autoMovieRenderDigest(
        AutoMovieEngineCanonicalJson.canonicalize(
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
          digest: autoMovieRenderDigest(
            AutoMovieEngineCanonicalJson.canonicalize(core),
          ),
        },
      ];
    });
}
