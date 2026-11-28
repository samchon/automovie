import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  AutoMovieInspectionShade,
  IAutoMovieControlRecord,
  IAutoMovieDrawnPass,
} from "@automovie/interface";
import {
  AutoMovieRenderMp4SrgbColour,
  AutoMovieRenderDelivery,
  AutoMovieRenderDraw,
  AutoMovieRenderVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliRender } from "automovie";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { throwsError } from "../internal/predicates";
import { writeDeliveryMp4Header } from "../internal/writeDeliveryMp4Header";

/**
 * `automovie render --passes` publishes the control channels in `controls/`
 * inside the render's output folder, in the same step as the film, with a
 * record bound to the film's digest; a blocked attempt keeps the former film
 * and channels.
 *
 * Scenarios:
 *
 * 1. The passes option admits guide passes other than `beauty` in request order,
 *    and refuses `beauty`, an inspection shade and a pass named twice.
 * 2. A published render with `--out` writes `<out>/controls/` with every pass's
 *    frames and `record.json`, whose `filmSha256` equals the report's
 *    `source.sha256` and the published film's SHA-256, and whose frame digests
 *    are the files' bytes.
 * 3. Without `--out`, the folder is `media/automovie/<film>/videos/controls/`.
 * 4. A blocked attempt, a limited-range colour box, keeps the former `film.mp4`
 *    and `controls/` byte for byte and installs a `blocked` report whose
 *    `source.sha256` differs from the kept film's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes guide-pass admission, default and explicit channel locations, file identity and preservation on blocked delivery.
 * @evidence contracts/development/testing.md#behavioral-verification Calls guide-pass admission and runs the CLI render with draw and encoder fixtures. Reads the installed channel records and frame files, then checks both old products and the blocked attempt's report after a limited-range refusal.
 * @evidence contracts/development/testing.md#independent-expectations Uses literal ordered pass names, the documented default folder, and SHA-256 computed independently from the written film and frame bytes. A single limited-range header supplies the refusal.
 */
