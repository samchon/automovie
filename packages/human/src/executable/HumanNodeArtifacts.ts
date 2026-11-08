import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanNodePaths } from "./HumanNodePaths";

/** Exact Node artifact identities and byte-preserving source archives for the existing observation consumers. */
export namespace HumanNodeArtifacts {
  /** Actual requested scene for one durable PNG; all borrowed positions are display metres. */
  export interface IFrameInput {
    /** Existing entry-owned scope ID. */
    scope: string;

    /** Actual production/inspection stage, distinct from final skin. */
    stage: string;

    /** Fully resolved camera used by the renderer. */
    camera: N.Camera;

    /** Exact static/dynamic display buffers passed to this frame. */
    meshes: readonly N.Mesh[];

    /** Current evaluated original/loft display curves. */
    curves: readonly N.Curve[];

    /** Existing per-pixel visibility rule. */
    lineMode: "xray" | "depth";
  }

  /** Completed renderer output; this owner records bytes and never redraws geometry. */
  export interface IImage {
    /** Actual encoded PNG bytes. */
    png: Uint8Array;

    /** Existing Canvas/raster/encode boundaries; final PNG write is measured here. */
    milliseconds: Omit<N.Frame["milliseconds"], "write">;

    /** Existing scene-equivalent pixel insertion statistics. */
    pixels: N.Frame["pixels"];

    /** Separately named actual static-background work and cache state. */
    referenceBackground?: N.ReferenceBackground;
  }

  /** Persist one PNG and its exact scene receipt; caller-owned manifest/sidecar writes stay outside the PNG-write timer. */
  export async function frame(
    directory: string,
    file: string,
    input: IFrameInput,
    image: IImage,
  ): Promise<N.Frame> {
    const writing: number = performance.now();
    await fs.writeFile(path.join(directory, file), image.png);
    const write: number = performance.now() - writing;
    return {
      file,
      sha256: hash(image.png),
      camera: input.camera,
      stage: input.stage,
      scope: input.scope,
      curves: input.curves.map((curve: N.Curve): string => curve.id),
      meshes: input.meshes.map((mesh: N.Mesh): string => mesh.id),
      lineMode: input.lineMode,
      xrayOverrides: input.curves
        .filter((curve: N.Curve): boolean => curve.xray === true)
        .map((curve: N.Curve): string => curve.id),
      milliseconds: { ...image.milliseconds, write },
      pixels: image.pixels,
      ...(image.referenceBackground === undefined
        ? {}
        : { referenceBackground: image.referenceBackground }),
    };
  }

  /** Write the existing static frame index after captures; it changes no PNG, source or renderer state. */
  export async function index(
    directory: string,
    frames: readonly N.Frame[],
  ): Promise<void> {
    await fs.writeFile(
      path.join(directory, "index.html"),
      "<!doctype html><meta charset=utf-8><title>f1 Node software experiment</title><style>body{font:16px Arial;background:#dbe0e7}section{display:inline-block;vertical-align:top;width:360px}img{width:360px}p{word-break:break-all}</style><h1>f1 Node CPU diagnostic</h1><p>Actual Canvas2D PNGs. Original inputs, generated loft curves and prejoin raw clay are separate. Final skin not run. Two-sided flat clay is not hardware viewer acceptance.</p>" +
        frames
          .map(
            (frame: N.Frame): string =>
              "<section><p>" +
              frame.file +
              '</p><a href="' +
              frame.file +
              '"><img loading=lazy src="' +
              frame.file +
              '"></a></section>',
          )
          .join(""),
    );
  }

  /** Write one immutable numeric artifact and retain the separate serialization/write cost. */
  export async function json(
    directory: string,
    file: string,
    value: unknown,
  ): Promise<{
    file: string;
    sha256: string;
    bytes: number;
    serializationAndWriteMilliseconds: number;
  }> {
    const started: number = performance.now();
    const bytes: string = JSON.stringify(value);
    await fs.writeFile(path.join(directory, file), bytes);
    return {
      file,
      sha256: hash(bytes),
      bytes: Buffer.byteLength(bytes),
      serializationAndWriteMilliseconds: performance.now() - started,
    };
  }

  /** Exact selected source identities; an archive must match the source captured before evaluation. */
  export async function sources(
    files: readonly string[],
    archive?: string,
    expected?: Readonly<Record<string, string>>,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const file of files) {
      const bytes: Buffer = await fs.readFile(HumanNodePaths.resolve(file));
      result[file] = hash(bytes);
      if (expected !== undefined && result[file] !== expected[file])
        throw new Error(
          "Source changed before its archived observation: " + file,
        );
      if (archive !== undefined) {
        const target: string = path.join(archive, file);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, bytes);
      }
    }
    return result;
  }

  /** Exact artifact identity, independent of geometric acceptance. */
  export function hash(value: string | Uint8Array): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
