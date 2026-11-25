import {
  deriveProductionSoundPlan,
  productionSoundSpectrogram,
  productionSoundWaveform,
  renderProductionSound,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieProductionSoundPlan,
  IAutoMovieProductionSoundRaster,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../../../internal/predicates";
import { productionSoundCompiled } from "../../../internal/productionSoundCompiled";
import { productionSoundContract } from "../../../internal/productionSoundContract";
import { productionSoundRefused } from "../../../internal/productionSoundRefused";
import { productionSoundTimeline } from "../../../internal/productionSoundTimeline";

/**
 * Actual mixed PCM becomes opaque evidence rasters with bounded drawable rows.
 *
 * Scenarios:
 *
 * 1. The existing sound-film mix produces correctly sized waveform/spectrogram
 *    bytes with opaque alpha.
 * 2. Invalid pixel dimensions and incomplete stereo frames retain their named
 *    refusals.
 * 3. Positive heights 1..3 preserve a visible centre row; very large finite peaks
 *    saturate the viewport without unbounded row traversal.
 * 4. Empty stereo input remains an opaque silent raster.
 *
 */
export function test_unit_engine_film_production_sound_raster(): void {
  const source: IAutoMovieCompiledShotSource = productionSoundCompiled();
  const plan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: productionSoundTimeline(),
    contracts: new Map([["sound-shot", productionSoundContract()]]),
    compiled: new Map([["sound-shot", source]]),
  });
  const mixed: IAutoMovieRenderedProductionSound = renderProductionSound({
    plan,
    // A 0.3 s 220 Hz line at 0.1 peak inside the caption's 0.4 s window.
    dialogue: new Map([
      [
        "line",
        Float32Array.from(
          { length: 14_400 },
          (_: unknown, index: number): number =>
            0.1 * Math.sin((2 * Math.PI * 220 * index) / 48_000),
        ),
      ],
    ]),
  });
  const waveform: IAutoMovieProductionSoundRaster = productionSoundWaveform(
    mixed.pcm,
    32,
    16,
  );
  const spectrogram: IAutoMovieProductionSoundRaster =
    productionSoundSpectrogram(mixed.pcm, 8, 8);
  TestValidator.equals(
    "waveform and spectrogram expose sized opaque RGBA rasters",
    namedFacts([
      ["waveformRgba", (): boolean => waveform.rgba.length === 32 * 16 * 4],
      ["spectrogramRgba", (): boolean => spectrogram.rgba.length === 8 * 8 * 4],
      [
        "waveformRgbaValue",
        (): boolean =>
          waveform.rgba.every(
            (value: number, index: number): boolean =>
              index % 4 !== 3 || value === 255,
          ),
      ],
      [
        "spectrogramRgbaValue",
        (): boolean =>
          spectrogram.rgba.every(
            (value: number, index: number): boolean =>
              index % 4 !== 3 || value === 255,
          ),
      ],
    ]),
    {
      waveformRgba: true,
      spectrogramRgba: true,
      waveformRgbaValue: true,
      spectrogramRgbaValue: true,
    },
  );
  TestValidator.equals(
    "sound rasters reject malformed dimensions and PCM",
    namedFacts([
      [
        "refusedProductionSoundWaveformFirst",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundRaster =>
              productionSoundWaveform(mixed.pcm, 0, 10),
            "positive integers",
          ),
      ],
      [
        "refusedProductionSoundWaveformNew",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundRaster =>
              productionSoundWaveform(new Float32Array(1), 10, 10),
            "interleaved stereo",
          ),
      ],
      [
        "refusedProductionSoundSpectrogramNew",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundRaster =>
              productionSoundSpectrogram(new Float32Array(1), 10, 10),
            "interleaved stereo",
          ),
      ],
    ]),
    {
      refusedProductionSoundWaveformFirst: true,
      refusedProductionSoundWaveformNew: true,
      refusedProductionSoundSpectrogramNew: true,
    },
  );
  const silentColumn: IAutoMovieProductionSoundRaster = productionSoundWaveform(
    new Float32Array(),
    1,
    8,
  );
  const painted: Uint8Array<ArrayBufferLike> = silentColumn.rgba.subarray(
    4 * 4,
    4 * 4 + 3,
  );
  const background: Uint8Array<ArrayBufferLike> = silentColumn.rgba.subarray(
    0,
    3,
  );
  TestValidator.predicate(
    "silence has a contrasting centreline",
    painted.some(
      (value: number, index: number): boolean => value !== background[index],
    ),
  );
  for (const height of [1, 2, 3]) {
    const tiny: IAutoMovieProductionSoundRaster = productionSoundWaveform(
      Float32Array.from([2, 2]),
      1,
      height,
    );
    const centre: number = Math.floor(height / 2) * 4;
    TestValidator.predicate(
      `height ${height} has a drawable centre row`,
      tiny.rgba[centre + 3] === 255 &&
        tiny.rgba
          .subarray(centre, centre + 3)
          .every(
            (value: number, index: number): boolean => value === painted[index],
          ),
    );
  }
  const saturated: IAutoMovieProductionSoundRaster = productionSoundWaveform(
    Float32Array.from([3e38, 3e38]),
    1,
    8,
  );
  for (let row: number = 0; row < 8; ++row)
    TestValidator.predicate(
      `large finite peak clips to viewport row ${row}`,
      saturated.rgba[row * 4 + 3] === 255 &&
        saturated.rgba
          .subarray(row * 4, row * 4 + 3)
          .every(
            (value: number, index: number): boolean => value === painted[index],
          ),
    );
  TestValidator.equals(
    "empty waveform is opaque silence",
    productionSoundWaveform(new Float32Array(), 1, 1).rgba[3],
    255,
  );
  TestValidator.equals(
    "empty spectrum is opaque silence",
    productionSoundSpectrogram(new Float32Array(), 1, 1).rgba[3],
    255,
  );
}
