import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { PNG } from "pngjs";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ConicPaperLoft as L } from "./ConicPaperLoft";

/** CPU study images share exact cameras and materials; they do not certify the production GPU consumer. */
export namespace ConicPaperRender {
  /** Durable actual frame attribution with the renderer's measured stages. */
  export interface Frame {
    /** PNG basename inside the experiment's own ignored output directory. */
    file: string;
    /** SHA-256 of the exact encoded PNG bytes written to disk. */
    sha256: string;
    /** Independently generated study name or explicitly labelled native reference. */
    subject: string;
    /** Clay, construction alone or construction over clay. */
    stage: string;
    /** Exact shared orthographic camera, including metre frame, viewport and scale. */
    camera: N.Camera;
    /** Actual drawn mesh producer identifiers; an empty list is not hidden reference geometry. */
    meshes: string[];
    /** Actual drawn construction identifiers, all evaluated from the corresponding coefficients. */
    curves: string[];
    /** Native Canvas setup, CPU raster and PNG encoding times, in milliseconds. */
    milliseconds: { canvas: number; raster: number; encode: number };
    /** Actual depth-tested surface and visible/hidden line writes, without anatomical acceptance meaning. */
    pixels: { surface: number; line: number; hiddenLine: number };
  }
  /** Fixed reference-byte identity and every generated image, including partial output coverage. */
  export interface Result {
    /** Actual native Canvas/CPU z-buffer backend; explicitly separate from the GPU viewer. */
    renderer: string;
    /** Exact adopted native reference bytes, used only for comparison and common framing. */
    referenceSha256: string;
    /** Every actually written frame with camera, source identifiers, hash and measured work. */
    frames: Frame[];
    /** Matched comparison contact-sheet basenames, formed only from this run's PNGs. */
    sheets: string[];
    /** Native read, initialization, rendering, encoding, writing and contact-sheet time in milliseconds. */
    milliseconds: number;
  }

  /** Render independently regenerated coefficients and separately labelled native reference in one matched sweep. */
  export async function run(root: string, out: string, studies: { name: string; loft: Pick<L.Result, "mesh" | "curves"> }[]): Promise<Result> {
    const started: number = performance.now();
    const nativeBytes: Buffer = await fs.readFile(path.join(root, "test/.shots/f1/reference-model.json"));
    const native: { parts: { id: string; transform: unknown; geometry: { mesh: { positions: number[]; indices: number[] } } }[] } = JSON.parse(nativeBytes.toString("utf8")) as { parts: { id: string; transform: unknown; geometry: { mesh: { positions: number[]; indices: number[] } } }[] };
    if (native.parts.some((part): boolean => part.transform !== null)) throw new Error("The native comparison requires the saved identity placement.");
    const reference: N.Mesh[] = native.parts.map((part): N.Mesh => ({ id: "native-reference." + part.id, positions: part.geometry.mesh.positions, indices: part.geometry.mesh.indices, colour: [0.64, 0.65, 0.67] }));
    const bounds: N.Point[] = [];
    for (const mesh of reference)
      for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    const result: Result = { renderer: NodeCanvasRaster.initialize().backend, referenceSha256: createHash("sha256").update(nativeBytes).digest("hex"), frames: [], sheets: [], milliseconds: 0 };
    const subjects: { name: string; meshes: N.Mesh[]; curves: N.Curve[] }[] = [{ name: "native-reference", meshes: reference, curves: [] }, ...studies.map((study): { name: string; meshes: N.Mesh[]; curves: N.Curve[] } => ({ name: study.name, meshes: [study.loft.mesh], curves: study.loft.curves }))];
    const cameras: string[] = ["front", "back", "left", "right", "high-oblique", "low-oblique"];
    for (const cameraName of cameras) {
      const camera: N.Camera = NodeCanvasCamera.fit(cameraName, bounds, 640, 800);
      for (const subject of subjects) {
        const stages: string[] = ["clay"];
        if (subject.name !== "native-reference") stages.push("curves", "overlay");
        for (const stage of stages) {
          const meshes: N.Mesh[] = stage === "curves" ? [] : subject.meshes;
          const curves: N.Curve[] = stage === "clay" ? [] : subject.curves;
          const file: string = subject.name + "." + cameraName + "." + stage + ".png";
          const rendered: ReturnType<typeof NodeCanvasRaster.render> = NodeCanvasRaster.render(camera, meshes, curves, "depth", subject.name + " | " + cameraName + " | " + stage + " | partial study");
          await fs.writeFile(path.join(out, file), rendered.png);
          result.frames.push({ file, sha256: createHash("sha256").update(rendered.png).digest("hex"), subject: subject.name, stage, camera, meshes: meshes.map((mesh: N.Mesh): string => mesh.id), curves: curves.map((curve: N.Curve): string => curve.id), milliseconds: rendered.milliseconds, pixels: rendered.pixels });
          process.stdout.write(JSON.stringify({ event: "conic-study-frame", file, milliseconds: rendered.milliseconds }) + "\n");
        }
      }
    }
    for (const stage of ["clay", "curves", "overlay"]) {
      const names: string[] = stage === "clay" ? subjects.map((subject): string => subject.name) : studies.map((study): string => study.name);
      const views: string[] = cameras;
      const sheet: PNG = new PNG({ width: names.length * 320, height: views.length * 400 });
      sheet.data.fill(255);
      for (let row: number = 0; row < views.length; ++row)
        for (let column: number = 0; column < names.length; ++column) {
          const image: PNG = PNG.sync.read(await fs.readFile(path.join(out, names[column] + "." + views[row] + "." + stage + ".png")));
          for (let y: number = 0; y < 400; ++y)
            for (let x: number = 0; x < 320; ++x) {
              const source: number = ((y * 2) * image.width + x * 2) * 4;
              const target: number = ((row * 400 + y) * sheet.width + column * 320 + x) * 4;
              image.data.copy(sheet.data, target, source, source + 4);
            }
        }
      const file: string = "contact-" + stage + ".png";
      await fs.writeFile(path.join(out, file), PNG.sync.write(sheet));
      result.sheets.push(file);
    }
    result.milliseconds = performance.now() - started;
    return result;
  }
}
