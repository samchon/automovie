import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster as R } from "./NodeCanvasRaster";

/**
 * Cache only the existing static reference raster before labels and overlays.
 * PNG preserves opaque colour, while a checked Float64 sidecar preserves the
 * exact depth test. Generated meshes and curves are never cached.
 */
export namespace NodeCanvasReferenceBackground {
  /** One entry binds immutable, already adapted reference buffers once. */
  export interface IOwner {
    /** Reference/display/native-renderer identity work, outside geometry and per-frame timing. */
    identityMilliseconds: number;

    /** Existing raster path with a reusable reference prefix; other mesh orders use the original path. */
    render(
      camera: N.Camera,
      meshes: readonly N.Mesh[],
      curves: readonly N.Curve[],
      lineMode: "xray" | "depth",
      label: string,
    ): Promise<IRender>;
  }

  /** Shared frame metadata preserves cache work separately from scene statistics. */
  export type IFacts = N.ReferenceBackground;

  /** Existing final PNG result and its separately named reference-cache facts. */
  export type IRender = ReturnType<typeof R.render> & {
    referenceBackground: IFacts;
  };

  /** Fingerprint the immutable reference display buffers and narrow raster dependencies once, never per frame. */
  export async function create(
    referenceSha256: string,
    references: readonly N.Mesh[],
  ): Promise<IOwner> {
    const started: number = performance.now();
    const digests: Map<N.Mesh, string> = new Map(
      references.map((mesh: N.Mesh): [N.Mesh, string] => [
        mesh,
        hash(JSON.stringify(mesh)),
      ]),
    );
    const canvasEntry: string = require.resolve("@napi-rs/canvas");
    const canvasPackage: Buffer = await fs.readFile(
      path.join(path.dirname(canvasEntry), "package.json"),
    );
    const packageData: { optionalDependencies?: Record<string, string> } =
      JSON.parse(canvasPackage.toString("utf8"));
    const resolveNative: ReturnType<typeof createRequire> =
      createRequire(canvasEntry);
    const native: Record<string, string> = {};
    for (const dependency of Object.keys(
      packageData.optionalDependencies ?? {},
    )) {
      try {
        const file: string = resolveNative.resolve(dependency);
        native[dependency] = hash(await fs.readFile(file));
      } catch (error: unknown) {
        if (
          !(
            error instanceof Error &&
            "code" in error &&
            error.code === "MODULE_NOT_FOUND"
          )
        )
          throw error;
      }
    }
    const rasterFiles: string[] = [
      HumanNodePaths.resolve(
        "packages/human/src/executable/NodeCanvasRaster.ts",
      ),
      HumanNodePaths.resolve(
        "packages/human/src/inspection/NodeCanvasCamera.ts",
      ),
      canvasEntry,
    ];
    const renderer: string[] = await Promise.all(
      rasterFiles.map(
        async (file: string): Promise<string> => hash(await fs.readFile(file)),
      ),
    );
    const identity: object = {
      schema: "node-cpu-reference-rgba-depth-v1",
      projection: "orthographic",
      referenceSha256,
      renderer,
      canvasPackage: hash(canvasPackage),
      native,
      runtime: process.versions,
      platform: process.platform,
      architecture: process.arch,
      byteOrder: os.endianness(),
    };
    const directory: string = HumanNodePaths.resolve(
      "packages/human/.shots/reference-background",
    );
    // Retain one active viewport only; all other PNG/depth entries stay on disk.
    let retained: { key: string; background: R.IBackground } | undefined;

    return {
      identityMilliseconds: performance.now() - started,
      async render(
        camera: N.Camera,
        meshes: readonly N.Mesh[],
        curves: readonly N.Curve[],
        lineMode: "xray" | "depth",
        label: string,
      ): Promise<IRender> {
        const began: number = performance.now();
        const times: IFacts["milliseconds"] = {
          key: 0,
          read: 0,
          verify: 0,
          decode: 0,
          referenceRaster: 0,
          referenceEncode: 0,
          store: 0,
          compose: 0,
          total: 0,
        };
        const selected: N.Mesh[] = [];
        for (const mesh of meshes) {
          if (!digests.has(mesh)) break;
          selected.push(mesh);
        }
        const eligible: boolean =
          selected.length !== 0 &&
          !meshes
            .slice(selected.length)
            .some((mesh: N.Mesh): boolean => digests.has(mesh));
        const facts: IFacts = {
          status: "none",
          key: null,
          refusal: null,
          writeFailure: null,
          retainedSceneSurfaceWrites: 0,
          referenceSurfaceWrites: 0,
          overlaySurfaceWrites: 0,
          milliseconds: times,
        };
        if (!eligible) {
          const rendered: ReturnType<typeof R.render> = R.render(
            camera,
            meshes,
            curves,
            lineMode,
            label,
          );
          facts.overlaySurfaceWrites = rendered.pixels.surface;
          times.compose = performance.now() - began;
          times.total = times.compose;
          return { ...rendered, referenceBackground: facts };
        }

        // Names and labels are dynamic; resolved projection, viewport, clip
        // and material/mesh selection determine the actual static pixels.
        const resolved: Record<string, unknown> = Object.fromEntries(
          Object.entries(camera).filter(
            ([key]: [string, unknown]): boolean => key !== "name",
          ),
        );
        const key: string = hash(
          JSON.stringify(
            {
              identity,
              camera: resolved,
              selection: selected.map(
                (mesh: N.Mesh): string => digests.get(mesh)!,
              ),
            },
            (_key: string, value: unknown): unknown =>
              typeof value === "number" &&
              (!Number.isFinite(value) || Object.is(value, -0))
                ? String(value)
                : value,
          ),
        );
        facts.key = key;
        times.key = performance.now() - began;
        let background: R.IBackground | undefined =
          retained?.key === key ? retained.background : undefined;
        if (background !== undefined) facts.status = "memory-hit";
        else {
          let phase: "read" | "verify" | "decode" = "read";
          let phaseStarted: number = performance.now();
          try {
            const receipt: IReceipt = JSON.parse(
              await fs.readFile(path.join(directory, key + ".json"), "utf8"),
            );
            const [png, depth]: [Buffer, Buffer] = await Promise.all([
              fs.readFile(path.join(directory, key + ".png")),
              fs.readFile(path.join(directory, key + ".f64")),
            ]);
            times.read += performance.now() - phaseStarted;
            phase = "verify";
            phaseStarted = performance.now();
            if (
              receipt.key !== key ||
              receipt.width !== camera.width ||
              receipt.height !== camera.height ||
              receipt.seal !== seal(receipt) ||
              receipt.pngSha256 !== hash(png) ||
              receipt.depthSha256 !== hash(depth) ||
              depth.length !==
                camera.width * camera.height * Float64Array.BYTES_PER_ELEMENT ||
              !(Number.isSafeInteger(receipt.surface) && receipt.surface >= 0)
            )
              throw new Error(
                "Incomplete or mismatched reference PNG/depth receipt",
              );
            const depths: Float64Array = new Float64Array(
              depth.buffer.slice(
                depth.byteOffset,
                depth.byteOffset + depth.byteLength,
              ),
            );
            if (
              depths.some(
                (value: number): boolean =>
                  value !== -Infinity && !Number.isFinite(value),
              )
            )
              throw new Error("Reference depth contains an invalid value");
            times.verify += performance.now() - phaseStarted;
            phase = "decode";
            phaseStarted = performance.now();
            const decoded: Awaited<ReturnType<typeof R.decodePng>> =
              await R.decodePng(png);
            if (
              decoded.width !== camera.width ||
              decoded.height !== camera.height
            )
              throw new Error("Reference PNG viewport differs");
            background = {
              pixels: decoded.pixels,
              depth: depths,
              surface: receipt.surface,
            };
            times.decode += performance.now() - phaseStarted;
            facts.status = "disk-hit";
          } catch (error: unknown) {
            times[phase] += performance.now() - phaseStarted;
            background = undefined;
            facts.refusal =
              error instanceof Error ? error.message : String(error);
          }
        }
        if (background === undefined) {
          const rasterStart: number = performance.now();
          background = R.prepare(camera, selected);
          times.referenceRaster = performance.now() - rasterStart;
          facts.referenceSurfaceWrites = background.surface;
          facts.status = "miss";
          const encoding: number = performance.now();
          const png: Buffer = R.encodeBackground(camera, background);
          times.referenceEncode = performance.now() - encoding;
          const verifying: number = performance.now();
          const depth: Buffer = Buffer.from(
            background.depth.buffer,
            background.depth.byteOffset,
            background.depth.byteLength,
          );
          const metadata: Omit<IReceipt, "seal"> = {
            key,
            width: camera.width,
            height: camera.height,
            surface: background.surface,
            pngSha256: hash(png),
            depthSha256: hash(depth),
          };
          const receipt: IReceipt = { ...metadata, seal: seal(metadata) };
          times.verify += performance.now() - verifying;
          const storing: number = performance.now();
          try {
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(path.join(directory, key + ".png"), png);
            await fs.writeFile(path.join(directory, key + ".f64"), depth);

            // The checked receipt is written last; partial pairs are misses.
            await fs.writeFile(
              path.join(directory, key + ".json"),
              JSON.stringify(receipt),
            );
          } catch (error: unknown) {
            facts.writeFailure =
              error instanceof Error ? error.message : String(error);
          }
          times.store = performance.now() - storing;
        }
        retained = { key, background };
        facts.retainedSceneSurfaceWrites = background.surface;
        const composing: number = performance.now();
        const rendered: ReturnType<typeof R.render> = R.render(
          camera,
          meshes.slice(selected.length),
          curves,
          lineMode,
          label,
          background,
        );
        facts.overlaySurfaceWrites =
          rendered.pixels.surface - background.surface;
        times.compose = performance.now() - composing;
        times.total = performance.now() - began;
        return { ...rendered, referenceBackground: facts };
      },
    };
  }
}

/** Last-written proof of one complete lossless reference PNG and exact depth sidecar. */
interface IReceipt {
  /** Actual camera/reference/renderer identity. */
  key: string;

  /** Pixel viewport width. */
  width: number;

  /** Pixel viewport height. */
  height: number;

  /** Retained scene insertion count, not work performed on a hit. */
  surface: number;

  /** Exact bytes of the unlabelled background PNG. */
  pngSha256: string;

  /** Exact host-endian Float64 depth bytes; byte order is part of the key. */
  depthSha256: string;

  /** Checksum of the identity, viewport, insertion count and payload hashes; not an authenticity claim. */
  seal: string;
}

/** Detect metadata damage independently of PNG/depth payload damage. */
function seal(receipt: Omit<IReceipt, "seal">): string {
  const {
    key,
    width,
    height,
    surface,
    pngSha256,
    depthSha256,
  }: Omit<IReceipt, "seal"> = receipt;
  return hash(
    JSON.stringify({ key, width, height, surface, pngSha256, depthSha256 }),
  );
}

/** Exact identity of narrow renderer, display-buffer or durable cache bytes. */
function hash(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
