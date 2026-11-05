import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import ffmpeg from "ffmpeg-static";

/**
 * Derive frame-exact causal inputs from the completed silent whole hint.
 *
 * @evidence contracts/common.md#implementation-and-ownership Consumes the actual whole encode without changing its bytes, trims four nonoverlapping ranges, reencodes rather than copying GOP boundaries, fully decodes every result, and records measured frame counts plus retained file identities. Never submits provider requests.
 * @evidence contracts/common.md#authoring-interface Run after the current-revision scripts/render.ts succeeds. Consumes output/motion-dynamics/motion-hint.mp4 and preserves older output media. Current MP4s remain locally retained; tracked motion-dynamics-artifacts.json contains actual commands, byte counts and full decode. A failed decode/count throws.
 */
export async function prepareVideoHandoff(): Promise<void> {
  const binary: string = ffmpeg ?? "";
  if (!binary) throw new Error("ffmpeg-static is unavailable");
  const fps: number = 24;
  const whole: string = "output/motion-dynamics/motion-hint.mp4";
  const ranges: [string, number, number][] = [
    ["snitch-pursuit-and-overreach", 0, 552],
    ["a-prize-within-reach", 552, 840],
    ["two-broom-rescue-transfer", 840, 1272],
    ["what-she-caught-instead", 1272, 1440],
  ];
  await mkdir("output/motion-dynamics/segments", { recursive: true });
  await mkdir("docs/analysis", { recursive: true });
  const records: object[] = [];
  const source: object = await inspect(whole, 1440);
  for (const [name, start, end] of ranges) {
    const output: string = `output/motion-dynamics/segments/${name}.mp4`;
    const args: string[] = ["-y", "-i", whole, "-vf", `trim=start_frame=${start}:end_frame=${end},setpts=PTS-STARTPTS`, "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(fps), "-movflags", "+faststart", output];
    await execute(args);
    records.push({ name, globalSeconds: [start / fps, end / fps], globalFramesInclusive: [start, end - 1], localFramesInclusive: [0, end - start - 1], encodeArguments: args, ...await inspect(output, end - start) });
  }
  await writeFile("docs/analysis/motion-dynamics-artifacts.json", JSON.stringify({ status: "Actual repaired current-source silent whole and causal segments; earlier revision retained; no external generation", measuredAt: new Date().toISOString(), fps, source, segments: records }, null, 2) + "\n");

  /** Fully decode one actual file and reject a missing/truncated frame extent. */
  async function inspect(path: string, expected: number): Promise<{ path: string; bytes: number; sha256: string; decodedFrames: number; decodeArguments: string[]; observedProfile: string }> {
    const args: string[] = ["-hide_banner", "-i", path, "-map", "0:v:0", "-an", "-vf", "blackdetect=d=0.02:pix_th=0.02:pic_th=0.98", "-progress", "pipe:1", "-f", "null", "-"];
    const result: { stdout: string; stderr: string } = await execute(args);
    const counts: number[] = [...result.stdout.matchAll(/^frame=(\d+)/gm)].map((match: RegExpMatchArray): number => Number(match[1]));
    const frames: number = counts.at(-1) ?? -1;
    if (frames !== expected) throw new Error(`${path}: decoded ${frames}, expected ${expected}`);
    const bytes: Buffer = await readFile(path);
    return { path, bytes: (await stat(path)).size, sha256: createHash("sha256").update(bytes).digest("hex"), decodedFrames: frames, decodeArguments: args, observedProfile: result.stderr };
  }

  /** Invoke FFmpeg directly with an argument vector and retain diagnostic output. */
  function execute(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject): void => {
      const child = spawn(binary, args, { windowsHide: true });
      let stdout: string = ""; let stderr: string = "";
      child.stdout.on("data", (value: Buffer): void => { stdout += value.toString(); });
      child.stderr.on("data", (value: Buffer): void => { stderr += value.toString(); });
      child.on("error", reject);
      child.on("close", (code: number | null): void => {
        if (code !== 0) reject(new Error(`FFmpeg exit ${code}: ${stderr}`));
        else resolve({ stdout, stderr });
      });
    });
  }
}
void prepareVideoHandoff().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
