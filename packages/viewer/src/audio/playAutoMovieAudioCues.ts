import type { IAutoMovieAudioCue } from "./IAutoMovieAudioCue.js";
import { planAutoMovieAudioPlayback } from "./planAutoMovieAudioPlayback.js";

/**
 * Play a cue list through Web Audio from a film instant at a transport rate,
 * as {@link planAutoMovieAudioPlayback} plans it: one buffer source per
 * sounding cue, through a gain and an equal-power stereo panner, started at
 * the context's current time plus its delay. The returned stop releases every
 * started source, so a pause, seek or rate change stops and replans.
 *
 * @param context The audio context.
 * @param decoded Decoded buffers by asset.
 * @param cues The cue list.
 * @param seconds The film instant to start from.
 * @param rate Film seconds per wall second.
 * @returns A function stopping every started source once.
 */
export function playAutoMovieAudioCues(
  context: BaseAudioContext,
  decoded: Readonly<Record<string, AudioBuffer>>,
  cues: readonly IAutoMovieAudioCue[],
  seconds: number,
  rate: number,
): () => void {
  const lengths: Record<string, number> = Object.fromEntries(
    Object.entries(decoded).map(
      ([id, buffer]: [string, AudioBuffer]): [string, number] => [
        id,
        buffer.duration,
      ],
    ),
  );
  const now: number = context.currentTime;
  const sources: AudioBufferSourceNode[] = [];
  for (const start of planAutoMovieAudioPlayback(
    cues,
    seconds,
    rate,
    lengths,
  )) {
    const source: AudioBufferSourceNode = context.createBufferSource();
    source.buffer = decoded[start.asset]!;
    source.playbackRate.value = start.playbackRate;
    const gain: GainNode = context.createGain();
    gain.gain.value = start.gain;
    const panner: StereoPannerNode = context.createStereoPanner();
    panner.pan.value = start.pan;
    source.connect(gain).connect(panner).connect(context.destination);
    source.start(
      now + start.delay,
      start.offset,
      start.duration * start.playbackRate,
    );
    sources.push(source);
  }
  let stopped: boolean = false;
  return (): void => {
    if (stopped) return;
    stopped = true;
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // A source that already ended has nothing to stop.
      }
      source.disconnect();
    }
  };
}
