import type { IAutoMovieLoudnessMeter } from "@automovie/interface";

import { createLoudnessMeter } from "./createLoudnessMeter";

/*
 * Measure one dialogue line as the mixer places it and return the gain that
 * moves it to the dialogue target.
 *
 * The mixer adds a mono line equally to both channels after its edge fade, so
 * the line is measured as that dual-mono stereo pair, which reads 3.01 LU above
 * the same samples measured as mono. A line shorter than one 400 ms gating
 * block is measured as one block over its whole length. The gain is the target
 * minus the measured loudness, bounded to ±12 dB, the range #4053 allows the
 * mix to correct: a line that needs more, or that no block lifts over the −70
 * LUFS absolute gate, was generated at a level the mix should not hide and is
 * refused, naming its measured loudness.
 * Parameter props: The line's id, its placed samples' source, its edge fade and the
 * target.
 * Returns: The line's loudness as placed in LUFS and its gain in dB.
 */
export function levelProductionDialogueLine(props: {
  /*
   * Line id, for refusals.
   */
  id: string;

  /*
   * Mono samples at 48 kHz.
   */
  samples: ArrayLike<number>;

  /*
   * Edge fade the mixer applies to sample `index` of the line.
   */
  fade: (index: number) => number;

  /*
   * Dialogue target in LUFS.
   */
  targetLufs: number;
}): { measuredLufs: number; gainDb: number } {
  const meter: IAutoMovieLoudnessMeter = createLoudnessMeter(2);
  const placed: Float32Array = new Float32Array(props.samples.length * 2);
  for (let index: number = 0; index < props.samples.length; ++index) {
    const value: number = props.samples[index]! * props.fade(index);
    placed[index * 2] = value;
    placed[index * 2 + 1] = value;
  }
  meter.push(placed);
  const measured: number | null = meter.measure().integratedLufs;
  if (measured === null)
    throw new Error(
      `Dialogue line "${props.id}" measures below the −70 LUFS absolute gate as placed; it cannot be levelled to ${props.targetLufs} LUFS.`,
    );
  const gainDb: number = props.targetLufs - measured;
  if (Math.abs(gainDb) > RANGE_DB)
    throw new Error(
      `Dialogue line "${props.id}" measures ${measured.toFixed(2)} LUFS as placed and needs ${gainDb.toFixed(2)} dB to reach ${props.targetLufs} LUFS, beyond the ±${RANGE_DB} dB the mix corrects; generate it nearer the target.`,
    );
  return { measuredLufs: measured, gainDb };
}

/*
 * Largest correction in dB the mix applies to a line, either way.
 */
const RANGE_DB: number = 12;
