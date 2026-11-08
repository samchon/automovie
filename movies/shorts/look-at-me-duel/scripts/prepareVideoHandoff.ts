import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import ffmpeg from "ffmpeg-static";

import { motionFileDigest } from "./motionSourceIdentity";

/**
 * Derive actual causal clips and decoded review images from the whole motion MP4.
 * @evidence contracts/common.md#implementation-and-ownership Fully decodes the whole and each frame-exact derivative, checks presentation clocks/profile/counts, and retains commands, identities and failures. Clips use trim/setpts without speed changes and are reencoded at24fps rather than GOP copied. Actual encoded frames0,20,…1420,1439 plus causal events and each clip boundary are extracted for independent image reading. No paid generation or speech candidate is consumed.
 * @evidence contracts/common.md#authoring-interface Run only after public Render writes output/film.mp4. Writes four output/segments MP4s, native review PNGs and docs/analysis/motion-artifacts.json. Existing derivative paths refuse overwrite. All four clip attempts finish before aggregate failure. Whole input bytes must remain unchanged. This establishes technical files/clock lineage, not their audience acceptance, listening or strict generator following.
 */
export async function prepareVideoHandoff(): Promise<void> {
  const binary: string = ffmpeg ?? "";
  if (!binary) throw new Error("Installed FFmpeg is unavailable");
  const whole: string = "output/film.mp4";
  const before: string = await motionFileDigest(whole);
  const ranges: [string, number, number][] = [["opening-challenge", 0, 216], ["wrist-turn-and-deflection", 216, 600], ["west-lane-rescue", 600, 1152], ["look-at-me-this-time", 1152, 1440]];
  const findings: string[] = [];
  await mkdir("output/segments", { recursive: true });
  await mkdir("output/review/stride", { recursive: true });
  await mkdir("output/review/events", { recursive: true });
  const source: Awaited<ReturnType<typeof inspect>> = await inspect(whole, 1440);
  const segments: object[] = [];
  for (const [name, start, end] of ranges) {
    const output: string = `output/segments/${name}.mp4`;
    const args: string[] = ["-n", "-i", whole, "-vf", `trim=start_frame=${start}:end_frame=${end},setpts=PTS-STARTPTS`, "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "24", "-movflags", "+faststart", output];
    try {
      await execute(args);
      const file: Awaited<ReturnType<typeof inspect>> = await inspect(output, end - start);
      if (file.bytes > 200 * 1024 * 1024) throw new Error("Segment exceeds the selected2.5 reference budget");
      const boundary: Awaited<ReturnType<typeof pictures>> = await pictures(output, [0, end - start - 1], `output/review/${name}-boundary`);
      segments.push({ name, globalSeconds: [start / 24, end / 24], localSeconds: [0, (end - start) / 24], globalFramesInclusive: [start, end - 1], localFramesInclusive: [0, end - start - 1], encodeArguments: args, ...file, boundary });
    } catch (error: unknown) { findings.push(`${name}:${String(error)}`); }
  }
  const stride: number[] = [...Array.from({ length: 72 }, (_value: unknown, index: number): number => index * 20), 1439];
  const eventFrames: number[] = [215, 216, 263, 272, 305, 351, 364, 391, 410, 421, 485, 536, 560, 579, 599, 600, 861, 886, 905, 917, 938, 960, 972, 975, 981, 996, 997, 998, 999, 1003, 1005, 1011, 1066, 1095, 1103, 1104, 1151, 1152, 1166, 1193, 1212, 1248, 1253, 1259, 1265, 1272, 1277, 1285, 1313, 1330, 1382, 1404, 1433, 1434];
  const images: object = { stride: await pictures(whole, stride, "output/review/stride"), events: await pictures(whole, eventFrames, "output/review/events") };
  if (await motionFileDigest(whole) !== before) findings.push("Whole source bytes changed during clip preparation");
  await writeFile("docs/analysis/motion-artifacts.json", JSON.stringify({ status: findings.length === 0 ? "Actual silent whole and four causal clips; independent image review pending" : "Actual handoff has unresolved technical findings", measuredAt: new Date().toISOString(), fps: 24, source, segments, images, findings, referenceTarget: { model: "dreamina-seedance-2-5-260628", mode: "reference", sourceVideosPerRequest: 1, images: 0, audio: 0, submitted: false, uploadUrl: "{{SOURCE_CLIP_PUBLIC_URL}}" }, retention: "locally-retained-only; no verified archive" }, null, 2) + "\n");
  if (findings.length !== 0) throw new Error(findings.join("\n"));

  /** Decode every frame and compare actual presentation timestamps with the CFR clock. */
  async function inspect(file: string, expected: number): Promise<{ path: string; bytes: number; sha256: string; decodedFrames: number; durationSeconds: number; firstPts: number; lastPts: number; maximumClockErrorSeconds: number; profile: string; decodeArguments: string[] }> {
    const args: string[] = ["-hide_banner", "-i", file, "-map", "0:v:0", "-an", "-vf", "showinfo", "-progress", "pipe:1", "-f", "null", "-"];
    const result: Awaited<ReturnType<typeof execute>> = await execute(args);
    const counts: number[] = [...result.stdout.matchAll(/^frame=(\d+)/gm)].map((row: RegExpMatchArray): number => Number(row[1]));
    const pts: number[] = [...result.stderr.matchAll(/\bn:\s*\d+\s+pts:\s*-?\d+\s+pts_time:([\d.eE+-]+)/g)].map((row: RegExpMatchArray): number => Number(row[1]));
    const header: string = result.stderr.split("Stream mapping:")[0]!;
    const profile: string = header.split(/\r?\n/).filter((row: string): boolean => /Duration:|Video:|Audio:/.test(row)).join("\n");
    const maximum: number = Math.max(...pts.map((time: number, index: number): number => Math.abs(time - index / 24)));
    if (counts.at(-1) !== expected || pts.length !== expected || maximum > 0.0005 || !/Video: h264/.test(header) || !/yuv420p/.test(header) || !/720x1280/.test(header) || !/24 fps/.test(header) || /Audio:/.test(header)) throw new Error(`Unexpected decoded profile/clock:${file}/${counts.at(-1)}/${pts.length}/${maximum}/${profile}`);
    return { path: file, bytes: (await stat(file)).size, sha256: await motionFileDigest(file), decodedFrames: expected, durationSeconds: expected / 24, firstPts: pts[0]!, lastPts: pts.at(-1)!, maximumClockErrorSeconds: maximum, profile, decodeArguments: args };
  }

  /** Extract exact decoded frame indices, retaining their actual native image bytes. */
  async function pictures(file: string, frames: number[], directory: string): Promise<{ extractArguments: string[]; frames: { frame: number; seconds: number; path: string; sha256: string }[] }> {
    await mkdir(directory, { recursive: true });
    const selection: string = frames.map((frame: number): string => `eq(n\\,${frame})`).join("+");
    const args: string[] = ["-n", "-i", file, "-vf", `select=${selection}`, "-vsync", "0", "-start_number", "0", `${directory}/frame-%04d.png`];
    await execute(args);
    const rows: { frame: number; seconds: number; path: string; sha256: string }[] = [];
    for (let index: number = 0; index < frames.length; index++) {
      const output: string = `${directory}/frame-${String(index).padStart(4, "0")}.png`;
      rows.push({ frame: frames[index]!, seconds: frames[index]! / 24, path: output, sha256: await motionFileDigest(output) });
    }
    return { extractArguments: args, frames: rows };
  }

  /** Invoke the installed encoder with a literal vector and retain bounded diagnostics. */
  function execute(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject): void => {
      const child = spawn(binary, args, { windowsHide: true });
      let stdout: string = ""; let stderr: string = "";
      child.stdout.on("data", (bytes: Buffer): void => { stdout += bytes.toString(); });
      child.stderr.on("data", (bytes: Buffer): void => { stderr += bytes.toString(); });
      child.on("error", reject);
      child.on("close", (code: number | null): void => { if (code !== 0) reject(new Error(`FFmpeg exit${code}:${stderr.slice(-65536)}`)); else resolve({ stdout, stderr }); });
    });
  }
}

void prepareVideoHandoff().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
