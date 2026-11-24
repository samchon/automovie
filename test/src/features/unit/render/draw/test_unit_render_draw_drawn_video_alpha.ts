import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDrawCall,
  IAutoMovieDrawResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import {
  AutoMovieDrawSession,
  decodeAutoMovieRasterPng,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

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

/** Two frames at 4 fps, delivered at 2 by 2. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "sign",
  durationSeconds: 0.5,
  fps: 4,
  width: 2,
  height: 2,
  views: [],
  drawables: [],
  marks: [],
};

/** A picture whose left column is an opaque sign and right column transparent. */
function answer(call: IAutoMovieDrawCall): IAutoMovieDrawResult {
  return {
    ...answerDrawCall(call),
    pixels: btoa(
      String.fromCharCode(
        ...[200, 40, 20, 255, 0, 0, 0, 0, 200, 40, 20, 255, 0, 0, 0, 0],
      ),
    ),
  };
}

/**
 * A transparent render asks the page for transparent beauty frames, keeps their
 * alpha in RGBA PNG files and wraps them without encoding or audio.
 *
 * Scenarios:
 *
 * 1. Two frames are drawn in the beauty pass with `background` `transparent`.
 * 2. Each frame file is an RGBA PNG whose sign pixels decode at alpha 255 and
 *    whose background decodes at alpha 0.
 * 3. The encoder is handed the alpha wrap: the frame pattern at 4/1, `-c:v copy`,
 *    `-an`, one input and the output last.
 * 4. Control passes over a transparent background are refused before any frame is
 *    drawn.
 */
export async function test_unit_render_draw_drawn_video_alpha(): Promise<void> {
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
  let encoded: readonly string[] = [];
  await renderAutoMovieDrawnVideo({
    session,
    spec: SPEC,
    frameDir: "frames",
    outputPath: "film.mov",
    audio: null,
    background: "transparent",
    write: async (path: string, data: Uint8Array): Promise<void> => {
      files.set(path, data);
    },
    read: async (path: string): Promise<Uint8Array> => {
      throw new Error(`No sound file "${path}" in this fixture`);
    },
    encode: async (args: readonly string[]): Promise<void> => {
      encoded = args;
    },
  });

  // 1. Transparent beauty draws.
  TestValidator.equals(
    "every frame is drawn over a transparent background",
    double.calls.slice(4).map((call: createDrawPageDouble.ICall): unknown[] => {
      const drawn: IAutoMovieDrawCall = (
        call.arg as { call: IAutoMovieDrawCall }
      ).call;
      return [drawn.seconds, drawn.request.shade, drawn.background];
    }),
    [
      [0, "beauty", "transparent"],
      [0.25, "beauty", "transparent"],
    ],
  );

  // 2. RGBA files.
  const decoded: { pixels: Uint8ClampedArray } = await decodeAutoMovieRasterPng(
    files.get("frames/frame_00000.png")!,
  );
  TestValidator.equals(
    "the sign is opaque and the background transparent",
    [
      files.get("frames/frame_00000.png")![25],
      decoded.pixels[3],
      decoded.pixels[7],
    ],
    [6, 255, 0],
  );

  // 3. The wrap.
  TestValidator.equals(
    "the alpha wrap's vector",
    [...encoded],
    [
      "-y",
      "-v",
      "error",
      "-framerate",
      "4/1",
      "-i",
      "frames/frame_%05d.png",
      "-frames:v",
      "2",
      "-map",
      "0:v:0",
      "-c:v",
      "copy",
      "-an",
      "-map_metadata",
      "-1",
      "-fflags",
      "+bitexact",
      "-flags:v",
      "+bitexact",
      "film.mov",
    ],
  );

  // 4. No control passes over transparency.
  const refused: Awaited<ReturnType<typeof open>> = await open();
  const reason: string = await renderAutoMovieDrawnVideo({
    session: refused.session,
    spec: SPEC,
    frameDir: "frames",
    outputPath: "film.mov",
    audio: null,
    background: "transparent",
    controls: { passes: ["depth"], frameDir: "controls" },
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
    "control passes are refused before drawing",
    reason.includes("transparent background") &&
      refused.double.calls.length === 4,
  );
}
