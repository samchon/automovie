import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { NodeCanvasCamera as C } from "../../../packages/human/src/inspection/NodeCanvasCamera";
import { NodeCanvasRaster as R } from "../../../packages/human/src/executable/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import type { PartConicGeometry as G } from "./PartConicGeometry";

/** Actual CPU clay/construction captures, with one native-fitted camera reused by every representation. */
export namespace PartConicRender {
  /** An explicit producer with its own independently constructed geometry. */
  export interface Subject {
    /** Stable filename identity and visible producer label. */
    name: string;
    /** Metre mesh, which may be native only for the labelled reference column. */
    mesh: N.Mesh;
    /** Curves evaluated from this producer, not borrowed from its comparison. */
    curves: N.Curve[];
  }
  /** Write six whole-region views plus two central magnifications, each with three passes. */
  export async function run(out: string, name: string, native: G.Scene, subjects: Subject[]): Promise<{ backend: string; frames: { file: string; sha256: string; camera: N.Camera; milliseconds: { canvas: number; raster: number; encode: number } }[]; sheets: string[]; milliseconds: number }> {
    const started: number = performance.now();
    const deadline: number = started + 120_000;
    const bounds: N.Point[] = native.grid.flat().map((p): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]);
    const cameras: N.Camera[] = ["front", "back", "left", "right", "high-oblique", "low-oblique"].map((view: string): N.Camera => C.fit(view, bounds, 640, 800));
    const middle: N.Point[] = native.grid.slice(Math.floor(native.grid.length * 0.3), Math.ceil(native.grid.length * 0.7)).flat().map((p): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]);
    for (const view of ["front", "left"]) cameras.push({ ...C.fit(view, middle, 640, 800), name: "zoom-" + view });
    const frames: { file: string; sha256: string; camera: N.Camera; milliseconds: { canvas: number; raster: number; encode: number } }[] = [];
    const sheets: string[] = [];
    const backend: string = R.initialize().backend;
    for (const camera of cameras) for (const subject of subjects) for (const stage of ["curves", "overlay", "clay"]) {
      if (performance.now() > deadline) throw new Error("Explicit 120 second rendering budget exhausted.");
      const file: string = name + "." + subject.name + "." + camera.name + "." + stage + ".png";
      const rendered = R.render(camera, stage === "curves" ? [] : [subject.mesh], stage === "clay" ? [] : subject.curves, "depth", name + " | " + subject.name + " | " + camera.name + " | " + stage + " | CPU study");
      await fs.writeFile(path.join(out, file), rendered.png);
      frames.push({ file, sha256: createHash("sha256").update(rendered.png).digest("hex"), camera, milliseconds: rendered.milliseconds });
      process.stdout.write(JSON.stringify({ event: "part-conic-frame", file, milliseconds: rendered.milliseconds }) + "\n");
    }
    for (const stage of ["curves", "overlay", "clay"]) {
      const sheet: PNG = new PNG({ width: subjects.length * 320, height: cameras.length * 400 });
      sheet.data.fill(255);
      for (let row: number = 0; row < cameras.length; ++row) for (let column: number = 0; column < subjects.length; ++column) {
        const decoded: PNG = PNG.sync.read(await fs.readFile(path.join(out, name + "." + subjects[column]!.name + "." + cameras[row]!.name + "." + stage + ".png")));
        for (let y: number = 0; y < 400; ++y) for (let x: number = 0; x < 320; ++x) {
          const source: number = (2 * y * decoded.width + 2 * x) * 4;
          const target: number = ((row * 400 + y) * sheet.width + column * 320 + x) * 4;
          decoded.data.copy(sheet.data, target, source, source + 4);
        }
      }
      const file: string = name + ".contact-" + stage + ".png";
      await fs.writeFile(path.join(out, file), PNG.sync.write(sheet)); sheets.push(file);
    }
    return { backend, frames, sheets, milliseconds: performance.now() - started };
  }
}
