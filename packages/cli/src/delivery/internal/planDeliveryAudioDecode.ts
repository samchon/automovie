import { planDeliveryInput } from "./planDeliveryInput";

/*
 * Plans a read-only decode of a known present audio stream into interleaved
 * little-endian 32-bit floating point samples. Its decoded frame log and PCM
 * byte count provide independent timing and content evidence.
 * Parameter path: The delivery file to decode.
 * Returns: Shell-free FFmpeg arguments with PCM on stdout and frame timing on
 * stderr.
 */
export function planDeliveryAudioDecode(path: string): string[] {
  return [
    ...planDeliveryInput(path),
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
