import type {
  AutoMovieInspectionShade,
  IAutoMovieDrawCall,
  IAutoMovieDrawnPass,
} from "@automovie/interface";
import {
  AUTOMOVIE_MP4_SRGB_COLOUR,
  AutoMovieRenderDelivery,
  createAutoMovieLoudnessMeter,
  renderAutoMovieDrawnVideo,

} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliRender } from "automovie";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * `automovie render --background transparent` publishes a straight-alpha
 * `film.mov` that holds the drawn PNG files as its samples, with no audio, in
 * its own folder, under the film's publish rule.
 *
 * Scenarios:
 *
 * 1. With no `--out`, the layer is published as
 *    `media/automovie/<film>/transparent/film.mov` beside its report, every
 *    frame is drawn with a transparent background, and no `film.mp4` is
 *    written.
 * 2. The wrap's argument vector copies the frames with `-c:v copy`, reads one
 *    input and writes no audio, and the film's required soundtrack does not
 *    block the layer; the report records the layer's missing audio.
 * 3. The published file's samples are the frame files byte for byte, so the sample
 *    check finds nothing.
 * 4. A file whose second sample differs is blocked with `sample[1].sha256`, keeps
 *    the previous `film.mov`, installs a `blocked` report whose `source.sha256`
 *    differs from the kept file's, and leaves the film's
 *    `videos/render-report.json` untouched.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the CLI render with render's real composer over a fake draw session and an FFmpeg boundary that wraps the drawn files into a minimal QuickTime file, then reads the published folder; an encode instead of a wrap, an audio input, a shared folder, an unchecked sample or a replaced layer fails.
 * @evidence contracts/development/testing.md#independent-expectations The fixture writes the sample table as ISO/IEC 14496-12 defines it, one chunk of back-to-back samples; digests are Node's SHA-256 of the files; the default folder is the documented `transparent/`.
 * @evidence contracts/development/testing.md#distinguishing-cases A conforming and a corrupted sample, a published and a blocked attempt, and the film's own report beside them; option parsing is owned by `test_cli_render_review_options` and pixel blending by `test_draw_alpha_dissolve_blend`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_render_alpha_delivery`; it owns an isolated temporary directory and runs no FFmpeg, browser or device.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_cli_render_alpha_delivery(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-alpha-"),
  );
  const backgrounds: (IAutoMovieDrawCall["background"] | undefined)[] = [];
  let corrupt: boolean = false;
  const fixture: Parameters<typeof AutoMovieCliRender.renderVideo>[0] = {
    host: {
      render: {
        renderAutoMovieDrawnVideo,
        createAutoMovieLoudnessMeter,
        AUTOMOVIE_MP4_SRGB_COLOUR,
        AutoMovieRenderDelivery,
      },
      session: async () => ({
        backend: "fixture",
        subject: {
          name: "test",
          durationSeconds: 1,
          fps: 4,
          width: 2,
          height: 2,
          views: [],
          marks: [],
          drawables: [],
          delivery: { audio: { path: null, required: true } },
        },
        frame: async (
          seconds: number,
          passes: readonly AutoMovieInspectionShade[],
          _diagnostics?: IAutoMovieDrawCall["inspectionDiagnostics"],
          background?: IAutoMovieDrawCall["background"],
        ): Promise<IAutoMovieDrawnPass[]> => {
          backgrounds.push(background);
          return passes.map(
            (pass: AutoMovieInspectionShade): IAutoMovieDrawnPass => ({
              pass,
              picture: {
                width: 2,
                height: 2,
                // A sign's two opaque pixels over two transparent ones.
                pixels: Uint8ClampedArray.from([
                  200,
                  40 * seconds,
                  20,
                  255,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  30,
                  60,
                  90,
                  255,
                ]),
              },
            }),
          );
        },
        // No sound list, so the dialogue mouths are never handed.
        speak: async (): Promise<void> => {},
        close: async (): Promise<void> => {},
      }),
    },
    subject: null,
    root,
    props: null,
    ffmpeg: "fixture-ffmpeg",
    background: "transparent",
  };
  const run: NonNullable<Parameters<typeof AutoMovieCliRender.renderVideo>[1]> = async (
    _binary,
    args,
  ) => {
    // The decoders read the video log; the layer has no audio stream to decode.
    if (args.includes("-xerror"))
      return args.includes("0:v:0") ? videoLog() : "";
    const pattern: string = args[args.indexOf("-i") + 1]!;
    const count: number = Number(args[args.indexOf("-frames:v") + 1]);
    const frames: Buffer[] = await Promise.all(
      Array.from({ length: count }, (_: unknown, index: number) =>
        fs.readFile(pattern.replace("%05d", String(index).padStart(5, "0"))),
      ),
    );
    if (corrupt) frames[1] = Buffer.concat([frames[1]!, Buffer.from([0])]);
    await fs.writeFile(args.at(-1)!, writeMov(frames));
    return "";
  };
  const folder: string = path.join(root, "media", "automovie", "test");
  const sha256: (bytes: Buffer) => string = (bytes: Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");

  try {
    // The film's own report, which no layer attempt may touch.
    await fs.mkdir(path.join(folder, "videos"), { recursive: true });
    await fs.writeFile(
      path.join(folder, "videos", "render-report.json"),
      "film\n",
    );

    // 1 to 3. A published layer.
    const written: Awaited<ReturnType<typeof AutoMovieCliRender.renderVideo>> =
      await AutoMovieCliRender.renderVideo(fixture, run);
    const layer: string = path.join(folder, "transparent");
    const report: any = JSON.parse(
      await fs.readFile(path.join(layer, "render-report.json"), "utf8"),
    );
    const film: Buffer = await fs.readFile(path.join(layer, "film.mov"));
    TestValidator.equals(
      "the layer is published in its own folder",
      [
        written.video,
        report.status,
        report.video,
        report.layer,
        report.source.sha256 === sha256(film),
        report.profile,
        (await fs.readdir(layer)).sort((left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
        backgrounds.every((background) => background === "transparent"),
        backgrounds.length,
      ],
      [
        path.join(layer, "film.mov"),
        "published",
        "film.mov",
        { background: "transparent", audio: "none" },
        true,
        [],
        ["film.mov", "render-report.json"],
        true,
        4,
      ],
    );
    TestValidator.equals(
      "the wrap copies the frames with one input and no audio",
      [
        report.args.filter((arg: string): boolean => arg === "-i").length,
        report.args.includes("copy"),
        report.args.includes("-an"),
      ],
      [1, true, true],
    );

    // 4. A sample that differs blocks and keeps the layer.
    corrupt = true;
    const published: boolean = await AutoMovieCliRender.renderVideo(fixture, run)
      .then((): boolean => true)
      .catch((): boolean => false);
    if (published)
      throw new Error("A layer with a foreign sample was published");
    const blocked: any = JSON.parse(
      await fs.readFile(path.join(layer, "render-report.json"), "utf8"),
    );
    TestValidator.equals(
      "a differing sample blocks and keeps the previous layer",
      [
        blocked.status,
        blocked.profile[0].field,
        blocked.source.sha256 === sha256(film),
        (await fs.readFile(path.join(layer, "film.mov"))).equals(film),
        await fs.readFile(
          path.join(folder, "videos", "render-report.json"),
          "utf8",
        ),
      ],
      ["blocked", "sample[1].sha256", false, true, "film\n"],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}

/** One box: its 32-bit size, its type and its payload. */
function box(type: string, ...payload: Buffer[]): Buffer {
  const body: Buffer = Buffer.concat(payload);
  const header: Buffer = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length, 0);
  header.write(type, 4, "latin1");
  return Buffer.concat([header, body]);
}

/** 32-bit big-endian words. */
function words(...values: number[]): Buffer {
  const out: Buffer = Buffer.alloc(values.length * 4);
  values.forEach((value: number, index: number): void => {
    out.writeUInt32BE(value, index * 4);
  });
  return out;
}

/**
 * A minimal QuickTime file of one `vide` track whose samples are `frames`, back
 * to back in one chunk after the movie box.
 */
function writeMov(frames: Buffer[]): Buffer {
  const movie: (offset: number) => Buffer = (offset: number): Buffer =>
    box(
      "moov",
      box(
        "trak",
        box(
          "mdia",
          box(
            "hdlr",
            words(0, 0),
            Buffer.from("vide", "latin1"),
            words(0, 0, 0),
            Buffer.from([0]),
          ),
          box(
            "minf",
            box(
              "stbl",
              box(
                "stsz",
                words(
                  0,
                  0,
                  frames.length,
                  ...frames.map((frame: Buffer): number => frame.length),
                ),
              ),
              box("stsc", words(0, 1, 1, frames.length, 1)),
              box("stco", words(0, 1, offset)),
            ),
          ),
        ),
      ),
    );
  const length: number = movie(0).length;
  return Buffer.concat([movie(length + 8), box("mdat", ...frames)]);
}

/** Pinned filter-log shape of four quarter-second frames with no black interval. */
function videoLog(): string {
  return [
    "Input #0, mov, from 'fixture.mov':",
    "  Stream #0:0[0x1](und): Video: png",
    "Stream mapping:",
    "[Parsed_showinfo_0 @ abc] config in time_base: 1/1000, frame_rate: 4/1",
    ...[0, 250, 500, 750].map(
      (pts: number, index: number): string =>
        "[Parsed_showinfo_0 @ abc] n: " +
        index +
        " pts: " +
        pts +
        " pts_time:" +
        pts / 1000 +
        " duration: 250 duration_time:0.25 fmt:rgba",
    ),
  ].join("\n");
}
