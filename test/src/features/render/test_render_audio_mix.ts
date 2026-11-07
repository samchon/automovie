import { decodeProductionAudioAsset } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import { encodeAutoMovieWavPcm16 } from "../../../../packages/render/src/audio/encodeAutoMovieWavPcm16";
import { mixAutoMovieAudioPcm } from "../../../../packages/render/src/audio/mixAutoMovieAudioPcm";

/** Audio cues sum sample-accurately with equal-power pan, refuse clipping, and encode to PCM16 WAV that decodes back.
 *
 * Scenarios:
 * 1. A one-sample source placed at 0.5 s lands on output sample 50 at 100 Hz, centred at cos(pi/4) on both channels; full left pan puts it on the left only.
 * 2. Overlapping cues add, rate 2 reads every other source sample, an offset skips source samples, and edge fades taper the first and last samples.
 * 3. A sum above 1, a cue reading past its source and an unknown source are refused.
 * 4. The encoded WAV has the canonical header and decodes through the public decoder to the stereo mean within one quantization step.
 */
export function test_render_audio_mix(): void {
  const centre: number = Math.cos(Math.PI / 4);
  const mix = (
    cues: mixAutoMovieAudioPcm.ICue[],
    sources: Record<string, Float32Array>,
    fadeSeconds: number = 0,
  ): ReturnType<typeof mixAutoMovieAudioPcm> =>
    mixAutoMovieAudioPcm({
      sampleRate: 100,
      frames: 100,
      sources,
      cues,
      fadeSeconds,
    });
  const click: Float32Array = new Float32Array([0.5]);
  const placed = mix([{ asset: "click", seconds: 0.5, gain: 1 }], { click });
  const panned = mix([{ asset: "click", seconds: 0.5, gain: 1, pan: -1 }], {
    click,
  });
  TestValidator.predicate(
    "sample-accurate equal-power placement",
    Math.abs(placed.left[50]! - 0.5 * centre) < 1e-7 &&
      Math.abs(placed.right[50]! - 0.5 * centre) < 1e-7 &&
      placed.left[49] === 0 &&
      placed.left[51] === 0 &&
      Math.abs(panned.left[50]! - 0.5) < 1e-7 &&
      Math.abs(panned.right[50]!) < 1e-7,
  );

  // Sums, rates, offsets and fades.
  const ramp: Float32Array = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
  const summed = mix(
    [
      { asset: "click", seconds: 0.1, gain: 1 },
      { asset: "click", seconds: 0.1, gain: 0.5 },
      { asset: "ramp", seconds: 0.2, gain: 1, rate: 2 },
      {
        asset: "ramp",
        seconds: 0.4,
        gain: 1,
        offsetSeconds: 0.02,
        durationSeconds: 0.02,
      },
    ],
    { click, ramp },
  );
  const faded = mix([{ asset: "ramp", seconds: 0, gain: 1 }], { ramp }, 0.02);
  TestValidator.predicate(
    "sums, rates, offsets and fades",
    Math.abs(summed.left[10]! - 0.75 * centre) < 1e-7 &&
      [0.1, 0.3, 0.5].every(
        (x: number, k: number): boolean =>
          Math.abs(summed.left[20 + k]! - x * centre) < 1e-7,
      ) &&
      summed.left[23] === 0 &&
      Math.abs(summed.left[40]! - 0.3 * centre) < 1e-7 &&
      Math.abs(summed.left[41]! - 0.4 * centre) < 1e-7 &&
      summed.left[42] === 0 &&
      faded.left[0] === 0 &&
      Math.abs(faded.left[1]! - 0.2 * centre * 0.5) < 1e-7 &&
      Math.abs(faded.left[2]! - 0.3 * centre) < 1e-7 &&
      faded.left[5] === 0,
  );

  // Refusals.
  const refusals: string[] = [];
  for (const [label, run] of [
    [
      "clipping",
      () => mix([{ asset: "click", seconds: 0, gain: 4 }], { click }),
    ],
    [
      "past source",
      () =>
        mix([{ asset: "ramp", seconds: 0, gain: 1, durationSeconds: 0.07 }], {
          ramp,
        }),
    ],
    [
      "unknown source",
      () => mix([{ asset: "none", seconds: 0, gain: 1 }], { click }),
    ],
  ] as const)
    try {
      run();
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("mix refusals", refusals, []);

  // WAV round trip.
  const left: Float32Array = new Float32Array([0, 0.5, -1, 1]);
  const right: Float32Array = new Float32Array([0, -0.5, -1, 0.25]);
  const bytes: Uint8Array = encodeAutoMovieWavPcm16(left, right, 48000);
  const view: DataView = new DataView(bytes.buffer);
  const decoded = decodeProductionAudioAsset({
    path: "mix",
    bytes,
    sampleRate: 48000,
  });
  TestValidator.predicate(
    "canonical header and round trip",
    bytes.length === 44 + 16 &&
      new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
      view.getUint16(22, true) === 2 &&
      view.getUint32(24, true) === 48000 &&
      view.getInt16(44 + 4 * 2, true) === -32768 &&
      view.getInt16(44 + 4 * 3, true) === 32767 &&
      decoded.sourceChannels === 2 &&
      [...decoded.samples].every(
        (x: number, k: number): boolean =>
          Math.abs(x - (left[k]! + right[k]!) / 2) <= 1 / 32768,
      ),
  );
}
