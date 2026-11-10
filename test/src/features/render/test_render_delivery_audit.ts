import {
  assertAutoMovieCaptureClock,
  auditAutoMovieDecodedFrames,
  auditAutoMovieEncodedPresentation,
  planAutoMovieCaptureUrl,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** Delivery audits admit exactly the commissioned clock and profile, and capture plans keep to local pages.
 *
 * Scenarios:
 * 1. Three 30 fps frames in a 1/15360 time base are admitted, with an identical neighbour reported as a hold.
 * 2. A gap, an excess frame, a missing time base and a malformed row are refused.
 * 3. A probe with the commissioned raster, rate, codecs and exact durations passes; AAC padding past the duration and a wrong raster are refused.
 * 4. The capture URL keeps the path, sets parameters and drops autoplay; a remote host is refused.
 * 5. A ready page with the commissioned clock passes; a fractional or stale clock is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `assertAutoMovieCaptureClock`, `auditAutoMovieDecodedFrames`, `auditAutoMovieEncodedPresentation`, `planAutoMovieCaptureUrl` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate, 2x TestValidator.equals, 2x assertAutoMovieCaptureClock(; 5 numbered scenarios (first: Three 30 fps frames in a 1/15360 time base are admitted, with an identical neighbour reported as a hold.; last: A ready page with the commissioned clock passes; a fractional or stale clock is refused.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: Three 30 fps frames in a 1/15360 time base are admitted, with an identical neighbour reported as a hold.; last: A ready page with the commissioned clock passes; a fractional or stale clock is refused.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_render_delivery_audit`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Three 30 fps frames in a 1/15360 time base are admitted, with an identical neighbour reported as a hold.).
 */
export function test_render_delivery_audit(): void {
  const md5 = (k: number): string => k.toString(16).padStart(32, "0");
  const listing = (rows: string[]): string =>
    ["#format: frame checksums", "#tb 0: 1/15360", ...rows].join("\n");
  const row = (pts: number, hash: number): string =>
    `0, ${pts}, ${pts}, 512, 2764800, ${md5(hash)}`;
  const admitted: auditAutoMovieDecodedFrames.IResult =
    auditAutoMovieDecodedFrames(
      listing([row(0, 1), row(512, 1), row(1024, 2)]),
      3,
      30,
    );
  TestValidator.predicate(
    "admitted frames and holds",
    admitted.frameCount === 3 &&
      JSON.stringify(admitted.repeatedImages) === "[1]" &&
      admitted.durationSeconds === 0.1,
  );
  const refusals: string[] = [];
  for (const [label, run] of [
    [
      "gap",
      () =>
        auditAutoMovieDecodedFrames(
          listing([row(0, 1), row(1024, 2), row(1536, 3)]),
          3,
          30,
        ),
    ],
    [
      "excess",
      () =>
        auditAutoMovieDecodedFrames(
          listing([row(0, 1), row(512, 2), row(1024, 3)]),
          2,
          30,
        ),
    ],
    ["no time base", () => auditAutoMovieDecodedFrames(row(0, 1), 1, 30)],
    [
      "malformed",
      () => auditAutoMovieDecodedFrames(listing(["0, 0, 0, 512"]), 1, 30),
    ],
  ] as const)
    try {
      run();
      refusals.push(label);
    } catch {}
  TestValidator.equals("decoded refusals", refusals, []);

  // Encoded presentation.
  const probe = (audioTicks: string, width: number = 1280): object => ({
    streams: [
      {
        codec_type: "video",
        codec_name: "h264",
        width,
        height: 720,
        avg_frame_rate: "30/1",
        time_base: "1/15360",
        start_time: "0.000000",
        duration_ts: "153600",
      },
      {
        codec_type: "audio",
        codec_name: "aac",
        sample_rate: "48000",
        channels: 2,
        time_base: "1/48000",
        start_time: "0.000000",
        duration_ts: audioTicks,
      },
    ],
  });
  const expected = { durationSeconds: 10, width: 1280, height: 720, fps: 30 };
  auditAutoMovieEncodedPresentation(probe("480000"), expected);
  const presentationRefusals: string[] = [];
  for (const [label, value] of [
    ["padding", probe("481024")],
    ["raster", probe("480000", 1920)],
  ] as const)
    try {
      auditAutoMovieEncodedPresentation(value, expected);
      presentationRefusals.push(label);
    } catch {}
  TestValidator.equals("presentation refusals", presentationRefusals, []);

  // Capture planning and clock admission.
  const url: string = planAutoMovieCaptureUrl(
    "http://127.0.0.1:5199/film/?play=1&debug=1",
    { capture: "1", w: "1280" },
  );
  let remote: boolean = false;
  try {
    planAutoMovieCaptureUrl("http://example.com/", {});
  } catch {
    remote = true;
  }
  let stale: number = 0;
  for (const host of [
    { ready: true, durationSeconds: 15, fps: 30, frameCount: 450 },
    { ready: true, durationSeconds: 180, fps: 30, frameCount: 5399 },
    { ready: false, durationSeconds: 180, fps: 30, frameCount: 5400 },
  ])
    try {
      assertAutoMovieCaptureClock(host, { durationSeconds: 180, fps: 30 });
    } catch {
      stale++;
    }
  assertAutoMovieCaptureClock(
    { ready: true, durationSeconds: 180, fps: 30, frameCount: 5400 },
    { durationSeconds: 180, fps: 30 },
  );
  TestValidator.predicate(
    "capture planning",
    url === "http://127.0.0.1:5199/film/?debug=1&capture=1&w=1280" &&
      remote &&
      stale === 3,
  );
}
