import type { IAutoMovieAudioCue } from "./IAutoMovieAudioCue.js";

/**
 * Which cues sound when playback starts at a film instant and runs at a
 * transport rate, and how each is started: a cue already sounding starts at
 * once part-way into its excerpt, a later cue after its film delay divided
 * by the transport rate, and an ended cue not at all. Source offsets advance
 * by the cue's own rate times the elapsed film seconds, and the playback
 * rate multiplies the cue rate by the transport rate. Pure, so a seek and a
 * resume plan the same playback from the same instant.
 *
 * @param cues The cue list.
 * @param seconds The film instant playback starts from.
 * @param rate Film seconds per wall second; positive.
 * @param lengths Source length in seconds by asset, for cues without a duration.
 * @returns One start per sounding cue, in cue order.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Which cues sound when playback starts at a film instant and runs at a transport rate, and how each is started: a cue already sounding starts at once part-way into its excerpt, a later cue after its film delay divided by the transport rate, and an ended cue not at all) and documents parameters `cues`, `seconds`, `rate`, `lengths`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Which cues sound when playback starts at a film instant and runs at a transport rate, and how each is started: a cue already sounding starts at once part-way into its excerpt, a later cue after its film delay divided by the transport rate, and an ended cue not at all) directly over its typed inputs (`cues`, `seconds`, `rate`, `lengths`) as a single pass (for-of over cues), delegating to `Number.isFinite`, `Math.max`, `starts.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 25 lines and 4 top-level statements that reuses `Number.isFinite`, `Math.max`, `starts.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `cues`, `seconds`, `rate`, `lengths`; the dominant cost is a single pass (for-of over cues), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function planAutoMovieAudioPlayback(
  cues: readonly IAutoMovieAudioCue[],
  seconds: number,
  rate: number,
  lengths: Readonly<Record<string, number>>,
): planAutoMovieAudioPlayback.IStart[] {
  if (!(rate > 0) || !Number.isFinite(rate) || !Number.isFinite(seconds))
    throw new Error("Invalid audio playback instant or rate");
  const starts: planAutoMovieAudioPlayback.IStart[] = [];
  for (const cue of cues) {
    const speed: number = cue.rate ?? 1;
    const offset: number = cue.offsetSeconds ?? 0;
    const length: number | undefined = lengths[cue.asset];
    if (length === undefined)
      throw new Error(`Unknown audio asset ${cue.asset}`);
    const duration: number = cue.durationSeconds ?? (length - offset) / speed;
    const elapsed: number = Math.max(0, seconds - cue.seconds);
    if (elapsed >= duration) continue;
    starts.push({
      asset: cue.asset,
      delay: Math.max(0, cue.seconds - seconds) / rate,
      offset: offset + elapsed * speed,
      duration: (duration - elapsed) / rate,
      gain: cue.gain,
      pan: cue.pan ?? 0,
      playbackRate: speed * rate,
    });
  }
  return starts;
}
/**
 * Companion types of {@link planAutoMovieAudioPlayback}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 1 member (`IStart`); units and frames named in its text: seconds, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `planAutoMovieAudioPlayback` in packages/viewer/src/audio/planAutoMovieAudioPlayback.ts; its surface is the 1 member listed and the text shows 3 other files naming it, mostly packages/viewer (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace planAutoMovieAudioPlayback {
  /** One planned source start. */
  export interface IStart {
    /** Source id. */
    asset: string;

    /** Wall seconds from now until it starts. */
    delay: number;

    /** Source seconds it starts from. */
    offset: number;

    /** Wall seconds it sounds. */
    duration: number;

    /** Linear gain. */
    gain: number;

    /** Equal-power pan in [-1, 1]. */
    pan: number;

    /** Source seconds per wall second. */
    playbackRate: number;
  }
}
