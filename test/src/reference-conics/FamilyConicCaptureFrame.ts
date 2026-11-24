import fs from "node:fs/promises";
import path from "node:path";

import type { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Write one existing raster result, retaining scalar provenance instead of PNG buffers. */
export namespace FamilyConicCaptureFrame {
  /**
   * Render and release one PNG with the actual subject, displayed stage and explicit run evidence.
   * Corrected annotation bytes are intentional; the two-field returned file identity remains unchanged.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The existing rasterizer consumes the exact camera, mesh and evaluated catalog; the same caller-reported observation goes to its caption and durable frame record without inferring run state from this pass's displayed meshes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rendering, awaited file writing and scalar receipt insertion occur once in that order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometry or colour algorithm, image reconstruction, background cache or second render is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Records distinguish pass, run evidence, unknown diagnostic count, ROI, complete camera, line mode and raster/write intervals; omitted observation is neutral and the PNG is not retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms Only one frame's existing raster arrays and PNG exist during this call, plus its bounded scalar/id record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure and Deviation share this output boundary and the same context instead of reassembling a person.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The write is awaited and only file identity and scalar metadata survive; the PNG and raster arrays leave scope on return.
   */
  export async function write(
    context: Pick<Capture.IContext, "frames" | "input"> | null,
    out: string,
    file: string,
    camera: N.Camera,
    meshes: N.Mesh[],
    curves: N.Curve[],
    lineMode: "xray" | "depth",
    label: string,
    stage: string,
    scope: string,
    observation?: N.Observation,
    subject?: string,
  ): Promise<{ file: string; sha256: string }> {
    const rendered: ReturnType<typeof NodeCanvasRaster.render> =
      NodeCanvasRaster.render(
        camera,
        meshes,
        curves,
        lineMode,
        label,
        undefined,
        subject ?? context?.input.selected.id,
        observation,
      );
    const started: number = performance.now();
    await fs.writeFile(path.join(out, file), rendered.png);
    const write: number = performance.now() - started;
    const sha256: string = Identity.byteHash(rendered.png);
    if (context !== null)
      context.frames.push({
        directory: out,
        file,
        sha256,
        camera,
        stage,
        ...(observation === undefined ? {} : { observation }),
        scope,
        pixels: rendered.pixels,
        curves: curves.map((curve: N.Curve): string => curve.id),
        meshes: meshes.map((mesh: N.Mesh): string => mesh.id),
        lineMode,
        xrayOverrides: curves
          .filter((curve: N.Curve): boolean => curve.xray === true)
          .map((curve: N.Curve): string => curve.id),
        milliseconds: { ...rendered.milliseconds, write },
      });
    return { file, sha256 };
  }
}
