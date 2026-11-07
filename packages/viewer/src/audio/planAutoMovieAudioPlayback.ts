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
/** Companion types of {@link planAutoMovieAudioPlayback}. */
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
