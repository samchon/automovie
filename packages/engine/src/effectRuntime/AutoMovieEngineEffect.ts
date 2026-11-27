import { admitEffectTransport as admitEffectTransportImplementation } from "./internal/admitEffectTransport";
import { estimateProductionFilmFrame as estimateProductionFilmFrameImplementation } from "./internal/estimateProductionFilmFrame";
import { materializeCompiledEffects as materializeCompiledEffectsImplementation } from "./internal/materializeCompiledEffects";
import { materializeProductionFilmEffects as materializeProductionFilmEffectsImplementation } from "./internal/materializeProductionFilmEffects";
import { productionFilmEffectEditFingerprint as productionFilmEffectEditFingerprintImplementation } from "./internal/productionFilmEffectEditFingerprint";
import { productionFilmEffectFrameRate as productionFilmEffectFrameRateImplementation } from "./internal/productionFilmEffectFrameRate";
import { productionFilmEffectTimelineFrameRate as productionFilmEffectTimelineFrameRateImplementation } from "./internal/productionFilmEffectTimelineFrameRate";
import { productionFilmFrameForShotTime as productionFilmFrameForShotTimeImplementation } from "./internal/productionFilmFrameForShotTime";
import { projectProductionShotEffectFilmIntervals as projectProductionShotEffectFilmIntervalsImplementation } from "./internal/projectProductionShotEffectFilmIntervals";
import { sampleProductionFilmEffects as sampleProductionFilmEffectsImplementation } from "./internal/sampleProductionFilmEffects";
import { sortProductionFilmEffectCues as sortProductionFilmEffectCuesImplementation } from "./internal/sortProductionFilmEffectCues";
import { validateProductionFilmEffectIdentity as validateProductionFilmEffectIdentityImplementation } from "./internal/validateProductionFilmEffectIdentity";
import { validateProductionFilmEffectRuntime as validateProductionFilmEffectRuntimeImplementation } from "./internal/validateProductionFilmEffectRuntime";
import { verifyProductionFilmEffectPopulation as verifyProductionFilmEffectPopulationImplementation } from "./internal/verifyProductionFilmEffectPopulation";

import { type IAutoMovieCompiledEffect, type IAutoMovieEffectSample, type IAutoMovieEffectRecipe, type IAutoMovieProductionFrameRate, type IAutoMovieMaterializeCompiledEffects, type IAutoMovieCompiledFilmEffect, type IAutoMovieMaterializeProductionFilmEffects, type IAutoMovieFilmTimeline, type IAutoMovieProductionFilmFrameForShotTime, type IAutoMovieShotEffectFilmInterval, type IAutoMovieProjectProductionShotEffectFilmIntervals, type IAutoMovieProductionFilmEffectSample, type IAutoMovieSampleProductionFilmEffects, type IAutoMovieFilmEffectCurrentIdentity, type IAutoMovieVerifyProductionFilmEffectPopulation } from "@automovie/interface";

import { sampleCompiledEffect } from "./internal/sampleCompiledEffect";

/** Deterministic sampling of compiled effect cues. */
export namespace AutoMovieEngineEffect {
  /**
   * Sample an admitted compiled cue at finite `time` in seconds on its clock.
   * The requested time determines whether the cue is active in `[start, end)`.
   * Active state follows the clock's fixed step with a 1e-9 quotient allowance.
   * It uses the cue start when the step precedes it and the requested time when
   * the rounded step reaches the exclusive end. Inactive samples contain no
   * particles and have zero intensity.
   *
   * `cameraDistance` is finite, measured in metres, and defaults to zero. Far
   * level of detail retains spawn indices divisible by four. The recipe caps
   * the number of live particles. Spawn identity depends only on the compiled
   * cue and particle index, so sampling order and worker count cannot change
   * it.
   */
  export function sample(
    effect: IAutoMovieCompiledEffect,
    time: number,
    cameraDistance?: number,
  ): IAutoMovieEffectSample {
    return sampleCompiledEffect(effect, time, cameraDistance);
  }

  /**
   * Refuse malformed optional transport, opacity-envelope and final-size controls
   * before compiled bytes are published.
   */
  export function admitEffectTransport(recipe: IAutoMovieEffectRecipe): void {
    admitEffectTransportImplementation(recipe);
  }