export async function test_cli_render_control_channels(): Promise<void> {
  // 1. Admission.
  TestValidator.equals(
    "guide passes in request order",
    AutoMovieRenderDraw.admitControlPasses(["mask", "depth", "albedo"]),
    ["mask", "depth", "albedo"],
  );
  for (const [passes, reason] of [
    [["beauty"], "film itself"],
    [["faces"], "not a guide pass"],
    [["pose", "pose"], "named twice"],
  ] as const)
    TestValidator.predicate(
      `${passes.join(",")} is refused`,
      throwsError((): unknown => AutoMovieRenderDraw.admitControlPasses(passes), reason),
    );

  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-controls-"),
  );
  const header: (fullRange: boolean) => Buffer = (fullRange: boolean): Buffer =>
    writeDeliveryMp4Header({
      movieTimescale: 4,
      video: {
        timescale: 4,
        frames: 4,
        delta: 1,
        movieDuration: 4,
        width: 2,
        height: 2,
        colour: { primaries: 1, transfer: 13, matrix: 1, fullRange },
      },
    });
  let encoded: Buffer = header(true);
  const fixture: (
    out?: string,
  ) => Parameters<typeof AutoMovieCliRender.renderVideo>[0] = (
    out?: string,
  ): Parameters<typeof AutoMovieCliRender.renderVideo>[0] => ({
    host: {
      render: {
        AutoMovieRenderVideo,
        createAutoMovieLoudnessMeter: AutoMovieEngineSound.createLoudnessMeter,
        AutoMovieRenderMp4SrgbColour,
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
        },
        frame: async (
          _seconds: number,
          passes: readonly AutoMovieInspectionShade[],
        ): Promise<IAutoMovieDrawnPass[]> =>
          passes.map(
            (
              pass: AutoMovieInspectionShade,
              slot: number,
            ): IAutoMovieDrawnPass => ({
              pass,
              picture: {
                width: 2,
                height: 2,
                pixels: new Uint8ClampedArray(16).fill(255 - slot * 60),
              },
              ...(pass === "mask" ? { semanticMask: null } : {}),
            }),
          ),
        // No sound list, so the dialogue mouths are never handed.
        speak: async (): Promise<void> => {},
        close: async (): Promise<void> => {},
      }),
    },
    subject: null,
    root,
    ...(out === undefined ? {} : { out }),
    props: null,
    ffmpeg: "fixture-ffmpeg",
    passes: ["depth", "mask"],
  });
  const run: NonNullable<Parameters<typeof AutoMovieCliRender.renderVideo>[1]> = async (
    _binary,
    args,
  ) => {
    if (!args.includes("-xerror")) {
      await fs.writeFile(args.at(-1)!, encoded);
      return "";
    }
    return videoLog();
  };
  const sha256: (bytes: Buffer) => string = (bytes: Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");
  const readFolder: (folder: string) => Promise<Map<string, Buffer>> = async (
    folder: string,
  ): Promise<Map<string, Buffer>> =>
    new Map(
      await Promise.all(
        (await fs.readdir(folder)).map(
          async (name: string): Promise<[string, Buffer]> => [
            name,
            await fs.readFile(path.join(folder, name)),
          ],
        ),
      ),
    );

  try {
    // 2. Published into --out.
    const out: string = path.join(root, "out");
    const written: Awaited<ReturnType<typeof AutoMovieCliRender.renderVideo>> =
      await AutoMovieCliRender.renderVideo(fixture("out"), run);
    const report: any = JSON.parse(
      await fs.readFile(path.join(out, "render-report.json"), "utf8"),
    );
    const controls: Map<string, Buffer> = await readFolder(
      path.join(out, "controls"),
    );
    const record: IAutoMovieControlRecord = JSON.parse(
      controls.get("record.json")!.toString("utf8"),
    );
    TestValidator.equals(
      "the published channels and their record",
      [
        written.controls,
        [...controls.keys()].sort((left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
        record.filmSha256 === report.source.sha256,
        record.filmSha256 ===
          sha256(await fs.readFile(path.join(out, "film.mp4"))),
        record.channels.map(
          (channel: IAutoMovieControlRecord.IChannel): string => channel.pass,
        ),
        record.channels.every((channel: IAutoMovieControlRecord.IChannel) =>
          channel.frames.every(
            (frame: IAutoMovieControlRecord.IFrame): boolean =>
              frame.sha256 ===
              sha256(
                controls.get(`frame_0000${frame.index}.${channel.pass}.png`)!,
              ),
          ),
        ),
        record.clock,
      ],
      [
        path.join(out, "controls"),
        [
          ...[0, 1, 2, 3].flatMap((index: number): string[] => [
            `frame_0000${index}.depth.png`,
            `frame_0000${index}.mask.png`,
          ]),
          "record.json",
        ].sort((left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
        true,
        true,
        ["depth", "mask"],
        true,
        { frameRate: [4, 1], frameCount: 4, width: 2, height: 2 },
      ],
    );

    // 3. The default folder.
    await AutoMovieCliRender.renderVideo(fixture(), run);
    TestValidator.predicate(
      "the default folder holds the channels",
      (
        await readFolder(
          path.join(root, "media", "automovie", "test", "videos", "controls"),
        )
      ).has("record.json"),
    );

    // 4. A blocked attempt keeps the former film and channels.
    const keptFilm: Buffer = await fs.readFile(path.join(out, "film.mp4"));
    encoded = header(false);
    const published: boolean = await AutoMovieCliRender.renderVideo(fixture("out"), run)
      .then((): boolean => true)
      .catch((): boolean => false);
    if (published) throw new Error("A limited-range file was published");
    const blocked: any = JSON.parse(
      await fs.readFile(path.join(out, "render-report.json"), "utf8"),
    );
    const after: Map<string, Buffer> = await readFolder(
      path.join(out, "controls"),
    );
    TestValidator.equals(
      "a blocked attempt keeps the former film and controls",
      [
        blocked.status,
        blocked.source.sha256 === sha256(keptFilm),
        (await fs.readFile(path.join(out, "film.mp4"))).equals(keptFilm),
        [...after].every(
          ([name, bytes]: [string, Buffer]): boolean =>
            controls.get(name)?.equals(bytes) === true,
        ) && after.size === controls.size,
      ],
      ["blocked", false, true, true],
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}

/** Pinned filter-log shape of four quarter-second frames with no black interval. */
function videoLog(): string {
  return [
    "Input #0, mov, from 'fixture.mp4':",
    "  Stream #0:0[0x1](und): Video: h264 (High)",
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
        " duration: 250 duration_time:0.25 fmt:yuv420p",
    ),
  ].join("\n");
}
