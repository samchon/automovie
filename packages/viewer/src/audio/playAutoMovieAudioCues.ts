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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Play a cue list through Web Audio from a film instant at a transport rate, as plans it: one buffer source per sounding cue, through a gain and an equal-power stereo panner, started at the context's current time plus its delay) and documents parameters `context`, `decoded`, `cues`, `seconds`, `rate`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Play a cue list through Web Audio from a film instant at a transport rate, as plans it: one buffer source per sounding cue, through a gain and an equal-power stereo panner, started at the context's current time plus its delay) directly over its typed inputs (`context`, `decoded`, `cues`, `seconds`, `rate`) as 3 sequential passes (map over Object.entries(decoded); for-of over planAutoMovieAudioPlayback( cues, ; for-of over sources), delegating to `Object.fromEntries`, `Object.entries(decoded).map`, `Object.entries`, `planAutoMovieAudioPlayback`, `context.createBufferSource`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 46 lines and 6 top-level statements that reuses `Object.fromEntries`, `Object.entries(decoded).map`, `Object.entries`, `planAutoMovieAudioPlayback`, `context.createBufferSource` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `context`, `decoded`, `cues`, `seconds`, `rate`; the dominant cost is 3 sequential passes (map over Object.entries(decoded); for-of over planAutoMovieAudioPlayback( cues, ; for-of over sources), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
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
