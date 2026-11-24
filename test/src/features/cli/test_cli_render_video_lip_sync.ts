import type {
  IAutoMovieDialogueLipSync,
  IAutoMovieDrawnVideoResult,
} from "@automovie/interface";
import { renderAutoMovieDrawnVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { renderAutoMovieVideo } from "automovie";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { CliRenderDeliveryFixture } from "../internal/CliRenderDeliveryFixture";

/**
 * The render report lists every dialogue line's lip-sync entry, and only a
 * failed verdict blocks publication.
 *
 * Scenarios:
 *
 * 1. A report with one failed lip-sync line blocks publication.
 * 2. A report with one inconclusive line and one envelope-driven line publishes
 *    and lists both, the second as unmeasured.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the report listing and the publication rule each case verifies.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the CLI's render entry with Render's real composer and validators, a fake draw session and FFmpeg process boundary, and the host's own drawing with the mixed sound record a sound list would have produced handed to the encoder.
 * @evidence contracts/development/testing.md#independent-expectations Each measured entry's lag in milliseconds is its frame lag times the 250 ms frame of the 4 fps fixture; the verdicts and the unmeasured reason are the entries' literals.
 * @evidence contracts/development/testing.md#distinguishing-cases A failed line against an inconclusive and an unmeasured line; the lag itself belongs to test_engine_lip_sync_lag and every other delivery outcome to test_cli_render_video_delivery.
 * @evidence contracts/development/testing.md#execution-ownership Owns its isolated temporary directory and calls no FFmpeg, browser or device.
 */
export async function test_cli_render_video_lip_sync(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-lip-sync-"),
  );
  const delivery: CliRenderDeliveryFixture = new CliRenderDeliveryFixture(root);
  const lipSyncFixture: (
    lipSync: IAutoMovieDialogueLipSync[],
  ) => Parameters<typeof renderAutoMovieVideo>[0] = (
    lipSync: IAutoMovieDialogueLipSync[],
  ): Parameters<typeof renderAutoMovieVideo>[0] => ({
    ...delivery.input,
    host: {
      ...delivery.input.host,
      render: {
        ...delivery.input.host.render,

        // The host's own drawing, with the mixed sound record a sound list
        // would have produced handed to the encoder.
        renderAutoMovieDrawnVideo: (props) =>
          renderAutoMovieDrawnVideo({
            ...props,
            encode: (args, drawn) =>
              props.encode(args, { ...drawn, sound: soundRecord(lipSync) }),
          }),
      },
    },
  });
  const measured: (
    verdict: "pass" | "fail" | "inconclusive",
    lagFrames: number,
  ) => IAutoMovieDialogueLipSync = (
    verdict: "pass" | "fail" | "inconclusive",
    lagFrames: number,
  ): IAutoMovieDialogueLipSync => ({
    line: verdict,
    actor: "ann",
    status: "measured",
    lagFrames,
    lagMilliseconds: lagFrames * 250,
    correlation: verdict === "inconclusive" ? 0.1 : 0.9,
    verdict,
  });

  try {
    let lateMessage: string = "published";
    try {
      await renderAutoMovieVideo(
        lipSyncFixture([measured("fail", 1)]),
        delivery.run,
      );
    } catch (error) {
      lateMessage = error instanceof Error ? error.message : String(error);
    }
    const late: any = await delivery.readReport();
    const unmeasured: IAutoMovieDialogueLipSync = {
      line: "hum",
      actor: "ann",
      status: "unmeasured",
      reason: "envelope-jaw",
    };
    await renderAutoMovieVideo(
      lipSyncFixture([measured("inconclusive", 0), unmeasured]),
      delivery.run,
    );
    const listed: any = await delivery.readReport();
    TestValidator.equals(
      "a failed lip-sync line blocks; inconclusive and unmeasured lines publish",
      [
        lateMessage.includes("lip-sync fail"),
        late.status,
        listed.status,
        listed.sound.lipSync.map((entry: IAutoMovieDialogueLipSync): string =>
          entry.status === "measured" ? entry.verdict : entry.reason,
        ),
      ],
      [true, "blocked", "published", ["inconclusive", "envelope-jaw"]],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}

/**
 * The mixed sound record of a silent one-second film with the given lip-sync
 * entries.
 */
function soundRecord(
  lipSync: IAutoMovieDialogueLipSync[],
): NonNullable<IAutoMovieDrawnVideoResult["sound"]> {
  return {
    file: "soundtrack.wav",
    sha256: "sha256:" + "0".repeat(64),
    receipts: [],
    analysis: {
      version: 2,
      sampleRate: 48_000,
      sampleFrames: 48_000,
      runtimeSeconds: 1,
      integratedLoudness: null,
      truePeakDbtp: null,
      samplePeak: 0,
      clippingSamples: 0,
      longestSilenceSeconds: 1,
      eventAlignment: [],
    },
    loudness: {
      intent: {
        integratedLufs: -23,
        toleranceLu: 0.5,
        maximumTruePeakDbtp: -1,
      },
      source: "ebu-r128-default",
      dialogueLufs: -23,
      ceilingDbtp: -2,
      lines: [],
      master: { mixLufs: null, gainDb: 0, limiterGainDb: 0 },
    },
    lipSync,
  };
}
