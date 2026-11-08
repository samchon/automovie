/**
 * The film's fixed sound sources by asset id, as paths relative to the
 * production root, with each file's length and audible length: the bell,
 * the referee's recorded commands and count, the crowd bed, and the impact,
 * breath, step, air and fall takes listed in `media/manifest.json` with
 * their provenance.
 *
 * ```ts
 * SoundAssets.paths.bell; // "media/automovie/kickboxing/audios/bell.wav"
 * SoundAssets.seconds.crowd; // 24
 * SoundAssets.audible.count7; // 0.8
 * ```
 *
 * @evidence docs/body/settings/sound/ring-sound.md#contacts The contact palette.
 * @evidence docs/body/settings/cast/referee.md#voice His recorded voice.
 * @evidence docs/research/sound/ring-mix.md#law Cues bounded by measured audible lengths.
 */
export namespace SoundAssets {
  /**
   * Each asset's length in seconds, read from its WAV header (48 kHz mono
   * PCM16): data bytes over 96 000 bytes per second.
   */
  export const seconds: Readonly<Record<string, number>> = Object.freeze({
    punch1: 0.8,
    punch2: 0.8,
    punch3: 0.8,
    punch4: 0.8,
    punch5: 0.8,
    fight: 0.8,
    bell: 2.1,
    breath: 24,
    crowd: 24,
    step: 0.25,
    air: 0.25,
    fall: 0.8,
    down: 0.65,
    neutral: 1.7,
    decision: 2.3,
    ...Object.fromEntries(
      Array.from({ length: 10 }, (_, k) => [`count${k + 1}`, 0.9]),
    ),
  });

  /**
   * Each one-shot asset's audible length in seconds: from the file's start to
   * the end of its last 50 ms RMS window within 30 dB of the file's loudest
   * window. The tail after it is silence padding or room noise under the
   * mix, so a cue that stops there loses nothing heard. The bell keeps its
   * whole ring; the beds (crowd, breath) are excerpted instead.
   */
  export const audible: Readonly<Record<string, number>> = Object.freeze({
    punch1: 0.35,
    punch2: 0.3,
    punch3: 0.35,
    punch4: 0.35,
    punch5: 0.35,
    step: 0.1,
    air: 0.25,
    fall: 0.3,
    bell: 2.1,
    fight: 0.6,
    down: 0.6,
    neutral: 0.95,
    decision: 2.05,
    count1: 0.55,
    count2: 0.55,
    count3: 0.7,
    count4: 0.65,
    count5: 0.65,
    count6: 0.75,
    count7: 0.8,
    count8: 0.5,
    count9: 0.55,
    count10: 0.6,
  });

  /** Asset ids. */
  export const ids: readonly string[] = Object.freeze(Object.keys(seconds));

  /** Production-relative WAV path of every asset. */
  export const paths: Readonly<Record<string, string>> = Object.freeze(
    Object.fromEntries(
      ids.map((id) => [id, `media/automovie/kickboxing/audios/${id}.wav`]),
    ),
  );
}