  /**
   * Estimate a frame from the float product, or `null` when it cannot be exact.
   *
   * The product `seconds * numerator / denominator`, rounded by the caller's
   * `round` and clamped at zero, only starts the search; callers settle the frame
   * by the exact boundary comparison the sampler performs. Two frames of headroom
   * below `Number.MAX_SAFE_INTEGER` keep that correction inside the safe-integer
   * range, and an infinite or NaN product fails the comparison and is reported as
   * unrepresentable.
   */
  export function estimateProductionFilmFrame(seconds: number, frameRate: IAutoMovieProductionFrameRate, round: (value: number) => number): number | null {
    return estimateProductionFilmFrameImplementation(seconds, frameRate, round);
  }

  /**
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
  export function materializeCompiledEffects(props: IAutoMovieMaterializeCompiledEffects.IProps): IAutoMovieCompiledEffect[] {
    return materializeCompiledEffectsImplementation(props);
  }

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
  export function materializeProductionFilmEffects(props: IAutoMovieMaterializeProductionFilmEffects.IProps): IAutoMovieCompiledFilmEffect[] {
    return materializeProductionFilmEffectsImplementation(props);
  }

  /**
   * Identify the normalized edit state shared by planning and film effects.
   *
   * The digest is SHA-256 over the UTF-8 bytes of the canonical JSON v2 of a
   * record tagged `automovie.production-render-edit.v2` that carries the
   * timeline's id, `fps`, `frameRate`, `totalFrames`, segments, omissions and
   * tracks. Builder provenance (`version`, `builder`, `inputFingerprint`,
   * `sourceDigest`) is left out, so recompiling an unchanged edit keeps its edit
   * identity. The engine computes it without a Node built-in, and the bytes and
   * digest equal what the Node builder path produces for the same edit, so a
   * browser viewer and the render planner compare one identity.
   */
  export function productionFilmEffectEditFingerprint(timeline: IAutoMovieFilmTimeline): string {
    return productionFilmEffectEditFingerprintImplementation(timeline);
  }

  /**
   * Reduce one film-effect frame rate, or refuse it under the caller's code.
   *
   * A positive safe integer `n` becomes `n/1`, and a rational with positive
   * safe-integer terms is divided by their greatest common divisor. The writer
   * reports a malformed rate as `film-effect-input-invalid` and the reader
   * reports it as `film-effect-runtime-invalid`, while both reduce through the
   * one engine rate identity rather than a second rational rule. Any failure of
   * the reduction, including a persisted rate that is not an object, becomes that
   * one coded refusal.
   */
  export function productionFilmEffectFrameRate(frameRate: number | IAutoMovieProductionFrameRate, code: "film-effect-input-invalid" | "film-effect-runtime-invalid"): IAutoMovieProductionFrameRate {
    return productionFilmEffectFrameRateImplementation(frameRate, code);
  }

  /**
   * Resolve the timeline's exact rate for a film-effect question, or refuse it.
   *
   * The declared `frameRate` is reduced, or `fps` is read as `fps/1` when no
   * rational is declared. A display `fps` that disagrees with the declared
   * rational rate, a fractional `fps` without one, or a non-positive term is
   * refused as `film-effect-input-invalid`, so no projection or verification runs
   * against an ambiguous clock.
   */
  export function productionFilmEffectTimelineFrameRate(timeline: Pick<IAutoMovieFilmTimeline, "fps" | "frameRate">): IAutoMovieProductionFrameRate {
    return productionFilmEffectTimelineFrameRateImplementation(timeline);
  }

  /**
   * Map one shot-local review time to its only realized film frame.
   *
   * A shot page and a review capture know a shot and a second, not a film frame.
   * The second is first mapped to the source frame that owns it, the largest
   * frame whose exact boundary time is at or before it; film-owned state at that
   * second exists only when the edit realizes that source frame of the shot
   * exactly once, so an absent or repeated occurrence answers `null` rather than
   * choosing one occurrence. A negative, non-finite or unrepresentable time also
   * answers `null`, while an inconsistent clock throws
   * `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`. The
   * answer depends only on the compiled timeline, never on whether a render has
   * prepared any other runtime.
   */
  export function productionFilmFrameForShotTime(props: IAutoMovieProductionFilmFrameForShotTime.IProps): number | null {
    return productionFilmFrameForShotTimeImplementation(props);
  }

  /**
   * Project every shot-owned effect occurrence onto the film's half-open frame
   * clock.
   *
   * A shot cue owns the source frames whose exact boundary time satisfies `start
   * <= time < end`, the same comparison the engine sampler performs, so the
   * projection is decided by the rational frame boundary rather than by a rounded
   * `seconds * fps` product. Each film occurrence of the shot is trimmed to its
   * segment and dropped when nothing remains, and a shot the compiled set does
   * not contain contributes no interval because the builder's shot-availability
   * diagnostics own that refusal. Intervals come out in segment order, then in
   * the shot's effect order. A cue with a negative or non-finite start, an end
   * not after its start, or an unrepresentable bound throws
   * `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`, as does
   * an inconsistent clock.
   */
  export function projectProductionShotEffectFilmIntervals(props: IAutoMovieProjectProductionShotEffectFilmIntervals.IProps): IAutoMovieShotEffectFilmInterval[] {
    return projectProductionShotEffectFilmIntervalsImplementation(props);
  }

