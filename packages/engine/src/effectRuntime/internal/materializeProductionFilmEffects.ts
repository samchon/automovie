import {
  IAutoMovieCompiledEffect,
  IAutoMovieCompiledFilmEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieFilmTimeline,
  type IAutoMovieMaterializeProductionFilmEffects,
  IAutoMovieProductionFrameRate,
  IAutoMovieShotEffectCue,
  type IAutoMovieShotEffectFilmInterval,
  IAutoMovieWorldEffectZone,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../../film/internal/productionFrameBoundaryToSeconds";
import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineCanonicalJson } from "../../text/AutoMovieEngineCanonicalJson";
import { AutoMovieFilmEffectRuntimeError } from "../AutoMovieFilmEffectRuntimeError";
import { materializeCompiledEffects } from "./materializeCompiledEffects";
import { productionFilmEffectFrameRate } from "./productionFilmEffectFrameRate";
import { sortProductionFilmEffectCues } from "./sortProductionFilmEffectCues";
import { validateProductionFilmEffectIdentity } from "./validateProductionFilmEffectIdentity";

/**
 * Materialize normalized film cues into current, deterministic effect streams.
 *
 * Every cue becomes one `IAutoMovieCompiledFilmEffect` in start-frame then
 * code-unit id order, stamped with exactly the four fields of `identity`, the
 * reduced `frameRate`, its half-open frame interval and a digest of all of
 * them. The inner stream steps one frame at a time, spans the exact boundary
 * seconds of the interval, holds the cue's intensity constant, and takes its
 * seed from the film seed protocol of {@link materializeCompiledEffects}.
 *
 * Every refusal throws {@link AutoMovieFilmEffectRuntimeError}: a malformed
 * identity, rate, world id, shot interval or cue, or a repeated cue id, is
 * `film-effect-input-invalid`; a cue on an unknown zone is
 * `film-effect-zone-missing`; a zone whose recipe is unknown is
 * `film-effect-recipe-missing`; and two film cues, or a film cue and a shot
 * interval, overlapping on one zone are `film-effect-owner-conflict`, naming
 * both cues and the shared frames.
 */
