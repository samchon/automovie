import {
  IAutoMovieCompiledEffect,
  IAutoMovieShotContract,
  IAutoMovieShotSourceOutput,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * Materialize effect cues into builder-owned deterministic streams.
 *
 * A shot contract owns shot-local cues and a production and film pair owns
 * film-global cues; each owner derives a domain-separated stream seed from its
 * identity, the cue, and the recipe and zone it activates. A cue whose zone or
 * recipe is absent materializes nothing, because the owner's validator reports
 * that refusal. Cues are ordered by code unit and each stream carries the
 * SHA-256 of its canonical JSON, computed without a Node built-in and equal to
 * the Node builder digest of the same stream.
 */
export const materializeCompiledEffects = (
  props: {
    world?: IAutoMovieWorldDesign;
    fps?: number;
    fixedStepSeconds?: number;
    cues: NonNullable<IAutoMovieShotSourceOutput["effectCues"]>;
  } & (
    | { contract: IAutoMovieShotContract; seedOwner?: never }
    | {
        contract?: never;
        seedOwner: { production: string; film: string };
      }
  ),
): IAutoMovieCompiledEffect[] => {
  if (props.world === undefined) return [];
  const recipes = new Map(
    props.world.effectRecipes.map((recipe) => [recipe.id, recipe]),
  );
  const zones = new Map(props.world.effectZones.map((zone) => [zone.id, zone]));
  return [...props.cues]
    .sort((left, right) => compareCodeUnits(left.id, right.id))
    .flatMap((cue): IAutoMovieCompiledEffect[] => {
      const zone = zones.get(cue.zone);
      const recipe = zone === undefined ? undefined : recipes.get(zone.recipe);
      if (zone === undefined || recipe === undefined) return [];
      const seedDigest = autoMovieRenderDigest(
        canonicalizeAutoMovieJson(
          props.seedOwner === undefined
            ? {
                protocol: "automovie.effect-stream.v1",
                shot: props.contract!.id,
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
      const core = {
        version: 1 as const,
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
        fixedStepSeconds: props.fixedStepSeconds ?? 1 / (props.fps ?? 24),
      };
      return [
        {
          ...core,
          digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(core)),
        },
      ];
    });
};
