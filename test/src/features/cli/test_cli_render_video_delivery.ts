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
 * @evidence contracts/development/common.md#meaningful-documentation Describes video and audio approval, blocked and failed receipts, exclusive output ownership, and rollback of a failed installation.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the CLI render with the real composer and validation over fixture draw and encoder boundaries. Reads output bytes, reports and reservations across approved, refused, interrupted, competing and failed installation cases.
 * @evidence contracts/development/testing.md#independent-expectations Uses 250-tick video frames, independently hashed file bytes, and literal 48 kHz MP4 edit and sample counts for actual audio duration. The false color-range case differs from the accepted header in its range field.
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
