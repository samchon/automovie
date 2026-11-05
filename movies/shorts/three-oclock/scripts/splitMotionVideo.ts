import { probeProductionVideoMp4 } from "@automovie/render/node";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

/**
 * Encode five causal reference clips from the actual complete silent hint.
 *
 * @evidence contracts/common.md#implementation-and-ownership Requires a probed 1440-frame 720x1280 H264 24fps whole MP4 before splitting. FFmpeg trims decoded frame ranges and resets clip timestamps, rather than relying on keyframe stream-copy. Every output passes the same public strict MP4 probe, records byte identity and remains locally retained under ignored output. It gathers every clip failure before refusing the round; file existence never establishes visual acceptance.
 * @evidence contracts/common.md#authoring-interface Run from the production root after actual whole export, with FFMPEG_PATH optional. Owns only output/segments and docs/analysis/motion-clips.json plus derived current sourceClip receipts in planned request templates. No upload or generation occurs. The five boundaries preserve the complete shared reach and all sixty seconds; silent reference clips are not accepted soundtracks.
 */
export async function splitMotionVideo(): Promise<void> {
  const sourcePath: string = "output/film.mp4";
  const source: Buffer = await readFile(sourcePath);
  const whole: ReturnType<typeof probeProductionVideoMp4> = probeProductionVideoMp4(source);
  if (whole.width !== 720 || whole.height !== 1280 || whole.frameCount !== 1440 || whole.fps !== 24 || whole.runtimeSeconds !== 60)
    throw new Error("Whole source does not meet the commissioned 60-second 720x1280/24fps profile");
  const executable: string | null = process.env.FFMPEG_PATH ?? ffmpeg;
  if (executable === null) throw new Error("FFmpeg executable is absent");
  const plans: { name: string; first: number; end: number }[] = [
    { name: "empty-bench-rehearsal", first: 0, end: 312 },
    { name: "overheard-invitation", first: 312, end: 600 },
    { name: "withdrawn-note", first: 600, end: 864 },
    { name: "mirrored-reach", first: 864, end: 1152 },
    { name: "three-oclock-handoff", first: 1152, end: 1440 },
  ];
  await mkdir("output/segments", { recursive: true });
  const rows: object[] = [];
  const failures: string[] = [];
  const templates: { requests: { record: string; sourceClip: object }[] } = JSON.parse(await readFile("docs/prompts/videos/three-oclock-request-templates.json", "utf8"));
  for (const plan of plans) {
    const path: string = `output/segments/${plan.name}.mp4`;
    try {
      const args: string[] = ["-hide_banner", "-y", "-i", sourcePath, "-map", "0:v:0", "-vf",
        `trim=start_frame=${plan.first}:end_frame=${plan.end},setpts=PTS-STARTPTS`, "-an", "-r", "24", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", path];
      await encode(executable, args);
      const bytes: Buffer = await readFile(path);
      const probe: ReturnType<typeof probeProductionVideoMp4> = probeProductionVideoMp4(bytes);
      if (probe.width !== 720 || probe.height !== 1280 || probe.fps !== 24 || probe.frameCount !== plan.end - plan.first || probe.runtimeSeconds !== (plan.end - plan.first) / 24)
        throw new Error("Encoded clip does not match its exact frame range/profile");
      if (bytes.length > 200_000_000) throw new Error("Clip exceeds the documented planned provider size budget");
      const receipt: object = { path, status: "encoded-and-probed-not-visually-accepted", sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length,
        time: { globalStartSeconds: plan.first / 24, globalEndSeconds: plan.end / 24, localStartSeconds: 0, localEndSeconds: probe.runtimeSeconds, firstFrameInclusive: plan.first, lastFrameExclusive: plan.end },
        probe, method: { executable, args }, retention: "Locally retained only; no verified archive or restore test" };
      rows.push(receipt);
      const request: { record: string; sourceClip: object } | undefined = templates.requests.find((item: { record: string; sourceClip: object }): boolean => item.record.endsWith(`/${plan.name}.md`));
      if (request === undefined) throw new Error("Planned symbolic prompt record is absent");
      request.sourceClip = receipt;
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.stack ?? error.message : String(error);
      failures.push(`${plan.name}: ${message}`);
      rows.push({ path, status: "failed", error: message });
    }
  }
  await writeFile("docs/analysis/motion-clips.json", JSON.stringify({ source: { path: sourcePath, sha256: createHash("sha256").update(source).digest("hex"), bytes: source.length, probe: whole }, clips: rows, failures }, null, 2) + "\n");
  await writeFile("docs/prompts/videos/three-oclock-request-templates.json", JSON.stringify(templates, null, 2) + "\n");
  if (failures.length !== 0) throw new Error(failures.join("\n"));
  console.log("Encoded and probed five complete causal clips; visual acceptance and any provider submission remain separate.");
}

/** Await one actual encoder and retain its bounded diagnostic tail on refusal. */
async function encode(executable: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
    const child: ReturnType<typeof spawn> = spawn(executable, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let log: string = "";
    const timer: ReturnType<typeof setTimeout> = setTimeout((): void => { child.kill(); }, 300000);
    child.stderr?.on("data", (chunk: Buffer): void => { log = (log + chunk.toString()).slice(-16384); });
    child.once("error", (error: Error): void => { clearTimeout(timer); reject(error); });
    child.once("close", (code: number | null): void => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error(`FFmpeg exit ${code}: ${log}`)); });
  });
}

void splitMotionVideo();
