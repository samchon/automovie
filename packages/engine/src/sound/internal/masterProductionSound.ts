import type {
  IAutoMovieLoudnessMeter,
  IAutoMovieMasterProductionSound,
  IAutoMovieProductionSoundAnalysis,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../../film/internal/productionFrameBoundaryToGridTick";
import { resolveProductionFrameRate } from "../../film/internal/resolveProductionFrameRate";
import { AUTOMOVIE_TRUE_PEAK_LIMITER } from "../constants/AUTOMOVIE_TRUE_PEAK_LIMITER";
import { analyzeProductionSound } from "./analyzeProductionSound";
import { createLoudnessMeter } from "./createLoudnessMeter";
import { limitTruePeak } from "./limitTruePeak";

/*
 * Master a production mix: bring it to its integrated loudness target with one
 * static gain and hold its true peak under the limiter ceiling.
 *
 * The targets are the ones the mix was levelled to (`rendered.loudness`). The
 * mix's samples are copied, multiplied by the static gain, and
 * `limitTruePeak` holds every true peak at or below `ceilingDbtp` with
 * the look-ahead and release of `AUTOMOVIE_TRUE_PEAK_LIMITER`. Limiting lowers
 * loudness by an amount only the limited result shows, so the gain is solved
 * rather than guessed: it starts at the target minus the mix's loudness, and
 * while the limited master misses the target by more than 0.01 LU (a tenth of
 * the 0.1 LU resolution EBU Tech 3341 asks of a meter), the miss is added to
 * the gain and the copy is limited again, at most four times. The master is
 * then analysed, and refused, with its measured loudness, when it still misses
 * the target by more than the tolerance. A mix that no block lifts over the −70
 * LUFS absolute gate has no loudness to move and is returned unchanged and
 * unchecked.
 * Parameter props: The plan and the unmastered mix.
 * Returns: A fresh master, its analysis and the loudness record with its master
 * stage.
 */
export function masterProductionSound(
  props: IAutoMovieMasterProductionSound.IProps,
): IAutoMovieRenderedProductionSound {
  const { loudness }: IAutoMovieRenderedProductionSound = props.rendered;
  const mix: Float32Array = props.rendered.pcm;
  const mixLufs: number | null = integrated(mix);
  const pcm: Float32Array = mix.slice();
  let gainDb: number = 0;
  let limiterGainDb: number = 0;
  if (mixLufs !== null) {
    gainDb = loudness.intent.integratedLufs - mixLufs;
    for (let attempt: number = 0; attempt < 5; ++attempt) {
      const gain: number = 10 ** (gainDb / 20);
      for (let index: number = 0; index < mix.length; ++index)
        pcm[index] = Math.fround(mix[index]! * gain);
      limiterGainDb = limitTruePeak({
        pcm,
        sampleRate: 48_000,
        ceilingDbtp: loudness.ceilingDbtp,
        lookAheadSeconds: AUTOMOVIE_TRUE_PEAK_LIMITER.lookAheadSeconds,
        releaseSeconds: AUTOMOVIE_TRUE_PEAK_LIMITER.releaseSeconds,
      });
      const miss: number =
        loudness.intent.integratedLufs - (integrated(pcm) ?? -Infinity);
      if (Math.abs(miss) <= 0.01 || attempt === 4) break;
      gainDb += miss;
    }
  }

  const analysis: IAutoMovieProductionSoundAnalysis = analyzeProductionSound(
    props.plan,
    pcm,
    (frame: number): number =>
      productionFrameBoundaryToGridTick({
        frame,
        frameRate: resolveProductionFrameRate(props.plan),
        ticksPerSecond: props.plan.sampleRate,
        rounding: "nearest",
      }),
  );
  if (
    mixLufs !== null &&
    (analysis.integratedLoudness === null ||
      Math.abs(analysis.integratedLoudness - loudness.intent.integratedLufs) >
        loudness.intent.toleranceLu)
  )
    throw new Error(
      `Production sound master measures ${analysis.integratedLoudness?.toFixed(2) ?? "below the absolute gate"} LUFS after a ${gainDb.toFixed(2)} dB gain and true-peak limiting to ${loudness.ceilingDbtp} dBTP, missing the ${loudness.intent.integratedLufs} LUFS target by more than ${loudness.intent.toleranceLu} LU.`,
    );
  return {
    pcm,
    analysis,
    loudness: { ...loudness, master: { mixLufs, gainDb, limiterGainDb } },
  };
}

/*
 * Integrated loudness of an interleaved stereo buffer, or null below the
 * absolute gate.
 */
const integrated: (pcm: Float32Array) => number | null = (
  pcm: Float32Array,
): number | null => {
  const meter: IAutoMovieLoudnessMeter = createLoudnessMeter(2);
  meter.push(pcm);
  return meter.measure().integratedLufs;
};
