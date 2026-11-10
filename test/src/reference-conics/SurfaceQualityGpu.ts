import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium, type Browser, type Page } from "playwright";

/** Replay one local stored scene at a time through the existing Vite viewer, without starting any server or changing coefficients. */
export async function SurfaceQualityGpu(): Promise<void> {
  const root: string = path.resolve(process.cwd(), "..");
  const argument: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--from="))?.slice(7);
  if (argument === undefined) throw new Error("Explicit completed CPU output required: --from=<directory>");
  const out: string = path.resolve(argument);
  const scenePath: string = path.join(out, "scenes.json");
  const bytes: Buffer = await fs.readFile(scenePath);
  const scenes: { roi: string; name: string }[] = JSON.parse(bytes.toString("utf8")) as { roi: string; name: string }[];
  const base: string = "http://127.0.0.1:5197";
  const status: { running: unknown; queued: unknown[]; admitted: number } = await (await fetch(base + "/human-debug/status.json")).json() as { running: unknown; queued: unknown[]; admitted: number };
  if (status.running !== null || status.queued.length !== 0 || status.admitted !== 0) throw new Error("Shared capture queue is not idle");
  const url = (file: string): string => base + "/@fs/" + file.replaceAll("\\", "/");
  const moduleUrl: string = url(path.join(root, "test/src/reference-conics/SurfaceQualityBrowser.ts"));
  const html: string = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Surface quality controls</title></head><body style=\"margin:0\"><canvas style=\"width:800px;height:800px;display:block\" width=\"800\" height=\"800\"></canvas><script type=\"module\" src=\"" + moduleUrl + "\"></script></body></html>";
  await fs.writeFile(path.join(out, "gpu-static-study.html"), html);
  const browser: Browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
  const frames: { file: string; sha256: string; actual: unknown }[] = [];
  const errors: string[] = [];
  const moduleBytes: Buffer = await fs.readFile(path.join(root, "test/src/reference-conics/SurfaceQualityBrowser.ts"));
  try {
    const page: Page = await browser.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1 });
    page.on("pageerror", (error: Error): void => { errors.push(error.stack ?? error.message); });
    await page.goto(url(path.join(out, "gpu-static-study.html")), { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction((): boolean => "surfaceQuality" in window, undefined, { timeout: 30000 });
    for (let i: number = 0; i < scenes.length; ++i) {
      const scene: { roi: string; name: string } = scenes[i]!;
      // Adaptive and shared-support controls are enough to separate normals from the common-grid contribution.
      if (!scene.name.startsWith("shared-support") && !scene.name.startsWith("adaptive")) continue;
      for (let view: number = 0; view < 3; ++view) for (const flat of [true, false]) for (const stage of ["clay", "curves", "overlay"] as const) {
        const actual: unknown = await page.evaluate(async (a: { dataUrl: string; index: number; view: number; flat: boolean; stage: "clay" | "curves" | "overlay" }): Promise<unknown> => {
          const host: { surfaceQuality: (url: string, index: number, view: number, flat: boolean, stage: "clay" | "curves" | "overlay") => Promise<unknown> } = window as unknown as { surfaceQuality: (url: string, index: number, view: number, flat: boolean, stage: "clay" | "curves" | "overlay") => Promise<unknown> };
          return host.surfaceQuality(a.dataUrl, a.index, a.view, a.flat, a.stage);
        }, { dataUrl: url(scenePath), index: i, view, flat, stage });
        const file: string = "gpu." + scene.roi + "." + scene.name + "." + ["front", "left", "high-oblique"][view] + "." + (flat ? "flat" : "smooth") + "." + stage + ".png";
        const png: Buffer = await page.locator("canvas").screenshot();
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex"), actual });
      }
      process.stdout.write(JSON.stringify({ event: "surface-gpu-scene", roi: scene.roi, name: scene.name, frames: frames.length }) + "\n");
    }
  } finally {
    await browser.close();
    await fs.writeFile(path.join(out, "gpu-static-receipt.json"), JSON.stringify({ schema: "surface-quality-gpu-controlled-static-v2", completedUtc: new Date().toISOString(), statusBefore: status, sceneSha256: createHash("sha256").update(bytes).digest("hex"), browserSourceSha256: createHash("sha256").update(moduleBytes).digest("hex"), browserSourceUnchanged: moduleBytes.equals(await fs.readFile(path.join(root, "test/src/reference-conics/SurfaceQualityBrowser.ts"))), frames, errors, policy: "Same stored positions, indices, camera, lights and material; flatShading alone changes between matched flat/smooth clay frames. Normals derive only from that mesh. CPU orthographic and GPU finite-distance perspective remain distinct renderer conditions. The first dynamic-import failure receipt is preserved separately." }));
  }
  process.stdout.write(JSON.stringify({ event: "surface-gpu-complete", out, frames: frames.length, errors }) + "\n");
}

void SurfaceQualityGpu().catch((error: unknown): void => { process.stderr.write(String(error instanceof Error ? error.stack : error) + "\n"); process.exitCode = 1; });
