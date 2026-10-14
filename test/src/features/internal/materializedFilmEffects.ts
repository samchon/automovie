import { materializeProductionFilmEffects } from "../../../../packages/engine/src/effectRuntime/materializeProductionFilmEffects";
import { IAutoMovieCompiledFilmEffect, IAutoMovieFilmTimeline } from "@automovie/interface";
import { filmEffectWorld } from "./filmEffectWorld";
import { filmEffectIdentity } from "./filmEffectIdentity";
/** Invoke the real production film-effect materializer using the existing identity, 24-fps clock, world and borrowed timeline effect track. The result is product output and is not an independent expected population. */
export const materializedFilmEffects: (timeline: IAutoMovieFilmTimeline) => IAutoMovieCompiledFilmEffect[] = (
  timeline: IAutoMovieFilmTimeline,
): IAutoMovieCompiledFilmEffect[] =>
  materializeProductionFilmEffects({
    identity: filmEffectIdentity(timeline),
    frameRate: 24,
    world: filmEffectWorld(),
    effects: timeline.tracks.effects,
  });
