import { planAutoMovieDeliveryInput } from "./planAutoMovieDeliveryInput";

/**
 * Plans a read-only decode of a known present audio stream into interleaved
 * little-endian 32-bit floating point samples. Its decoded frame log and PCM
 * byte count provide independent timing and content evidence.
 *
 * @param path The delivery file to decode.
 * @returns Shell-free FFmpeg arguments with PCM on stdout and frame timing on
 *   stderr.
 */
export function planAutoMovieDeliveryAudioDecode(path: string): string[] {
  return [
    ...planAutoMovieDeliveryInput(path),
    "-map",
    "0:a:0",
    "-vn",
    "-af",
    "aformat=sample_fmts=flt,ashowinfo",
    "-c:a",
    "pcm_f32le",
    "-f",
    "f32le",
    "pipe:1",
  ];
}
