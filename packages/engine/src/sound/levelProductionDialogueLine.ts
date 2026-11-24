import type { IAutoMovieLoudnessMeter } from "@automovie/interface";

import { createAutoMovieLoudnessMeter } from "./createAutoMovieLoudnessMeter";

/**
 * Place one dialogue line as the mixer adds it: its edge fade, its measured
 * loudness and the gain that moves it to the dialogue target.
 *
 * Each sample `i` of the line is scaled by the edge fade `min(1, i / 240, (n −
 * i) / 240)`, 5 ms at 48 kHz, so the line starts and ends without a click. The
 * mixer adds the mono line equally to both channels, so the faded line is
 * measured as that dual-mono stereo pair, which reads 3.01 LU above the same
 * samples measured as mono. A line shorter than one 400 ms gating block is
 * measured as one block over its whole length. The gain is the target minus the
 * measured loudness, bounded to ±12 dB, the range #4053 allows the mix to
 * correct: a line that needs more, or that no block lifts over the −70 LUFS
 * absolute gate, was generated at a level the mix should not hide and is
 * refused, naming its measured loudness. The placed samples are the faded line
 * times that gain, in double precision, so the mix and the speaker's envelope
 * jaw read the same levelled line.
 *
 * @param props The line's id, its 48 kHz samples and the dialogue target.
 * @returns The line's loudness as placed in LUFS, its gain in dB and its
 *   levelled mono samples.
 */
export function levelProductionDialogueLine(props: {
  /** Line id, for refusals. */
  id: string;

  /** Mono samples at 48 kHz. */
  samples: ArrayLike<number>;

  /** Dialogue target in LUFS. */
  targetLufs: number;
}): { measuredLufs: number; gainDb: number; placed: Float64Array } {
  const length: number = props.samples.length;
  const faded: Float64Array = new Float64Array(length);
  const pair: Float32Array = new Float32Array(length * 2);
  for (let index: number = 0; index < length; ++index) {
    const value: number =
      props.samples[index]! *
      Math.min(1, index / EDGE_SAMPLES, (length - index) / EDGE_SAMPLES);
    faded[index] = value;
    pair[index * 2] = value;
    pair[index * 2 + 1] = value;
  }
  const meter: IAutoMovieLoudnessMeter = createAutoMovieLoudnessMeter(2);
  meter.push(pair);
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
  const gain: number = 10 ** (gainDb / 20);
  for (let index: number = 0; index < length; ++index)
    faded[index] = faded[index]! * gain;
  return { measuredLufs: measured, gainDb, placed: faded };
}

/** Largest correction in dB the mix applies to a line, either way. */
const RANGE_DB: number = 12;

/** Samples of the line's fade in and fade out: 5 ms at 48 kHz. */
const EDGE_SAMPLES: number = 240;