  /**
   * Sample film-owned effects at one builder-owned full-rate timeline frame.
   *
   * Returns one sample per runtime in input order, each taken at the frame's
   * exact boundary second on that runtime's rate, with `cameraDistance` in metres
   * passed to the engine sampler (zero when omitted). Every call re-validates
   * each persisted runtime and compares it with `identity`; all refusals throw
   * `AutoMovieFilmEffectRuntimeError`: `film-effect-input-invalid` for a
   * malformed identity, a frame that is not a nonnegative safe integer or a
   * negative or non-finite distance, `film-effect-runtime-invalid` for a runtime
   * that is not what the materializer writes, and `film-effect-runtime-stale` for
   * one written under a different production, film, compile or edit identity.
   */
  export function sampleProductionFilmEffects(props: IAutoMovieSampleProductionFilmEffects.IProps): IAutoMovieProductionFilmEffectSample[] {
    return sampleProductionFilmEffectsImplementation(props);
  }

  /**
   * Order film effect cues by start frame, then by code-unit cue id.
   *
   * This is the one order a runtime population is written in and verified
   * against. The materializer and the population verifier both read it here, so
   * the order a builder persists cannot drift from the order a consumer checks.
   * Integer frames and code units decide it, so neither host sort nor locale can
   * reorder a runtime. The input array is left untouched; a new array is
   * returned.
   */
  export function sortProductionFilmEffectCues(cues: IAutoMovieFilmTimeline["tracks"]["effects"]): IAutoMovieFilmTimeline["tracks"]["effects"] {
    return sortProductionFilmEffectCuesImplementation(cues);
  }

  /**
   * Refuse a current film-effect identity that cannot address a runtime.
   *
   * Both builder identities must be exact lowercase SHA-256 content digests. The
   * writer checks this before it stamps a runtime and the sampler before it
   * compares one, so a malformed identity is refused as `film-effect-input-invalid` rather than read
   * as a stale match.
   */
  export function validateProductionFilmEffectIdentity(identity: IAutoMovieFilmEffectCurrentIdentity): void {
    validateProductionFilmEffectIdentityImplementation(identity);
  }

  /**
   * Check semantic integrity of a structurally admitted persisted film-effect
   * runtime.
   *
   * Version, owner, clock, half-open safe-integer interval, reduced frame rate,
   * inner effect id, zone and constant intensity in [0,1], both content digests,
   * and the exact frame clock of the inner stream must match. Production's
   * persisted JSON parser owns schema admission first; direct typed callers must
   * supply populated outer/effect/intensity records and string identities. Under
   * that premise the explicit refusals use film-effect-runtime-invalid, including
   * canonical-JSON failures. Malformed host shapes and unexpected accessors can
   * throw outside that named boundary. Identity currentness is checked separately
   * against independently established facts.
   *
   * Both digests are recomputed with the engine's canonical JSON and pure
   * SHA-256, which produce the same bytes and digest as the Node builder path, so
   * a browser and the builder accept or refuse the same persisted runtime.
   */
  export function validateProductionFilmEffectRuntime(runtime: IAutoMovieCompiledFilmEffect): void {
    validateProductionFilmEffectRuntimeImplementation(runtime);
  }

  /**
   * Prove that one persisted runtime population is the exact executable
   * projection of the current timeline's effect track.
   *
   * Per-entry identity checks cannot see an entry that is absent, so an empty or
   * truncated runtime array would otherwise read as current. The population must
   * match the canonically ordered cue set one to one, every entry must pass
   * `validateProductionFilmEffectRuntime`, and every entry must carry the
   * timeline's film id, `inputFingerprint`, edit fingerprint and reduced frame
   * rate together with its cue's id, zone, frame interval and intensity. The
   * timeline does not name its production, so the `production` field is left to
   * the sampler's identity comparison. An inconsistent timeline clock throws
   * `film-effect-input-invalid`; every population mismatch throws
   * `film-effect-runtime-invalid`.
   */
  export function verifyProductionFilmEffectPopulation(props: IAutoMovieVerifyProductionFilmEffectPopulation.IProps): void {
    verifyProductionFilmEffectPopulationImplementation(props);
  }
}
