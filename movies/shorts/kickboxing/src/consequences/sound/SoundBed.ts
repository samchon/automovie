import { SoundAssets } from "./SoundAssets";

/**
 * The arena crowd as a continuous bed: consecutive cues that continue
 * through the recording and wrap at its end, ducked under the referee's
 * words and raised for the knockout and the celebration. Neighbouring
 * segments of one continuous read overlap by the mixer's edge fade, so
 * their fades cross instead of dipping to silence.
 *
 * Levels, as linear gain on the recording:
 *
 * - {@link SoundBed.GAIN} 0.35, about -9 dB: a murmur well under contacts.
 * - ducked, GAIN x {@link SoundBed.DUCK}: about -27 dB, 18 dB under the
 *   murmur, while a word sounds, from {@link SoundBed.LEAD} before it, and
 *   held across gaps shorter than {@link SoundBed.HOLD} so the count does
 *   not pump.
 * - raised, GAIN x {@link SoundBed.RISE}: about -3 dB, 6 dB over the
 *   murmur, from a fall until {@link SoundBed.ROAR} after it lands and
 *   through the celebration. A duck wins over a rise.
 *
 * ```ts
 * SoundBed.of(180, [[158, 158.55]], [[150, 155.6]]); // [{ asset: "crowd", seconds: 0, gain: 0.35, ... }, ...]
 * ```
 *
 * @evidence docs/body/settings/sound/ring-sound.md#room A crowd murmur dropping away whenever the referee speaks.
 * @evidence docs/research/sound/ring-mix.md#law The bed's segments, duck and rise.
 */
export namespace SoundBed {
  /** One bed segment in the render and viewer audio form. */
  export interface ISegment {
    /** Asset id: {@link SoundBed.ASSET}. */
    asset: string;

    /** Onset, film seconds. */
    seconds: number;

    /** Linear gain. */
    gain: number;

    /** Source offset, seconds: the read continues through the recording. */
    offsetSeconds: number;

    /** Output duration, seconds. */
    durationSeconds: number;
  }

  /** The bed asset. */
  export const ASSET: string = "crowd";

  /** The recording's length, seconds (its WAV header). */
  export const LENGTH: number = SoundAssets.seconds[ASSET]!;

  /** Linear gain of the murmur, about -9 dB (film mix choice). */
  export const GAIN: number = 0.35;

  /** Share of the gain while a word sounds: -18 dB, so a word rises well over 12 dB above the bed. */
  export const DUCK: number = 1 / 8;

  /** Share of the gain for the knockout and the celebration: +6 dB, the crowd's roar. */
  export const RISE: number = 2;

  /** Seconds the duck starts before a word, so the bed just before it is already low. */
  export const LEAD: number = 0.5;

  /** Gaps between ducked spans shorter than this stay ducked, seconds: one count number to the next. */
  export const HOLD: number = 0.5;

  /** Seconds the roar lasts after a fall ends. */
  export const ROAR: number = 2;

  /** Overlap of neighbouring segments of one continuous read: the mixer's 4 ms edge fade. */
  export const CROSSFADE: number = 0.004;

  /**
   * The bed's ducked spans for spoken words: each word from {@link LEAD}
   * before it to its end, merged across gaps shorter than {@link HOLD}.
   *
   * @param words Each word's onset and end, seconds.
   * @returns Merged spans in time order.
   */
  export function ducks(
    words: readonly (readonly [number, number])[],
  ): [number, number][] {
    const spans: [number, number][] = words
      .map(([s, e]): [number, number] => [Math.max(0, s - LEAD), e])
      .sort((x, y) => x[0] - y[0]);
    const merged: [number, number][] = [];
    for (const s of spans) {
      const last: [number, number] | undefined = merged.at(-1);
      if (last !== undefined && s[0] - last[1] < HOLD)
        last[1] = Math.max(last[1], s[1]);
      else merged.push([s[0], s[1]]);
    }
    return merged;
  }

  /**
   * The bed's gain at an instant.
   *
   * @param seconds Film seconds.
   * @param ducked Ducked spans.
   * @param raised Raised spans.
   * @returns Linear gain.
   */
  export function gain(
    seconds: number,
    ducked: readonly (readonly [number, number])[],
    raised: readonly (readonly [number, number])[],
  ): number {
    const inside = (spans: readonly (readonly [number, number])[]): boolean =>
      spans.some(([s, e]) => s <= seconds && seconds < e);
    return inside(ducked) ? GAIN * DUCK : inside(raised) ? GAIN * RISE : GAIN;
  }

  /**
   * The bed's segments over the film.
   *
   * @param duration The film's running time, seconds.
   * @param words Each spoken word's onset and end, seconds.
   * @param raised Spans the crowd roars, seconds.
   * @returns Consecutive segments from 0 to `duration`.
   */
  export function of(
    duration: number,
    words: readonly (readonly [number, number])[],
    raised: readonly (readonly [number, number])[],
  ): ISegment[] {
    const ducked: [number, number][] = ducks(words);
    const wraps: number[] = Array.from(
      { length: Math.ceil(duration / LENGTH) },
      (_, k) => k * LENGTH,
    );
    const cuts: number[] = [
      0,
      duration,
      ...wraps,
      ...ducked.flat(),
      ...raised.flat(),
    ]
      .filter((t) => t >= 0 && t <= duration)
      .sort((x, y) => x - y)
      .filter((t, k, all) => k === 0 || t - all[k - 1]! > 1e-9);
    const segments: ISegment[] = [];
    for (let k: number = 0; k + 1 < cuts.length; k++) {
      const start: number = cuts[k]!;
      const end: number = cuts[k + 1]!;
      const offset: number = start % LENGTH;
      // A read that continues into the next segment overlaps it by the
      // fade; one ending at the film's end or the recording's end does not.
      const continues: boolean =
        end < duration - 1e-9 &&
        offset + (end - start) + CROSSFADE <= LENGTH + 1e-9;
      segments.push({
        asset: ASSET,
        seconds: start,
        gain: gain(start, ducked, raised),
        offsetSeconds: offset,
        durationSeconds: end - start + (continues ? CROSSFADE : 0),
      });
    }
    return segments;
  }
}
