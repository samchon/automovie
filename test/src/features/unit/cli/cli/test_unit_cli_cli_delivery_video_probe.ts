import {
  AUTOMOVIE_MP4_SRGB_COLOUR,
  assertProductionVideoProfile,
  resolveProductionVideoProfile,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { readAutoMovieDeliveryProbe } from "automovie";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { writeDeliveryMp4Header } from "../../../internal/writeDeliveryMp4Header";

/** The video track facts the header writer takes. */
type Video = NonNullable<Parameters<typeof writeDeliveryMp4Header>[0]["video"]>;

/** What the delivery probe reads from one file. */
type Probed = Awaited<ReturnType<typeof readAutoMovieDeliveryProbe>>;

/**
 * The delivery probe reads every picture and sound fact the delivery profiles
 * check from an MP4 file's own boxes.
 *
 * Scenarios:
 *
 * 1. A 241-frame, 24 fps file on one 24-tick movie and track clock with a
 *    full-range sRGB `colr` box reads back every probe field, runs 10.041666… s
 *    in both clocks, and passes `assertProductionVideoProfile`.
 * 2. The same file without `colr`, with a 90-degree track matrix, and with an edit
 *    starting at media time 1024 reads back an absent colour, the stored matrix
 *    and that edit, and the profile refuses each.
 * 3. Composition offsets of one frame make the first composition time one tick,
 *    which the profile refuses at `samples.firstCts`; an explicit 1:1 `pasp`
 *    reads back as explicit square pixels.
 * 4. An AAC-LC, 48 kHz stereo audio track reads back its codec string, sample
 *    entry, priming edit and clocks; a file without one reads `null`; a file
 *    with no movie box is refused.
 */
export async function test_unit_cli_cli_delivery_video_probe(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-probe-"),
  );
  const colour: NonNullable<Video["colour"]> = {
    primaries: 1,
    transfer: 13,
    matrix: 1,
    fullRange: true,
  };
  const video: Video = {
    timescale: 24,
    frames: 241,
    delta: 1,
    movieDuration: 241,
    width: 64,
    height: 48,
    colour,
  };
  const write: (name: string, bytes: Buffer) => Promise<string> = async (
    name: string,
    bytes: Buffer,
  ): Promise<string> => {
    const file: string = path.join(root, name);
    await fs.writeFile(file, bytes);
    return file;
  };
  const probe: (bytes: Buffer) => Promise<Probed> = async (
    bytes: Buffer,
  ): Promise<Probed> =>
    readAutoMovieDeliveryProbe(
      await write("probe.mp4", bytes),
      AUTOMOVIE_MP4_SRGB_COLOUR,
    );
  const profile: ReturnType<typeof resolveProductionVideoProfile> =
    resolveProductionVideoProfile({
      width: 64,
      height: 48,
      frameRate: { numerator: 24, denominator: 1 },
    });
  const refusal: (actual: Probed["video"]) => string = (
    actual: Probed["video"],
  ): string => {
    try {
      assertProductionVideoProfile({ expected: profile, actual });
      return "";
    } catch (error) {
      return error instanceof Error ? error.message.split(":")[0]! : "";
    }
  };

  try {
    // 1. A conforming file.
    const conforming: Probed = await probe(
      writeDeliveryMp4Header({ movieTimescale: 24, video }),
    );
    TestValidator.equals("conforming video probe", conforming.video, {
      kind: "video",
      container: "mp4",
      codec: "h264",
      width: 64,
      height: 48,
      runtimeSeconds: 241 / 24,
      frameCount: 241,
      fps: 24,
      frameRate: { numerator: 24, denominator: 1 },
      brands: { major: "isom", compatible: ["isom", "iso2", "avc1", "mp41"] },
      coded: { width: 64, height: 48 },
      trackDisplay: { width16_16: 64 * 65_536, height16_16: 48 * 65_536 },
      trackMatrix: [65_536, 0, 0, 0, 65_536, 0, 0, 0, 1_073_741_824],
      pixelAspect: { kind: "implicit-square" },
      presentation: {
        movieTimescale: 24,
        mediaTimescale: 24,
        movieDuration: 241,
        mediaDuration: 241,
        edits: [],
      },
      samples: {
        count: 241,
        duration: 1,
        timescale: 24,
        firstDts: 0,
        lastDts: 240,
        firstCts: 0,
        lastCts: 240,
      },
      color: {
        container: { kind: "nclx", ...colour },
        resolved: { kind: "srgb", source: "container" },
      },
    });
    TestValidator.equals("silent file has no audio", conforming.audio, null);
    TestValidator.equals("conforming passes", refusal(conforming.video), "");

    // 2. One changed field each.
    const absent: Probed = await probe(
      writeDeliveryMp4Header({
        movieTimescale: 24,
        video: { ...video, colour: undefined },
      }),
    );
    TestValidator.equals(
      "absent colour",
      [absent.video.color, refusal(absent.video)],
      [
        { container: { kind: "absent" }, resolved: { kind: "absent" } },
        "unsupported-video-profile.color.container.kind",
      ],
    );
    const rotation: number[] = [
      0, 65_536, 0, -65_536, 0, 0, 0, 0, 1_073_741_824,
    ];
    const rotated: Probed = await probe(
      writeDeliveryMp4Header({
        movieTimescale: 24,
        video: { ...video, matrix: rotation },
      }),
    );
    TestValidator.equals(
      "non-unity matrix",
      [[...rotated.video.trackMatrix], refusal(rotated.video)],
      [rotation, "unsupported-video-profile.trackMatrix"],
    );
    const edited: Probed = await probe(
      writeDeliveryMp4Header({
        movieTimescale: 24,
        video: { ...video, edit: { segment: 241, mediaTime: 1024 } },
      }),
    );
    TestValidator.equals(
      "edit from media time 1024",
      [edited.video.presentation.edits, refusal(edited.video)],
      [
        [
          {
            segmentDuration: 241,
            mediaTime: 1024,
            mediaRateInteger: 1,
            mediaRateFraction: 0,
          },
        ],
        "unsupported-video-profile.presentation.edits",
      ],
    );

    // 3. Composition offsets and pixel aspect.
    const delayed: Probed = await probe(
      writeDeliveryMp4Header({
        movieTimescale: 24,
        video: {
          ...video,
          aspect: [1, 1],
          offsets: Array.from({ length: 241 }, (): number => 1),
        },
      }),
    );
    TestValidator.equals(
      "composition offsets and pasp",
      [
        delayed.video.samples.firstCts,
        delayed.video.samples.lastCts,
        delayed.video.pixelAspect,
        refusal(delayed.video),
      ],
      [
        1,
        241,
        { kind: "explicit", hSpacing: 1, vSpacing: 1 },
        "unsupported-video-profile.samples.firstCts",
      ],
    );

    // 4. Audio.
    const sound: Probed = await probe(
      writeDeliveryMp4Header({
        movieTimescale: 24,
        video,
        timescale: 48_000,
        samples: [[472, 1024]],
        edit: { segment: 241, mediaTime: 1024 },
        aac: { objectType: 2, sampleRate: 48_000, channels: 2 },
      }),
    );
    TestValidator.equals("AAC audio probe", sound.audio, {
      kind: "audio",
      container: "mp4",
      codec: "mp4a.40.2",
      runtimeSeconds: 241 / 24,
      channels: 2,
      sampleRate: 48_000,
      sampleCount: 472,
      primingSamples: 1024,
      timebase: {
        movieTimescale: 24,
        mediaTimescale: 48_000,
        movieDuration: 241,
        mediaDuration: 472 * 1024,
        edits: [
          {
            segmentDuration: 241,
            mediaTime: 1024,
            mediaRateInteger: 1,
            mediaRateFraction: 0,
          },
        ],
      },
      sampleEntry: {
        codec: "mp4a",
        audioObjectType: 2,
        sampleRate: 48_000,
        channelCount: 2,
      },
    });
    let unreadable: string = "";
    try {
      await probe(Buffer.from("not an mp4 file"));
    } catch (error) {
      unreadable = error instanceof Error ? error.message : String(error);
    }
    TestValidator.predicate(
      "a file without boxes is refused",
      unreadable !== "",
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}
