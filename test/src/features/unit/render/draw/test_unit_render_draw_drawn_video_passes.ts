import type {
  IAutoMovieCaptureSubject,
  IAutoMovieControlRecord,
  IAutoMovieDrawCall,
  IAutoMovieDrawResult,
  IAutoMovieDrawnVideoResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import {
  AutoMovieDrawSession,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/** Encoding controls shared by every render of this test. */
const SPEC: Omit<IAutoMovieRenderSpec, "frameFormat"> = {
  target: "production",
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/** Three frames at 10 fps, delivered at 4 by 2. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "controls",
  durationSeconds: 0.3,
  fps: 10,
  width: 4,
  height: 2,
  views: [],
  drawables: [],
  marks: [],
};

/**
 * The page's picture for a call, one flat grey per shade so every pass's file
 * differs, with the mask reporting the positional ramp.
 */
function answer(call: IAutoMovieDrawCall): IAutoMovieDrawResult {
  const level: number = ["beauty", "depth", "mask"].indexOf(call.request.shade);
  return {
    ...answerDrawCall(call),
    pixels: btoa(
      String.fromCharCode(
        ...new Array<number>(call.width * call.height * 4)
          .fill(0)
          .map((_: number, byte: number): number =>
            byte % 4 === 3 ? 255 : 40 * level + (byte % 4),
          ),
      ),
    ),
    ...(call.request.shade === "mask" ? { semanticMask: null } : {}),
  };
}

/**
 * Node's SHA-256 of bytes as 64 hexadecimal digits, the oracle for every
 * digest.
 */
function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * A render with control passes draws each output frame's film and channels in
 * one session call through the film camera, writes the channels as pass-tagged
 * PNG files, and returns each channel's convention with the SHA-256 of every
 * file it wrote.
 *
 * Scenarios:
 *
 * 1. Three frames with `depth,mask` draw `beauty`, `depth` and `mask` at 0, 0.1
 *    and 0.2 s, in that order per frame, all through the `film` view.
 * 2. The channels are written as `controls/frame_0000<i>.depth.png` and
 *    `.mask.png`, while the film's frames stay `frames/frame_0000<i>.png`.
 * 3. Each frame digest is the SHA-256 of the bytes written to its file, and each
 *    sequence digest is the SHA-256 of the frame digests as 64-digit lines
 *    ending in a line feed.
 * 4. Depth records the linear convention over 20 m, the default range, and mask
 *    the positional convention the page reported; each channel names its input
 *    pattern and three frames.
 * 5. A pass named twice, `beauty`, and an inspection shade are refused before any
 *    frame is drawn.
 */
export async function test_unit_render_draw_drawn_video_passes(): Promise<void> {
  const open: () => Promise<{
    session: AutoMovieDrawSession;
    double: createDrawPageDouble.IDouble;
  }> = async (): Promise<{
    session: AutoMovieDrawSession;
    double: createDrawPageDouble.IDouble;
  }> => {
    const double: createDrawPageDouble.IDouble = createDrawPageDouble({
      subject: SUBJECT,
      renderer: "test",
      answer,
    });
    return {
      double,
      session: await AutoMovieDrawSession.open({
        page: double.page,
        url: "http://127.0.0.1:1/render/index.html",
        props: { subject: SUBJECT.name, props: null },
        backend: "swiftshader",
        timeout: 1000,
      }),
    };
  };
  const { session, double }: Awaited<ReturnType<typeof open>> = await open();
  const files: Map<string, Uint8Array> = new Map();
  const result: IAutoMovieDrawnVideoResult = await renderAutoMovieDrawnVideo({
    session,
    spec: SPEC,
    frameDir: "frames",
    outputPath: "film.mp4",
    audio: null,
    controls: { passes: ["depth", "mask"], frameDir: "controls" },
    write: async (path: string, data: Uint8Array): Promise<void> => {
      files.set(path, data);
    },
    read: async (path: string): Promise<Uint8Array> => {
      throw new Error(`No sound file "${path}" in this fixture`);
    },
    encode: async (): Promise<void> => {},
  });

  // 1. One beauty, depth and mask draw per frame, in order, through the film.
  TestValidator.equals(
    "each frame draws the film and its channels together",
    double.calls
      .slice(4)
      .map((call: createDrawPageDouble.ICall): [number, string, string] => {
        const drawn: IAutoMovieDrawCall = (
          call.arg as { call: IAutoMovieDrawCall }
        ).call;
        return [drawn.seconds, drawn.request.shade, drawn.view];
      }),
    [0, 0.1, 0.2].flatMap((seconds: number): [number, string, string][] =>
      ["beauty", "depth", "mask"].map(
        (shade: string): [number, string, string] => [seconds, shade, "film"],
      ),
    ),
  );

  // 2. The files.
  TestValidator.equals(
    "pass-tagged channel files beside the film's frames",
    [...files.keys()].sort((left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
    [
      "controls/frame_00000.depth.png",
      "controls/frame_00000.mask.png",
      "controls/frame_00001.depth.png",
      "controls/frame_00001.mask.png",
      "controls/frame_00002.depth.png",
      "controls/frame_00002.mask.png",
      "frames/frame_00000.png",
      "frames/frame_00001.png",
      "frames/frame_00002.png",
    ],
  );

  // 3. File digests and the sequence digest.
  const channels: IAutoMovieControlRecord.IChannel[] = result.controls!;
  TestValidator.predicate(
    "every frame digest is its file's bytes",
    channels.every((channel: IAutoMovieControlRecord.IChannel): boolean =>
      channel.frames.every(
        (frame: IAutoMovieControlRecord.IFrame): boolean =>
          frame.sha256 ===
          sha256(
            files.get(`controls/frame_0000${frame.index}.${channel.pass}.png`)!,
          ),
      ),
    ),
  );
  TestValidator.predicate(
    "the depth and mask files differ",
    channels[0]!.frames[0]!.sha256 !== channels[1]!.frames[0]!.sha256,
  );
  TestValidator.equals(
    "each sequence digest hashes the frame digests as lines",
    channels.map(
      (channel: IAutoMovieControlRecord.IChannel): string =>
        channel.sequenceSha256,
    ),
    channels.map((channel: IAutoMovieControlRecord.IChannel): string =>
      sha256(
        channel.frames
          .map(
            (frame: IAutoMovieControlRecord.IFrame): string =>
              `${frame.sha256}\n`,
          )
          .join(""),
      ),
    ),
  );

  // 4. Conventions and patterns.
  TestValidator.equals(
    "the conventions drawn",
    channels.map((channel: IAutoMovieControlRecord.IChannel): unknown => [
      channel.convention,
      channel.inputPattern,
      channel.frameCount,
      channel.frames.map(
        (frame: IAutoMovieControlRecord.IFrame): number => frame.index,
      ),
    ]),
    [
      [
        { pass: "depth", kind: "linear", rangeMetres: 20 },
        "frame_%05d.depth.png",
        3,
        [0, 1, 2],
      ],
      [
        { pass: "mask", kind: "positional" },
        "frame_%05d.mask.png",
        3,
        [0, 1, 2],
      ],
    ],
  );

  // 5. Refusals before any draw.
  for (const [passes, message] of [
    [["depth", "depth"], "named twice"],
    [["beauty"], "film itself"],
    [["clay"], "not a guide pass"],
  ] as const) {
    const refused: Awaited<ReturnType<typeof open>> = await open();
    const reason: string = await renderAutoMovieDrawnVideo({
      session: refused.session,
      spec: SPEC,
      frameDir: "frames",
      outputPath: "film.mp4",
      audio: null,
      controls: { passes, frameDir: "controls" },
      write: async (): Promise<void> => {},
      read: async (path: string): Promise<Uint8Array> => {
        throw new Error(`No sound file "${path}" in this fixture`);
      },
      encode: async (): Promise<void> => {},
    })
      .then((): string => "")
      .catch((error: unknown): string =>
        error instanceof Error ? error.message : String(error),
      );
    TestValidator.predicate(
      `${passes.join(",")} is refused before drawing`,
      reason.includes(message) && refused.double.calls.length === 4,
    );
  }
}
