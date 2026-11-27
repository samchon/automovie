import type { IAutoMovieProductionSoundRaster } from "@automovie/interface";

/**
 * Default pixel size of each delivered sound-evidence picture.
 *
 * `productionSoundWaveform` and `productionSoundSpectrogram` draw at these
 * sizes when no size is passed, and render's `resolveProductionPngProfile`
 * requires them of a delivered `waveform.png` and `spectrogram.png`, so the
 * writer and the delivery check read one pair of numbers.
 */
export const AutoMovieEngineProductionSoundEvidenceRasters: Readonly<
  Record<
    "waveform" | "spectrogram",
    Readonly<Pick<IAutoMovieProductionSoundRaster, "width" | "height">>
  >
> = {
  waveform: { width: 960, height: 240 },
  spectrogram: { width: 512, height: 192 },
};
