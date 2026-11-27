import type { IAutoMovieProductionSoundRaster } from "@automovie/interface";

import { AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS } from "../AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS";
import { assertProductionSoundRasterInput } from "./assertProductionSoundRasterInput";

/*
 * Draw stereo peak bars on a bounded opaque RGBA viewport.
 */
export const productionSoundWaveform: (
  pcm: Float32Array<ArrayBufferLike>,
  width?: number,
  height?: number,
) => IAutoMovieProductionSoundRaster = (
  pcm: Float32Array,
  width: number = AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS.waveform.width,
  height: number = AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS.waveform.height,
): IAutoMovieProductionSoundRaster => {
  assertProductionSoundRasterInput(pcm, width, height, "waveform");
  const rgba: Uint8Array<ArrayBufferLike> = rasterBackground(width, height);
  const frames: number = pcm.length / 2;
  const middle: number = Math.floor(height / 2);
  for (let x: number = 0; x < width; ++x) {
    const from: number = Math.floor((frames * x) / width);
    const to: number = Math.max(
      from + 1,
      Math.floor((frames * (x + 1)) / width),
    );
    let amplitude: number = 0;
    for (let sample: number = from; sample < Math.min(to, frames); ++sample)
      amplitude = Math.max(
        amplitude,
        Math.abs(pcm[sample * 2]!),
        Math.abs(pcm[sample * 2 + 1]!),
      );
    const radius: number = Math.round(amplitude * Math.max(0, height / 2 - 2));
    for (
      let y: number = Math.max(0, middle - radius);
      y <= Math.min(height - 1, middle + radius);
      ++y
    )
      setPixel(rgba, width, x, y, 75, 222, 190);
  }
  return { width, height, rgba };
};

/*
 * Allocate a fresh opaque dark RGBA canvas; allocation failure propagates
 * before any raster is published.
 */
const rasterBackground: (
  width: number,
  height: number,
) => Uint8Array<ArrayBufferLike> = (
  width: number,
  height: number,
): Uint8Array => {
  const rgba: Uint8Array<ArrayBuffer> = new Uint8Array(width * height * 4);
  for (let index: number = 0; index < rgba.length; index += 4) {
    rgba[index] = 8;
    rgba[index + 1] = 15;
    rgba[index + 2] = 28;
    rgba[index + 3] = 255;
  }
  return rgba;
};

/*
 * Write one admitted in-viewport row-major pixel with the drawer's bounded byte
 * palette; this private writer performs no independent coordinate admission.
 */
const setPixel: (
  rgba: Uint8Array<ArrayBufferLike>,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
) => void = (
  rgba: Uint8Array,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
): void => {
  const index: number = (y * width + x) * 4;
  rgba[index] = red;
  rgba[index + 1] = green;
  rgba[index + 2] = blue;
  rgba[index + 3] = 255;
};
