import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Write one existing raster result, retaining scalar provenance instead of PNG
 * buffers.
 */
export namespace FamilyConicCaptureFrame {
  /** Scalar frame receipt destination supplied by a caller. */
  interface IContext {
    /** Completed artifact metadata, with its output directory. */
    frames: (N.Frame & { directory: string })[];
    /** Selected subject identity used when the call omits a display subject. */
    input: { selected: { id: string } };
  }

  /** A single caller's completed clay pass for exactly one camera and skin. */
  interface IPrepared {
    camera: N.Camera;
    meshes: readonly N.Mesh[];
    clay: NodeCanvasRaster.IBackground;
    milliseconds: number;
  }

  /**
   * Prepare the original skin depth once when matched passes share one scene.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing clay raster with the precise camera and original meshes that later frame writes submit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The prepared scene holds the completed clay and input identities together with the measured preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each preparation uses exactly the supplied camera and original meshes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One camera-local surface raster serves its two matched images.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses NodeCanvasRaster's software z-buffer and shading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame pair owns its prepared input and releases it after writing.
   * @evidence contracts/development/common.md#meaningful-documentation The scalar timing measures preparation of the original skin pass.
   */
  export function prepare(
    camera: N.Camera,
    meshes: readonly N.Mesh[],
  ): IPrepared {
    const started: number = performance.now();
    const clay: NodeCanvasRaster.IBackground = NodeCanvasRaster.prepare(
      camera,
      meshes,
    );
    return { camera, meshes, clay, milliseconds: performance.now() - started };
  }

  /**
   * Render and release one PNG with the actual subject, displayed stage and
   * explicit run evidence. Corrected annotation bytes are intentional; the
   * two-field returned file identity remains unchanged.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The existing rasterizer consumes the exact camera, mesh and evaluated catalog; the same caller-reported observation goes to its caption and durable frame record without inferring run state from this pass's displayed meshes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rendering, awaited file writing and scalar receipt insertion occur once in that order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometry or colour algorithm, image reconstruction, background cache or second render is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Records distinguish pass, run evidence, unknown diagnostic count, ROI, complete camera, line mode and raster/write intervals; omitted observation is neutral and the PNG is not retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms A caller's existing camera-local clay supplies the depth and pixels for matched passes. Each write owns one frame's transient arrays and PNG.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure and Deviation share this output boundary and the same context instead of reassembling a person.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The write is awaited and only file identity and scalar metadata survive; the PNG and raster arrays leave scope on return.
   */
  export async function write(
    context: IContext | null,
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
    prepared?: IPrepared,
  ): Promise<{ file: string; sha256: string }> {
    if (
      prepared !== undefined &&
      (prepared.camera !== camera ||
        prepared.meshes.length !== meshes.length ||
        prepared.meshes.some((mesh, i): boolean => mesh !== meshes[i]))
    )
      throw new Error(
        "Prepared clay belongs to a different camera or original skin",
      );
    const rendered: ReturnType<typeof NodeCanvasRaster.render> =
      NodeCanvasRaster.render(
        camera,
        prepared === undefined ? meshes : [],
        curves,
        lineMode,
        label,
        prepared?.clay,
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
