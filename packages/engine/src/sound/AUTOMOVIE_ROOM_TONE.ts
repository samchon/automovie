/**
 * Fixed settings of room-tone generation, `mixProductionRoomTone`.
 *
 * `bandsHz` are the base-two octave band centres of IEC 61260-1, 1 kHz × 2^k
 * for k from −5 to 4, which span the audible range below the 24 kHz Nyquist
 * frequency of the 48 kHz mix. `crossfadeSeconds` is the length of the
 * equal-power crossfade where two beds meet and of the fade at a bed's free
 * edge; 100 ms is long against one period of the lowest band, so the change of
 * noise texture is not heard as a click, and short against a scene.
 * `warmUpSeconds` is the noise run through the filters before a bed's first
 * sample: the slowest section, at 31.25 Hz with Q ≈ 1.414, decays with time
 * constant Q / (π f) ≈ 14 ms, so 200 ms leaves under 1e−6 of its start-up
 * transient. These are design choices of the generator, not measured values.
 */
export const AUTOMOVIE_ROOM_TONE: Readonly<{
  /** Octave band centres in Hz. */
  bandsHz: readonly number[];

  /** Crossfade and free-edge fade length, in seconds. */
  crossfadeSeconds: number;

  /** Filter warm-up before a bed's first sample, in seconds. */
  warmUpSeconds: number;
}> = {
  bandsHz: [
    31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
  ],
  crossfadeSeconds: 0.1,
  warmUpSeconds: 0.2,
};
