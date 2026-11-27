import type { AutoMovieViewerAudio } from "../AutoMovieViewerAudio.js";
import { planAutoMovieAudioPlayback } from "./planAutoMovieAudioPlayback.js";

/*
 * Play a cue list through Web Audio from a film instant at a transport rate, as
 * AutoMovieViewerAudio.planPlayback plans it: one buffer source per sounding
 * cue, through a gain and an equal-power stereo panner, started at the
 * context's current time plus its delay. The returned stop releases every
 * started source, so a pause, seek or rate change stops and replans.
 * Parameter request: Context, decoded buffers, cues, film instant and rate.
 * Returns: A function stopping every started source once.
 */
export function playAutoMovieAudioCues(
  request: AutoMovieViewerAudio.IPlayCuesRequest,
): AutoMovieViewerAudio.IStop {
  const { context, decoded, cues, seconds, rate } = request;
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
  for (const start of planAutoMovieAudioPlayback({
    cues,
    seconds,
    rate,
    lengths,
  })) {
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
