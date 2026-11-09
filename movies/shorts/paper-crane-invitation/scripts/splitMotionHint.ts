import type { IAutoMovieProductionVideoProbe } from "@automovie/interface";
import ffmpeg from "ffmpeg-static";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { probeProductionVideoMp4 } from "../src/integrations/render/node/probeProductionVideoMp4";

/**
 * Derive the three causal input clips from the actual complete silent motion MP4.
 * @evidence contracts/common.md#implementation-and-ownership Public Render parses the actual H264 MP4 bytes rather than a declared manifest. One FFmpeg split/trim operation decodes the full hint and writes three independent H264 clips with exact source-frame ranges and rebased presentation time. Every output is independently parsed and fully decoded; actual bytes and nonsecret command receipts remain attributable. No diffusion request is submitted.
 * @evidence contracts/common.md#authoring-interface Run only after output/film.mp4 contains the complete 720x1280,24fps,1440-frame silent hint. Ranges0–19,19–43,43–60 preserve send/request, return/reveal and tea/choice actions. The command retains media in output and small identities in docs/analysis/motion/exports.json. Failure preserves logs/partial files as candidates, never accepted clips.
 */
export async function splitMotionHint(): Promise<void> {
  const executable: string = process.env.FFMPEG_PATH ?? ffmpeg ?? "";
  if (!executable) throw new Error("No installed FFmpeg executable");
  const execute = promisify(execFile);
  /** Publish one complete receipt so an interrupted write cannot retain a false current acceptance. */
  const publish: (path: string, data: object) => Promise<void> = async (
    path: string,
    data: object,
  ): Promise<void> => {
    await writeFile(path + ".pending", JSON.stringify(data, null, 2));
    await rename(path + ".pending", path);
  };
  const ranges: { name: string; begin: number; end: number }[] = [
    { name: "crane-and-missed-recall", begin: 0, end: 456 },
    { name: "one-gap-and-the-invitation", begin: 456, end: 1032 },
    { name: "two-cups-one-place", begin: 1032, end: 1440 },
  ];
  await mkdir("output/segments", { recursive: true });
  const attempt: string = new Date().toISOString().replace(/[:.]/g, "-");
  const destination: string = "output/segments/" + attempt;
  await mkdir(destination);
  await mkdir(".cache/video-production/probes", { recursive: true });
  await mkdir("docs/analysis/motion", { recursive: true });
  /** Read exact bytes and compare container facts with the commissioned interval. */
  const inspect: (
    path: string,
    frames: number,
  ) => Promise<{
    path: string;
    bytes: number;
    sha256: string;
    probe: IAutoMovieProductionVideoProbe;
  }> = async (
    path: string,
    frames: number,
  ): Promise<{
    path: string;
    bytes: number;
    sha256: string;
    probe: IAutoMovieProductionVideoProbe;
  }> => {
    const bytes: Buffer = await readFile(path);
    const probe: IAutoMovieProductionVideoProbe =
      probeProductionVideoMp4(bytes);
    if (
      probe.width !== 720 ||
      probe.height !== 1280 ||
      probe.fps !== 24 ||
      probe.frameCount !== frames ||
      probe.runtimeSeconds !== frames / 24 ||
      bytes.length > 200_000_000
    )
      throw new Error(
        "Actual video violates adopted input profile: " +
          path +
          " " +
          JSON.stringify(probe),
      );
    return {
      path,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      probe,
    };
  };
  const whole: Awaited<ReturnType<typeof inspect>> = await inspect(
    "output/film.mp4",
    1440,
  );
  const graph: string =
    "[0:v]split=3[a][b][c];" +
    ranges
      .map(
        (range: (typeof ranges)[number], index: number): string =>
          "[" +
          ["a", "b", "c"][index] +
          "]trim=start_frame=" +
          range.begin +
          ":end_frame=" +
          range.end +
          ",setpts=PTS-STARTPTS[v" +
          index +
          "]",
      )
      .join(";");
  const args: string[] = ["-y", "-i", whole.path, "-filter_complex", graph];
  for (const [index, range] of ranges.entries())
    args.push(
      "-map",
      "[v" + index + "]",
      "-an",
      "-c:v",
      "libx264",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "24",
      "-movflags",
      "+faststart",
      destination + "/" + range.name + ".mp4",
    );
  const receiptPath: string =
    "docs/analysis/motion/motion-clip-export-" + attempt + ".json";
  const pending: object = {
    status: "attempt-in-progress; not accepted",
    whole,
    destination,
    encoder: { executable, args },
    receiptPath,
  };
  await publish(receiptPath, pending);
  await publish("docs/analysis/motion/exports.json", pending);
  const encodingFailures: string[] = [];
  try {
    const encoded: { stdout: string; stderr: string } = await execute(
      executable,
      args,
      {
        windowsHide: true,
        encoding: "utf8",
        timeout: 1800000,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    await writeFile(
      ".cache/video-production/probes/segment-encode-" + attempt + ".log",
      encoded.stderr,
    );
  } catch (error: unknown) {
    const stderr: string =
      typeof error === "object" &&
      error !== null &&
      typeof Reflect.get(error, "stderr") === "string"
        ? (Reflect.get(error, "stderr") as string)
        : String(error);
    await writeFile(
      ".cache/video-production/probes/segment-encode-" + attempt + ".log",
      stderr,
    );
    encodingFailures.push("Encoder failed: " + String(error));
  }
  const files: {
    media: Awaited<ReturnType<typeof inspect>>;
    globalFrames: [number, number];
    localFrames: [number, number];
    request: string;
    decode: { exit: number; log: string };
  }[] = [];
  const failures: string[] = [...encodingFailures];
  for (const range of ranges) {
    try {
      const path: string = destination + "/" + range.name + ".mp4";
      const media: Awaited<ReturnType<typeof inspect>> = await inspect(
        path,
        range.end - range.begin,
      );
      const decoded: { stdout: string; stderr: string } = await execute(
        executable,
        ["-v", "error", "-i", path, "-map", "0:v:0", "-f", "null", "-"],
        {
          windowsHide: true,
          encoding: "utf8",
          timeout: 1800000,
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      const log: string =
        ".cache/video-production/probes/" +
        range.name +
        "-decode-" +
        attempt +
        ".log";
      await writeFile(log, decoded.stderr);
      if (decoded.stderr.trim())
        throw new Error("Decoder reported errors: " + decoded.stderr);
      files.push({
        media,
        globalFrames: [range.begin, range.end - 1],
        localFrames: [0, range.end - range.begin - 1],
        request: "docs/prompts/videos/" + range.name + ".md",
        decode: { exit: 0, log },
      });
    } catch (error: unknown) {
      failures.push(range.name + ": " + String(error));
    }
  }
  const receipt: object = {
    status: failures.length
      ? "candidate-with-failures"
      : "technical-profile-and-decode-verified; visual-delivery-review-separate",
    whole,
    files,
    failures,
    encoder: { executable, args },
    retention: "locally retained output bytes; no verified external archive",
    diffusion: "planned; not submitted",
    attempt,
    receiptPath,
  };
  await publish(receiptPath, receipt);
  await publish("docs/analysis/motion/exports.json", receipt);
  if (failures.length)
    throw new AggregateError(failures, "Motion clip inspection failed");
  console.log(
    "Whole1440frames and three causal clips retained and technically verified.",
  );
}
void splitMotionHint().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
