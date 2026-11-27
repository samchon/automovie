import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliRender } from "automovie";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { CliRenderDeliveryFixture } from "../internal/CliRenderDeliveryFixture";

/**
 * Publishes only complete and approved video while always preserving the report
 * for a failed attempt that reaches the output transaction.
 *
 * Scenarios:
 *
 * 1. A generic video-only render publishes with its encoded digest and a black
 *    interval its drawn frames also show, which needs no approval without
 *    declared intent.
 * 2. A commissioned render retains both scene and decoded blockers, their frame
 *    cursor, the failed candidate's digest, and the previous film.
 * 3. A source-owned soundtrack and native silence allowance pass through the same
 *    entry. The final codec frame's samples past the container's end are
 *    padding, not duration. Missing required audio and a container that
 *    presents too little audio block.
 * 4. Encode refusal publishes its phase and reason, keeps the scene inspection
 *    drawn before it, and keeps the approved bytes.
 * 5. An interrupted empty output reservation can be reclaimed. A live reservation
 *    prevents a second writer from touching either published file.
 * 6. A report that cannot be installed restores the previous film, so the film and
 *    report never come from different attempts.
 * 7. A file whose `colr` box declares limited range is blocked with
 *    `unsupported-video-profile.color`, its report records the field with its
 *    expected and observed values, and the previous conforming film stays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the receipt, timing and release behavior verified by each case.
 * @evidence contracts/development/testing.md#behavioral-verification Uses normal CLI operations with Render's real composer and validators, with a fake draw session and FFmpeg process boundary, and a real MP4 movie box for the audio timing.
 * @evidence contracts/development/testing.md#independent-expectations Four 250-tick frames put the first black frame at 0.25 seconds. Each published digest is Node's SHA-256 of the bytes the fixture encoder wrote. A 48 kHz track skipping 24,000 priming samples and editing to 1000 ms presents 48,000 of 72,000 decoded samples, leaving 24,000 of padding; a 750 ms edit presents 36,000, a quarter second short. The conforming header carries the profile the types declare: a 4 fps clock in a movie and track timescale of 4, the 2 by 2 raster, the unity matrix and `nclx` 1, 13, 1, full range; limited range is the one changed field of the refused file.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises absence, explicit content intent, mixed scene and delivery blockers, allowed silence, codec padding against a short container, missing audio, an encoder failure, a report installation failure and a limited-range colour box. Every probe field is owned by test_cli_delivery_video_probe, the audio profile by test_render_delivery_audio_profile and the lip-sync publication gate by test_cli_render_video_lip_sync.
 * @evidence contracts/development/testing.md#execution-ownership Owns its isolated temporary directory and calls no FFmpeg, browser or device.
 */
