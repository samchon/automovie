import type { AutoMovieViewerAudio } from "../AutoMovieViewerAudio";

/*
 * Which cues sound when playback starts at a film instant and runs at a
 * transport rate, and how each is started: a cue already sounding starts at
 * once part-way into its excerpt, a later cue after its film delay divided by
 * the transport rate, and an ended cue not at all. Source offsets advance by
 * the cue's own rate times the elapsed film seconds, and the playback rate
 * multiplies the cue rate by the transport rate. Pure, so a seek and a resume
 * plan the same playback from the same instant.
 * Parameter request: Cues, film instant, transport rate and source lengths.
 * Returns: One start per sounding cue, in cue order.
 */
export function planAudioPlayback(
  request: AutoMovieViewerAudio.IPlanPlaybackRequest,
): AutoMovieViewerAudio.IStart[] {
  const { cues, seconds, rate, lengths } = request;
  if (!(rate > 0)) throw new Error("Invalid audio playback instant or rate");
  const starts: AutoMovieViewerAudio.IStart[] = [];
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
