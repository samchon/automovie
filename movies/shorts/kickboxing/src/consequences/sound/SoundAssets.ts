/**
 * The film's fixed sound sources by asset id, as paths relative to the
 * production root: the bell, the referee's recorded commands and count, and
 * the impact, breath, step, air and fall takes listed in
 * `media/manifest.json` with their provenance.
 *
 * ```ts
 * SoundAssets.paths.bell; // "media/automovie/kickboxing/audios/bell.wav"
 * ```
 *
 * @evidence docs/body/settings/sound/ring-sound.md#contacts The contact palette.
 * @evidence docs/body/settings/cast/referee.md#voice His recorded voice.
 */
export namespace SoundAssets {
  /** Asset ids. */
  export const ids: readonly string[] = Object.freeze([
    "punch1",
    "punch2",
    "punch3",
    "punch4",
    "punch5",
    "fight",
    "bell",
    "breath",
    "step",
    "air",
    "fall",
    "down",
    "neutral",
    "decision",
    ...Array.from({ length: 10 }, (_, k) => `count${k + 1}`),
  ]);

  /** Production-relative WAV path of every asset. */
  export const paths: Readonly<Record<string, string>> = Object.freeze(
    Object.fromEntries(
      ids.map((id) => [id, `media/automovie/kickboxing/audios/${id}.wav`]),
    ),
  );
}