export async function test_cli_render_video_delivery(): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "automovie-delivery-"));
  const delivery: CliRenderDeliveryFixture = new CliRenderDeliveryFixture(root);
  const { silent, soundtrack, sha256 } = CliRenderDeliveryFixture;
  const video: string = delivery.video;
  const report: string = delivery.report;
  const reservation: string = delivery.reservation;

  try {
    await fs.mkdir(reservation, { recursive: true });
    await AutoMovieCliRender.renderVideo(delivery.input, delivery.run);
    const first = await delivery.readReport();
    const originalDigest = sha256(silent());
    TestValidator.equals(
      "generic video only is published with its actual encoded SHA",
      [
        first.status,
        first.video,
        first.source.sha256,
        first.delivery.streams.audio.status,
        first.delivery.findings[0].outcome,
        first.profile,
      ],
      ["published", "film.mp4", originalDigest, "missing", "drawn", []],
    );

    // 7. A limited-range colour box blocks and keeps the conforming film.
    delivery.encodedBytes = silent(false);
    const limited = await delivery.rejected();
    const refused = await delivery.readReport();
    TestValidator.equals(
      "a limited-range file is refused with its field and values",
      [
        limited.includes("unsupported-video-profile.color"),
        refused.status,
        refused.source.sha256,
        refused.profile,
        (await fs.readFile(video)).equals(silent()),
      ],
      [
        true,
        "blocked",
        sha256(silent(false)),
        [
          {
            media: "video",
            field: "color.resolved.kind",
            expected: "srgb",
            observed: "absent",
          },
        ],
        true,
      ],
    );

    delivery.intent = {};
    delivery.sceneError = true;
    delivery.encodedBytes = silent(true, [1, 1]);
    const failure = await delivery.rejected();
    const blocked = await delivery.readReport();
    TestValidator.equals(
      "both selected checks retain the same inspectable cursor",
      [
        failure.includes("SCENE_FIXTURE at frame 1 (0.25 s)"),
        failure.includes("black at frame 1 (0.25 s)"),
      ],
      [true, true],
    );
    TestValidator.equals(
      "blocked attempt carries its own digest and both diagnostics",
      [
        blocked.status,
        blocked.video,
        blocked.source.sha256,
        blocked.diagnostics.episodes[0].first.time.outputFrame,
        blocked.delivery.findings[0].firstOutputFrame,
      ],
      ["blocked", null, sha256(silent(true, [1, 1])), 1, 1],
    );
    TestValidator.equals(
      "the previous accepted film survives both blockers",
      (await fs.readFile(video)).equals(silent()),
      true,
    );

    delivery.sceneError = false;
    const start = { ticks: 1, timeBase: [1, 4] as const };
    const end = { ticks: 1, timeBase: [1, 1] as const };
    const intent: IAutoMovieDeliveryContentAudit.IIntent = {
      audio: { path: "sound/accompaniment.wav", required: true },
      allowances: [
        { detector: "black", start, end },
        { detector: "silence", start, end },
      ],
    };
    delivery.intent = intent;
    delivery.includeAudio = true;
    delivery.encodedBytes = soundtrack(750);
    TestValidator.equals(
      "codec padding cannot hide a short presented duration",
      [
        (await delivery.rejected()).includes(
          "audio: The decoded stream does not cover the commissioned presentation",
        ),
        (await delivery.readReport()).delivery.streams.audio.end.ticks,
        (await fs.readFile(video)).equals(silent()),
      ],
      [true, 36_000, true],
    );

    delivery.encodedBytes = soundtrack(1000);
    await AutoMovieCliRender.renderVideo(delivery.input, delivery.run);
    const approved = await delivery.readReport();
    TestValidator.equals(
      "source path is resolved by CLI and authored silence is allowed",
      [
        delivery.encoderSoundtrack,
        approved.status,
        approved.delivery.findings[1].outcome,
        approved.delivery.findings[1].firstOutputFrame,
      ],
      [
        path.join(root, "sound", "accompaniment.wav"),
        "published",
        "intentional",
        undefined,
      ],
    );
    TestValidator.equals(
      "the final frame's samples past the container end are padding",
      [
        approved.delivery.streams.audio.end.ticks,
        approved.delivery.streams.audio.trailingPadding,
      ],
      [48_000, 24_000],
    );

    intent.audio = { path: null, required: true };
    delivery.includeAudio = false;
    delivery.encodedBytes = "rejected candidate";
    const missing = await delivery.rejected();
    TestValidator.equals(
      "a required missing stream is diagnosed without replacing the film",
      [
        missing.includes("commissioned stream is absent"),
        (await fs.readFile(video)).equals(soundtrack(1000)),
      ],
      [true, true],
    );

    delivery.refuseEncode = true;
    delivery.sceneError = true;
    const refusal = await delivery.rejected();
    const failed = await delivery.readReport();
    TestValidator.equals(
      "encoder failure retains independent phase and reason",
      [
        refusal.includes(report),
        failed.status,
        failed.video,
        failed.failure.phase,
        failed.source,
      ],
      [true, "failed", null, "encode", null],
    );
    TestValidator.equals(
      "encoder failure keeps the scene inspection already drawn",
      [
        failed.frames.length,
        failed.diagnostics.hasBlockingFinding,
        failed.diagnostics.episodes[0].first.time.outputFrame,
      ],
      [4, true, 1],
    );
    delivery.sceneError = false;
    await fs.mkdir(reservation);
    const activeTicket = path.join(
      reservation,
      "owner-" + process.pid + "-.render-live",
    );
    await fs.writeFile(activeTicket, "");
    const conflict = await delivery.rejected();
    TestValidator.equals(
      "a live reservation leaves the published paths alone",
      [
        conflict.includes("Another render has reserved"),
        (await fs.readFile(video)).equals(soundtrack(1000)),
        (await delivery.readReport()).failure.phase,
      ],
      [true, true, "encode"],
    );
    await fs.unlink(activeTicket);
    await fs.rmdir(reservation);
    TestValidator.equals(
      "every opened session closes",
      delivery.sessionsClosed,
      8,
    );
    TestValidator.equals(
      "no temporary output survives the attempts",
      (await fs.readdir(path.dirname(report))).sort((a, b) =>
        a.localeCompare(b),
      ),
      ["film.mp4", "render-report.json"],
    );

    // A directory in the report's place refuses the report's rename.
    delivery.refuseEncode = false;
    delivery.intent = undefined;
    delivery.includeAudio = false;
    delivery.encodedBytes = "never published";
    await fs.rm(report);
    await fs.mkdir(path.join(report, "occupied"), { recursive: true });
    const unreported = await delivery.rejected();
    TestValidator.equals(
      "a report that cannot be installed restores the previous film",
      [
        unreported.includes("could not publish"),
        (await fs.readFile(video)).equals(soundtrack(1000)),
        (await fs.readdir(path.dirname(report))).sort((a, b) =>
          a.localeCompare(b),
        ),
      ],
      [true, true, ["film.mp4", "render-report.json"]],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}
