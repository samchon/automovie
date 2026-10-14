import {
  IAutoMovieCompiledEffect,
  IAutoMovieCompiledFilmEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
  IAutoMovieShotEffectCue,
  IAutoMovieWorldDesign,
  IAutoMovieWorldEffectZone,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";
import { IAutoMovieShotEffectFilmInterval } from "./IAutoMovieShotEffectFilmInterval";
import { materializeCompiledEffects } from "./materializeCompiledEffects";
import { productionFilmEffectFrameRate } from "./productionFilmEffectFrameRate";
import { sortProductionFilmEffectCues } from "./sortProductionFilmEffectCues";
import { validateProductionFilmEffectIdentity } from "./validateProductionFilmEffectIdentity";

type FilmEffectCue = IAutoMovieFilmTimeline["tracks"]["effects"][number];

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
 *
 * @evidence contracts/common.md#principled-implementation Ownership is half-open interval overlap per zone: because cues are visited in start-frame order and earlier same-zone cues were already proven disjoint, only the most recent cue on a zone can overlap the next one, so comparing against it alone decides every film-film conflict; shot intervals are compared by the same `start < otherEnd && otherStart < end` test. Seconds come from `productionFrameBoundaryToSeconds`, so the stream window is the exact rational boundary the sampler and validator recompute.
 * @evidence contracts/common.md#clear-and-simple-design The function validates and resolves the whole track first, then asks `materializeCompiledEffects` once for all streams under the film seed owner and wraps each in its runtime record; rate reduction, identity checks and cue ordering stay with their single shared owners so the reader verifies exactly what this writer persists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cue, zone or recipe is skipped or defaulted: every problem the reader would reject is refused here with its named code, the identity is copied field by field so no extra member of the caller's object reaches the persisted runtime, and the inner stream lookup by id cannot miss because each cue's zone and recipe were resolved and its id proven unique before materialization.
 * @evidence contracts/common.md#meaningful-documentation States the output order and every stamped field, the stream's step, window, intensity and seed protocol, and each refusal code with the condition that raises it.
 * @evidence contracts/performance.md#efficient-algorithms For C cues, S shot intervals, R recipes and Z zones the cost is `O(R + Z + S)` to index the world and group shot intervals by zone, `O(C log C)` to sort, `O(1)` per cue for the film conflict against the zone's latest cue, a scan of only that zone's shot intervals, and two SHA-256 digests per cue for the stream plus one for the runtime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per production build with that build's identity and timeline; the result is the persisted artifact, and nothing is cached across builds because the identity is part of every digest.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The id set, latest-cue map, shot-interval groups and stream map live only for the call and grow linearly with the cue and interval counts; the returned runtimes own their streams and share one reduced `frameRate` object, so mutating one runtime's rate changes the others.
 */
export const materializeProductionFilmEffects = (props: {
  identity: IAutoMovieFilmEffectCurrentIdentity;
  frameRate: number | IAutoMovieProductionFrameRate;
  world: IAutoMovieWorldDesign;
  effects: IAutoMovieFilmTimeline["tracks"]["effects"];
  shotEffects?: readonly IAutoMovieShotEffectFilmInterval[];
}): IAutoMovieCompiledFilmEffect[] => {
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
      digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(core)),
    };
  });
};

const validateCue = (cue: FilmEffectCue): void => {
  if (
    cue.id.trim().length === 0 ||
    cue.recipe !== "world-zone" ||
    cue.zone.trim().length === 0 ||
    Number.isSafeInteger(cue.startFrame) === false ||
    cue.startFrame < 0 ||
    Number.isSafeInteger(cue.durationFrames) === false ||
    cue.durationFrames <= 0 ||
    Number.isSafeInteger(cue.startFrame + cue.durationFrames) === false ||
    Number.isFinite(cue.intensity) === false ||
    cue.intensity < 0 ||
    cue.intensity > 1
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Film effect cue "${cue.id}" has an invalid id, recipe, zone, frame interval, or intensity.`,
    );
};

/** Validate every shot interval and group them by zone in input order. */
const groupShotIntervals = (
  intervals: readonly IAutoMovieShotEffectFilmInterval[],
): Map<string, IAutoMovieShotEffectFilmInterval[]> => {
  const output: Map<string, IAutoMovieShotEffectFilmInterval[]> = new Map();
  for (const interval of intervals) {
    if (
      interval.cue.trim().length === 0 ||
      interval.shot.trim().length === 0 ||
      interval.zone.trim().length === 0 ||
      Number.isSafeInteger(interval.startFrame) === false ||
      interval.startFrame < 0 ||
      Number.isSafeInteger(interval.endFrame) === false ||
      interval.endFrame <= interval.startFrame
    )
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-input-invalid",
        `Shot effect cue "${interval.cue}" has an invalid owner or film-frame interval.`,
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
    if (id.trim().length === 0 || output.has(id))
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-input-invalid",
        `Film effect world ${kind} id "${id}" must be non-blank and unique.`,
      );
    output.set(id, value);
  }
  return output;
};