export const materializeProductionFilmEffects = (
  props: IAutoMovieMaterializeProductionFilmEffects.IProps,
): IAutoMovieCompiledFilmEffect[] => {
  validateProductionFilmEffectIdentity(props.identity);
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectFrameRate(props.frameRate, "film-effect-input-invalid");
  const recipes: Map<string, IAutoMovieEffectRecipe> = uniqueMap(
    props.world.effectRecipes,
    "recipe",
    (value: IAutoMovieEffectRecipe): string => value.id,
  );
  const zones: Map<string, IAutoMovieWorldEffectZone> = uniqueMap(
    props.world.effectZones,
    "zone",
    (value: IAutoMovieWorldEffectZone): string => value.id,
  );
  const shotIntervals: Map<string, IAutoMovieShotEffectFilmInterval[]> =
    groupShotIntervals(props.shotEffects ?? []);
  const cues: FilmEffectCue[] = sortProductionFilmEffectCues(props.effects);
  const cueIds: Set<string> = new Set();
  const latestByZone: Map<string, FilmEffectCue> = new Map();
  for (const cue of cues) {
    validateCue(cue);
    if (cueIds.has(cue.id))
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-input-invalid",
        `Film effect cue id "${cue.id}" must be unique.`,
      );
    cueIds.add(cue.id);
    const zone: IAutoMovieWorldEffectZone | undefined = zones.get(cue.zone);
    if (zone === undefined)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-zone-missing",
        `Film effect cue "${cue.id}" references missing world zone "${cue.zone}".`,
      );
    if (recipes.has(zone.recipe) === false)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-recipe-missing",
        `Film effect cue "${cue.id}" uses zone "${zone.id}" whose recipe "${zone.recipe}" is missing.`,
      );
    const endFrame: number = cue.startFrame + cue.durationFrames;
    const latest: FilmEffectCue | undefined = latestByZone.get(cue.zone);
    if (
      latest !== undefined &&
      cue.startFrame < latest.startFrame + latest.durationFrames
    )
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-owner-conflict",
        `Film effect cues "${latest.id}" and "${cue.id}" both own zone "${cue.zone}" during frames ${cue.startFrame}..${Math.min(endFrame, latest.startFrame + latest.durationFrames)}.`,
      );
    latestByZone.set(cue.zone, cue);
    const conflict: IAutoMovieShotEffectFilmInterval | undefined = (
      shotIntervals.get(cue.zone) ?? []
    ).find(
      (candidate: IAutoMovieShotEffectFilmInterval): boolean =>
        candidate.startFrame < endFrame && cue.startFrame < candidate.endFrame,
    );
    if (conflict !== undefined)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-owner-conflict",
        `Film effect cue "${cue.id}" and shot effect cue "${conflict.cue}" on shot "${conflict.shot}" both own zone "${cue.zone}" during frames ${Math.max(cue.startFrame, conflict.startFrame)}..${Math.min(endFrame, conflict.endFrame)}.`,
      );
  }
  const streams: Map<string, IAutoMovieCompiledEffect> = new Map(
    materializeCompiledEffects({
      world: props.world,
      fixedStepSeconds: frameRate.denominator / frameRate.numerator,
      seedOwner: {
        production: props.identity.production,
        film: props.identity.film,
      },
      cues: cues.map(
        (cue: FilmEffectCue): IAutoMovieShotEffectCue => ({
          id: cue.id,
          zone: cue.zone,
          start: productionFrameBoundaryToSeconds({
            frame: cue.startFrame,
            frameRate,
          }),
          end: productionFrameBoundaryToSeconds({
            frame: cue.startFrame + cue.durationFrames,
            frameRate,
          }),
          intensity: { from: cue.intensity, to: cue.intensity },
        }),
      ),
    }).map(
      (
        effect: IAutoMovieCompiledEffect,
      ): [string, IAutoMovieCompiledEffect] => [effect.id, effect],
    ),
  );
  return cues.map((cue: FilmEffectCue): IAutoMovieCompiledFilmEffect => {
    const core: Omit<IAutoMovieCompiledFilmEffect, "digest"> = {
      version: 1,
      owner: "film",
      clock: "timeline-frame",
      production: props.identity.production,
      film: props.identity.film,
      compileFingerprint: props.identity.compileFingerprint,
      editFingerprint: props.identity.editFingerprint,
      frameRate,
      startFrame: cue.startFrame,
      endFrame: cue.startFrame + cue.durationFrames,
      effect: streams.get(cue.id)!,
    };
    return {
      ...core,
      digest: autoMovieRenderDigest(
        AutoMovieEngineCanonicalJson.canonicalize(core),
      ),
    };
  });
};

type FilmEffectCue = IAutoMovieFilmTimeline["tracks"]["effects"][number];

const validateCue = (cue: FilmEffectCue): void => {
  if (
    cue.recipe !== "world-zone" ||
    cue.startFrame < 0 ||
    cue.durationFrames <= 0 ||
    // The end frame is a frame index, so it must stay an exact integer.
    cue.startFrame + cue.durationFrames > Number.MAX_SAFE_INTEGER ||
    cue.intensity < 0 ||
    cue.intensity > 1
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Film effect cue "${cue.id}" has an invalid recipe, frame interval, or intensity.`,
    );
};

/** Validate every shot interval and group them by zone in input order. */
const groupShotIntervals = (
  intervals: readonly IAutoMovieShotEffectFilmInterval[],
): Map<string, IAutoMovieShotEffectFilmInterval[]> => {
  const output: Map<string, IAutoMovieShotEffectFilmInterval[]> = new Map();
  for (const interval of intervals) {
    if (interval.startFrame < 0 || interval.endFrame <= interval.startFrame)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-input-invalid",
        `Shot effect cue "${interval.cue}" has an invalid film-frame interval.`,
      );
    const group: IAutoMovieShotEffectFilmInterval[] | undefined = output.get(
      interval.zone,
    );
    if (group === undefined) output.set(interval.zone, [interval]);
    else group.push(interval);
  }
  return output;
};

const uniqueMap = <T>(
  values: readonly T[],
  kind: string,
  key: (value: T) => string,
): Map<string, T> => {
  const output: Map<string, T> = new Map();
  for (const value of values) {
    const id: string = key(value);
    if (output.has(id))
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-input-invalid",
        `Film effect world ${kind} id "${id}" must be unique.`,
      );
    output.set(id, value);
  }
  return output;
};
