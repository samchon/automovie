import { auditAutoMovieEncodedPresentation } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `auditAutoMovieEncodedPresentation` checks a probe of the delivered file
 * against the commissioned media profile.
 *
 * Scenarios:
 *
 * 1. An H.264 stream of 64 by 32 at 24/1 and a 48 kHz stereo AAC stream, both
 *    starting at 0 and lasting exactly 3 s, pass.
 * 2. A different width, another audio rate, a nonzero start, an inexact
 *    duration and a missing audio stream are each refused.
 */
export function test_unit_render_delivery_audit_encoded_presentation(): void {
  const video = (patch: Record<string, string | number>) => ({
    codec_type: "video",
    codec_name: "h264",
    width: 64,
    height: 32,
    avg_frame_rate: "24/1",
    time_base: "1/12288",
    duration_ts: 36864,
    start_time: "0.000000",
    ...patch,
  });
  const audio = (patch: Record<string, string | number>) => ({
    codec_type: "audio",
    codec_name: "aac",
    sample_rate: "48000",
    channels: 2,
    time_base: "1/48000",
    duration_ts: 144000,
    start_time: "0.000000",
    ...patch,
  });
  const expected: { durationSeconds: number; width: number; height: number; fps: number } = {
    durationSeconds: 3,
    width: 64,
    height: 32,
    fps: 24,
  };
  auditAutoMovieEncodedPresentation({ streams: [video({}), audio({})] }, expected);
  for (const [title, streams] of [
    ["width", [video({ width: 65 }), audio({})]],
    ["rate", [video({}), audio({ sample_rate: "44100" })]],
    ["start", [video({ start_time: "0.5" }), audio({})]],
    ["duration", [video({ duration_ts: 36863 }), audio({})]],
    ["no audio", [video({})]],
  ] as const)
    TestValidator.error(title, (): void => {
      auditAutoMovieEncodedPresentation({ streams }, expected);
    });
}