import { decodeProductionAudioAsset } from "@automovie/ingest";

/**
 * Exact PCM interchange shared by browser preparation and soundtrack export.
 *
 * @evidence contracts/common.md#implementation-and-ownership The public Ingest decoder reads fixed PCM RIFF files without a platform codec; this production writes its stereo PCM16 delivery interchange. Rejecting unsupported or truncated files keeps browser and Node sample interpretation identical. Allocation is linear in retained samples.
 * @evidence contracts/common.md#authoring-interface Bytes are complete little-endian WAV files; decoded values are normalized amplitudes. Encoding accepts equally sized stereo channels and refuses clipping rather than silently limiting the soundtrack.
 */
export namespace AudioPcm {
  /**
   * Read admitted mono PCM16 samples, skipping bounded ancillary RIFF chunks.
   *
   * @evidence contracts/common.md#implementation-and-ownership Delegates RIFF, format and finite-sample admission to the public Ingest decoder, then requires the production's adopted 48 kHz mono source format. The returned samples alias no source bytes.
   * @evidence contracts/common.md#authoring-interface The input may include broadcast or metadata chunks. Unsupported compression, stereo sources and a missing or empty data chunk throw; preparation must convert them before adoption.
   */
  export function decode(bytes: Uint8Array): Float32Array {
    const decoded: ReturnType<typeof decodeProductionAudioAsset> = decodeProductionAudioAsset({ path: "adopted soundtrack source", bytes, sampleRate: 48000 });
    if (decoded.sourceSampleRate !== 48000 || decoded.sourceChannels !== 1 || decoded.sourceFormat.encoding !== "pcm-s16le" || decoded.samples.length === 0) throw new Error("Audio assets require nonempty 48 kHz mono PCM16");
    return decoded.samples;
  }

  /**
   * Encode two equally sized 48 kHz channels with one deterministic quantizer.
   *
   * @evidence contracts/common.md#implementation-and-ownership Finite amplitudes outside [-1,1] reject before quantization. The new RIFF buffer contains exactly one stereo frame per supplied pair and no codec padding.
   * @evidence contracts/common.md#authoring-interface Channels use normalized amplitudes and cannot be empty. This function does not normalize, resample, fade or decide a film duration; the shared mixer owns those decisions.
   */
  export function encode(left: Float32Array, right: Float32Array): Uint8Array {
    if (left.length === 0 || left.length !== right.length || left.length > (0xffffffff - 36) / 4) throw new Error("Invalid stereo PCM length");
    const bytes: Uint8Array = new Uint8Array(44 + left.length * 4);
    const view: DataView = new DataView(bytes.buffer);
    const write: (at: number, value: string) => void = (at: number, value: string): void => { for (let index: number = 0; index < value.length; index++) bytes[at + index] = value.charCodeAt(index); };
    write(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); write(8, "WAVE"); write(12, "fmt "); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, 48000, true); view.setUint32(28, 192000, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
    write(36, "data"); view.setUint32(40, left.length * 4, true);
    for (let index: number = 0; index < left.length; index++) {
      for (let channel: number = 0; channel < 2; channel++) {
        const sample: number = channel === 0 ? left[index] : right[index];
        if (!Number.isFinite(sample) || Math.abs(sample) > 1) throw new Error(`PCM clipping at frame ${index}, channel ${channel}`);
        view.setInt16(44 + index * 4 + channel * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
      }
    }
    return bytes;
  }
}
