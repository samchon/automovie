import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium, type Browser, type Page } from "playwright";
import { PartConicInput as I } from "./PartConicInput";
import { PartConicFields as F } from "./PartConicFields";
import { PartConicGeometry as G } from "./PartConicGeometry";
import { AutoMovieLoftChain } from "@automovie/engine";
import { NodeCanvasCamera as C } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Replay independently stored conic fields through the existing GPU viewer; no fitting or native skin fallback occurs. */
async function main(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(process.cwd(), "..");
  const argument: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--from="))?.slice(7);
  if (argument === undefined) throw new Error("Completed CPU study directory required: --from=<directory>");
  const source: string = path.resolve(argument);
  await fs.access(path.join(source, "receipt.json"));
  const out: string = path.join(source, "gpu-replay"); await fs.mkdir(out, { recursive: true });
  const base: string = "http://127.0.0.1:5197";
  const status = await (await fetch(base + "/human-debug/status.json")).json() as { running: unknown; queued: unknown[]; admitted: number };
  if (status.running !== null || status.queued.length !== 0 || status.admitted !== 0) throw new Error("Shared GPU capture queue is occupied.");
  const input = await I.load(root);
  const scenes: { roi: string; name: string; mesh: N.Mesh; curves: N.Curve[]; cameras: N.Camera[] }[] = [];
  const errors: string[] = [];
  const coefficientIdentities: { path: string; bytes: number; sha256: string }[] = [];
  for (const part of input.parts) {
    const native: G.Scene = G.nativeGrid(part);
    const bounds: N.Point[] = native.grid.flat().map((p): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]);
    const cameras: N.Camera[] = ["front", "back", "left", "right", "high-oblique", "low-oblique"].map((view: string): N.Camera => C.fit(view, bounds, 800, 800));
    const middle: N.Point[] = native.grid.slice(Math.floor(native.grid.length * 0.3), Math.ceil(native.grid.length * 0.7)).flat().map((p): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]);
    for (const view of ["front", "left"]) cameras.push({ ...C.fit(view, middle, 800, 800), name: "zoom-" + view });
    scenes.push({ roi: part.name, name: "native-reference", mesh: G.reference(part, input.mesh), curves: native.curves, cameras }, { roi: part.name, name: native.name, mesh: native.mesh, curves: native.curves, cameras });
    try { const saved = G.saved(part); scenes.push({ roi: part.name, name: saved.name, mesh: saved.mesh, curves: saved.curves, cameras }); }
    catch (error) { errors.push(part.name + ".saved: " + String(error)); }
    for (const pieces of [1, 2] as const) {
      try {
        const coefficientPath: string = path.join(source, part.name + ".conic-" + pieces * 4 + ".coefficients.json");
        const coefficientBytes: Buffer = await fs.readFile(coefficientPath);
        coefficientIdentities.push({ path: coefficientPath, bytes: coefficientBytes.length, sha256: createHash("sha256").update(coefficientBytes).digest("hex") });
        const coefficients: F.Coefficients = JSON.parse(coefficientBytes.toString("utf8")) as F.Coefficients;
        const actual = F.create(coefficients, part.rows.map((row): number => row.s));
        if (actual.chain === null) throw new Error(JSON.stringify(actual.diagnostics));
        const chain = actual.chain;
        const generated = G.grid(part, "continuous-conic-" + pieces * 4, (s: number, phi: number) => AutoMovieLoftChain.point(chain, s, phi));
        scenes.push({ roi: part.name, name: generated.name, mesh: generated.mesh, curves: generated.curves, cameras });
      } catch (error) { errors.push(part.name + ".conic-" + pieces * 4 + ": " + String(error)); }
    }
  }
  const sceneBytes: Buffer = Buffer.from(JSON.stringify(scenes));
  const scenePath: string = path.join(out, "scenes.json"); await fs.writeFile(scenePath, sceneBytes);
  const url = (file: string): string => base + "/@fs/" + file.replaceAll("\\", "/");
  const modulePath: string = path.join(root, "test/src/reference-conics/SurfaceQualityBrowser.ts");
  const moduleBytes: Buffer = await fs.readFile(modulePath);
  const htmlPath: string = path.join(out, "part-conic-gpu.html");
  await fs.writeFile(htmlPath, "<!doctype html><html><head><meta charset='utf-8'></head><body style='margin:0'><canvas width='800' height='800' style='display:block;width:800px;height:800px'></canvas><script type='module' src='" + url(modulePath) + "'></script></body></html>");
  const browser: Browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"] });
  const frames: { file: string; sha256: string; actual: unknown }[] = [];
  try {
    const page: Page = await browser.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1 });
    page.on("pageerror", (error: Error): void => { errors.push(error.stack ?? error.message); });
    await page.goto(url(htmlPath), { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction((): boolean => "surfaceQuality" in window, undefined, { timeout: 30000 });
    const deadline: number = performance.now() + 180_000;
    for (let index: number = 0; index < scenes.length; ++index) {
      const scene = scenes[index]!;
      for (let view: number = 0; view < scene.cameras.length; ++view) for (const stage of ["curves", "overlay", "clay"] as const) {
        if (performance.now() > deadline) throw new Error("Explicit 180 second GPU capture deadline exhausted.");
        const actual: unknown = await page.evaluate(async (a: { url: string; index: number; view: number; stage: "curves" | "overlay" | "clay" }): Promise<unknown> => {
          const host = window as unknown as { surfaceQuality: (url: string, index: number, view: number, flat: boolean, stage: "curves" | "overlay" | "clay") => Promise<unknown> };
          return host.surfaceQuality(a.url, a.index, a.view, false, a.stage);
        }, { url: url(scenePath), index, view, stage });
        const file: string = scene.roi + "." + scene.name + "." + scene.cameras[view]!.name + ".smooth." + stage + ".png";
        const png: Buffer = await page.locator("canvas").screenshot(); await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex"), actual });
      }
      process.stdout.write(JSON.stringify({ event: "part-conic-gpu-scene", roi: scene.roi, name: scene.name, frames: frames.length, pid: process.pid }) + "\n");
    }
  } finally {
    await browser.close();
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "part-conic-gpu-coefficient-replay-v1", pid: process.pid, inputIdentities: input.identities, coefficientIdentities,
      sceneSha256: createHash("sha256").update(sceneBytes).digest("hex"), browserModuleSha256: createHash("sha256").update(moduleBytes).digest("hex"), browserModuleUnchanged: moduleBytes.equals(await fs.readFile(modulePath)),
      frames, errors, milliseconds: performance.now() - started, limitations: ["Actual GPU smooth indexed normals; native triangles are only the named reference producer.", "GPU cameras are identical between representations; finite-distance perspective differs from CPU orthographic diagnostic.", "Open regional ports are study boundaries, not body cracks; this is not a full Human or global optimal decomposition."] }, null, 2));
  }
  process.stdout.write(JSON.stringify({ event: "part-conic-gpu-complete", out, frames: frames.length, errors }) + "\n");
}
void main().catch((error: unknown): void => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
