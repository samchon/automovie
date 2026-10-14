import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieProductionSoundRaster } from "../../../../packages/engine/src/sound/IAutoMovieProductionSoundRaster";
import { IAutoMovieRenderedProductionSound } from "../../../../packages/engine/src/sound/IAutoMovieRenderedProductionSound";
import { deriveProductionSoundPlan } from "../../../../packages/engine/src/sound/deriveProductionSoundPlan";
import { productionSoundSpectrogram } from "../../../../packages/engine/src/sound/productionSoundSpectrogram";
import { productionSoundWaveform } from "../../../../packages/engine/src/sound/productionSoundWaveform";
import { renderProductionSound } from "../../../../packages/engine/src/sound/renderProductionSound";
import { namedFacts } from "../internal/predicates";
import {
  productionSoundCompiled,
  productionSoundContract,
  productionSoundRefused,
  productionSoundTimeline,
} from "./productionSoundFixtures";

/**
 * Actual mixed PCM becomes opaque evidence rasters with bounded drawable rows.
 *
 * Scenarios:
 *
 * 1. The existing sound-film mix produces correctly sized waveform/spectrogram bytes with opaque alpha.
 * 2. Invalid pixel dimensions and incomplete stereo frames retain their named refusals.
 * 3. Positive heights 1..3 preserve a visible centre row; very large finite peaks saturate the viewport without unbounded row traversal.
 * 4. NaN and infinity samples are refused before drawing, while empty stereo input remains an opaque silent raster.
 *
 * @evidence contracts/testing.md#behavioral-verification Real planning/mixing and both CPU raster drawers produce observable byte buffers and refusals; tiny-height centre pixels catch negative-radius omission and huge finite peaks must return a fully bounded column.
 * @evidence contracts/testing.md#independent-expectations Four channels per pixel and alpha255 follow the RGBA contract; tiny canvases have a centre row floor(height/2), and an over-height bar fills all eight rows. A silent eight-row control supplies contrasting background and centreline bytes solely to identify painted rows; this geometric metamorphic check is not an independent palette or spectral oracle, and no implementation color codes are transcribed.
 * @evidence contracts/testing.md#distinguishing-cases Mixed stereo, zero/fractional sizes, odd sample length, three tiny heights, huge finite peaks, both non-finite kinds and empty PCM distinguish drawable viewport bounds from rewriting audio; spectral/clock physical laws remain in their owning sound tests.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_film_production_sound_raster; existing authored-film fixtures, engine mix and returned raster bytes require no encoder, viewer, GPU or mock host.
 */
export function test_film_production_sound_raster(): void {
  const source: IAutoMovieCompiledShotSource = productionSoundCompiled();
  const plan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: productionSoundTimeline(),
    contracts: new Map([["sound-shot", productionSoundContract()]]),
    compiled: new Map([["sound-shot", source]]),
  });
  const mixed: IAutoMovieRenderedProductionSound = renderProductionSound({
    plan,
    dialogue: new Map([["line", Float32Array.from([0.5])]]),
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
        "refusedProductionSoundSpectrogramFirst",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundRaster =>
              productionSoundSpectrogram(mixed.pcm, 1.5, 10),
            "positive integers",
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
      refusedProductionSoundSpectrogramFirst: true,
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
  for (const value of [NaN, Infinity]) {
    TestValidator.equals(
      "waveform refuses non-finite PCM",
      productionSoundRefused(
        (): IAutoMovieProductionSoundRaster =>
          productionSoundWaveform(Float32Array.from([value, 0]), 1, 8),
        "finite PCM",
      ),
      true,
    );
    TestValidator.equals(
      "spectrogram refuses non-finite PCM",
      productionSoundRefused(
        (): IAutoMovieProductionSoundRaster =>
          productionSoundSpectrogram(Float32Array.from([value, 0]), 1, 8),
        "finite PCM",
      ),
      true,
    );
  }
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
