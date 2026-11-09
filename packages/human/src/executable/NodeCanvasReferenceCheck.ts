import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster as R } from "./NodeCanvasRaster";
import { NodeCanvasReferenceBackground as B } from "./NodeCanvasReferenceBackground";

/** Controlled comparison inside the existing first-original entry, without a separate renderer or process. */
export namespace NodeCanvasReferenceCheck {
  /** Cache facts do not establish Human anatomy or constructor performance. */
  export interface IOutput {
    /** Every requested pixel, visibility, key and damage expectation must hold. */
    status: "passed" | "failed";

    /** Actual current original IDs used by the display-subrange comparison. */
    originalIds: string[];

    /** Explicit scope of the current overlay and synthetic surface probe. */
    boundary: string;

    /** All findings collected before the entry reports a failed verification. */
    failures: string[];

    /** Actual rendering/cache/decode results for every comparison. */
    rows: IRow[];

    /** Whole diagnostic overhead, not normal frame or source timing. */
    milliseconds: number;
  }

  /** Compare immutable backgrounds against fresh rasterization using one real source/camera preparation. */
  export async function run(
    owner: B.IOwner,
    referenceSha256: string,
    references: readonly N.Mesh[],
    camera: N.Camera,
    meshes: readonly N.Mesh[],
    curves: readonly N.Curve[],
  ): Promise<IOutput> {
    const began: number = performance.now();
    const failures: string[] = [];
    const rows: IRow[] = [];
    const b: N.Curve[] = curves.map(
      (curve: N.Curve): N.Curve => ({
        ...curve,
        closed: false,
        points: curve.points.slice(
          0,
          Math.max(1, Math.ceil(curve.points.length / 2)),
        ),
      }),
    );
    const probe: N.Mesh = surfaceProbe(camera, meshes);
    const sequence: {
      name: string;
      label: string;
      curves: readonly N.Curve[];
      meshes: readonly N.Mesh[];
    }[] = [
      { name: "A", label: "A", curves, meshes: [...meshes, probe] },
      { name: "B-display-subrange", label: "B", curves: b, meshes },
      { name: "A-repeat", label: "A", curves, meshes: [...meshes, probe] },
      { name: "no-lines-or-probe", label: "none", curves: [], meshes },
    ];
    const cameras: N.Camera[] =
      camera.annotations === false
        ? [camera, { ...camera, annotations: true }]
        : [camera];
    for (const fixed of cameras) {
      let key: string | null = null;
      for (const mode of ["xray", "depth"] as const)
        for (const item of sequence) {
          const row: IRow = await compare(
            owner,
            item.name,
            fixed,
            item.meshes,
            item.curves,
            mode,
            item.label,
            failures,
          );
          if (row.cache.key === null)
            failures.push("Actual reference prefix was not cacheable");
          else if (key === null) key = row.cache.key;
          else if (key !== row.cache.key)
            failures.push(
              "A current line/surface/label edit changed the static background key",
            );
          rows.push(row);
        }
    }

    // A new entry owner must decode the persisted PNG/depth, not borrow RAM.
    const persistent: B.IOwner = await B.create(referenceSha256, references);
    const disk: IRow = await compare(
      persistent,
      "fresh-owner-disk-read",
      camera,
      meshes,
      curves,
      "depth",
      "A",
      failures,
    );
    rows.push(disk);
    if (disk.cache.status !== "disk-hit")
      failures.push("Fresh owner did not read a complete persistent entry");

    // A changed resolved target must invalidate even though its preset name stays.
    const changedCamera: N.Camera = {
      ...camera,
      target: [
        camera.target[0] + camera.right[0] / camera.scale,
        camera.target[1] + camera.right[1] / camera.scale,
        camera.target[2] + camera.right[2] / camera.scale,
      ],
    };
    const reframed: IRow = await compare(
      owner,
      "changed-resolved-camera",
      changedCamera,
      meshes,
      curves,
      "depth",
      "A",
      failures,
    );
    rows.push(reframed);
    if (reframed.cache.key === disk.cache.key)
      failures.push("Changed camera reused its old background");

    // Display colour changes preserve the native artifact SHA but change actual pixels.
    const recoloured: N.Mesh[] = references.map(
      (mesh: N.Mesh, i: number): N.Mesh =>
        i === 0 ? { ...mesh, colour: [0.12, 0.31, 0.63] } : mesh,
    );
    const colourOwner: B.IOwner = await B.create(referenceSha256, recoloured);
    const coloured: IRow = await compare(
      colourOwner,
      "changed-reference-colour",
      camera,
      recoloured,
      curves,
      "depth",
      "A",
      failures,
    );
    rows.push(coloured);
    if (coloured.cache.key === disk.cache.key)
      failures.push(
        "Changed actual reference colour reused its old background",
      );

    // Restore every derived cache file, even when a negative case throws.
    if (disk.cache.key !== null)
      await damaged(
        referenceSha256,
        references,
        camera,
        meshes,
        curves,
        disk.cache.key,
        rows,
        failures,
      );
    return {
      status: failures.length === 0 ? "passed" : "failed",
      originalIds: curves.map((curve: N.Curve): string => curve.id),
      boundary:
        "A/B use current original display samples; B shows only their first half. The extra blue triangle is a synthetic raster-composition probe, not Human original/loft/skin. Fixed camera groups separately exercise captions. Includes uncached raster, identity/decode and comparison overhead; no input/import/reference-parse/constructor speed or anatomy verdict.",
      failures,
      rows,
      milliseconds: performance.now() - began,
    };
  }
}

/** One strict decoded-pixel and visibility comparison through both real renderer paths. */
async function compare(
  owner: B.IOwner,
  name: string,
  camera: N.Camera,
  meshes: readonly N.Mesh[],
  curves: readonly N.Curve[],
  mode: "xray" | "depth",
  label: string,
  failures: string[],
): Promise<IRow> {
  const began: number = performance.now();
  const fresh: ReturnType<typeof R.render> = R.render(
    camera,
    meshes,
    curves,
    mode,
    "reference-cache-check " + label,
  );
  const freshMilliseconds: number = performance.now() - began;
  const cached: B.IRender = await owner.render(
    camera,
    meshes,
    curves,
    mode,
    "reference-cache-check " + label,
  );
  const [expected, actual]: [
    Awaited<ReturnType<typeof R.decodePng>>,
    Awaited<ReturnType<typeof R.decodePng>>,
  ] = await Promise.all([R.decodePng(fresh.png), R.decodePng(cached.png)]);
  let differences: number = 0;
  for (let i: number = 0; i < expected.pixels.length; i++)
    if (expected.pixels[i] !== actual.pixels[i]) differences++;
  if (
    expected.width !== actual.width ||
    expected.height !== actual.height ||
    differences !== 0
  )
    failures.push("Cached pixels differ: " + name + "/" + mode);
  if (JSON.stringify(fresh.pixels) !== JSON.stringify(cached.pixels))
    failures.push(
      "Cached scene visibility/counts differ: " + name + "/" + mode,
    );
  return {
    name,
    camera,
    mode,
    pngIdentical: fresh.png.equals(cached.png),
    channelDifferences: differences,
    rgbaSha256: hash(actual.pixels),
    freshMilliseconds,
    fresh: fresh.milliseconds,
    cache: cached.referenceBackground,
    pixels: cached.pixels,
    meshes: meshes.map((mesh: N.Mesh): string => mesh.id),
    observationMilliseconds: performance.now() - began,
  };
}

/** Exercise partial payload and valid-looking damaged metadata through a fresh production owner, then restore the exact owned bytes. */
async function damaged(
  referenceSha256: string,
  references: readonly N.Mesh[],
  camera: N.Camera,
  meshes: readonly N.Mesh[],
  curves: readonly N.Curve[],
  key: string,
  rows: IRow[],
  failures: string[],
): Promise<void> {
  if (!/^[0-9a-f]{64}$/.test(key))
    throw new Error("Invalid owned cache identity");
  const directory: string = HumanNodePaths.resolve(
    "packages/human/.shots/reference-background",
  );
  const pngPath: string = path.join(directory, key + ".png");
  const depthPath: string = path.join(directory, key + ".f64");
  const receiptPath: string = path.join(directory, key + ".json");
  const [png, depth, receipt]: [Buffer, Buffer, Buffer] = await Promise.all([
    fs.readFile(pngPath),
    fs.readFile(depthPath),
    fs.readFile(receiptPath),
  ]);
  for (const kind of [
    "partial-depth",
    "corrupt-png",
    "damaged-metadata",
  ] as const) {
    try {
      if (kind === "partial-depth")
        await fs.writeFile(depthPath, depth.subarray(0, depth.length - 8));
      else if (kind === "corrupt-png") {
        const changed: Buffer = Buffer.from(png);
        changed[0] = changed[0]! ^ 1;
        await fs.writeFile(pngPath, changed);
      } else {
        const metadata: unknown = JSON.parse(receipt.toString("utf8"));
        if (
          metadata === null ||
          typeof metadata !== "object" ||
          !("surface" in metadata) ||
          typeof metadata.surface !== "number"
        )
          throw new Error(
            "The owned valid cache receipt has no surface counter",
          );
        await fs.writeFile(
          receiptPath,
          JSON.stringify({ ...metadata, surface: metadata.surface + 1 }),
        );
      }
      const owner: B.IOwner = await B.create(referenceSha256, references);
      const row: IRow = await compare(
        owner,
        kind,
        camera,
        meshes,
        curves,
        "depth",
        "A",
        failures,
      );
      rows.push(row);
      if (row.cache.status !== "miss" || row.cache.refusal === null)
        failures.push(
          "Damaged reference cache became a successful hit: " + kind,
        );
    } catch (error: unknown) {
      failures.push("Cache integrity case " + kind + ": " + String(error));
    } finally {
      await fs.writeFile(pngPath, png);
      await fs.writeFile(depthPath, depth);
      await fs.writeFile(receiptPath, receipt);
    }
  }
  const restored: [Buffer, Buffer, Buffer] = await Promise.all([
    fs.readFile(pngPath),
    fs.readFile(depthPath),
    fs.readFile(receiptPath),
  ]);
  if (
    !restored[0].equals(png) ||
    !restored[1].equals(depth) ||
    !restored[2].equals(receipt)
  )
    failures.push("Owned cache bytes were not exactly restored");
}

/** A frontmost 48-pixel triangle probes current-mesh drawing/clearing; it represents no anatomical surface. */
function surfaceProbe(camera: N.Camera, meshes: readonly N.Mesh[]): N.Mesh {
  let far: number = -Infinity;
  for (const mesh of meshes)
    for (let i: number = 0; i < mesh.positions.length; i += 3)
      far = Math.max(
        far,
        (mesh.positions[i]! - camera.target[0]) * camera.back[0] +
          (mesh.positions[i + 1]! - camera.target[1]) * camera.back[1] +
          (mesh.positions[i + 2]! - camera.target[2]) * camera.back[2],
      );
  const depth: number = far + 1 / camera.scale;
  const size: number = 24 / camera.scale;
  const point: (h: number, v: number) => N.Point = (
    h: number,
    v: number,
  ): N.Point => [
    camera.target[0] +
      camera.back[0] * depth +
      camera.right[0] * h +
      camera.up[0] * v,
    camera.target[1] +
      camera.back[1] * depth +
      camera.right[1] * h +
      camera.up[1] * v,
    camera.target[2] +
      camera.back[2] * depth +
      camera.right[2] * h +
      camera.up[2] * v,
  ];
  return {
    id: "cache-check.synthetic-surface-probe",
    positions: [
      ...point(-size, -size),
      ...point(size, -size),
      ...point(0, size),
    ],
    indices: [0, 1, 2],
    colour: [0.05, 0.25, 0.75],
  };
}

/** Durable actual comparison facts, with scene statistics separate from current cache/raster work. */
interface IRow {
  /** Requested display-only step. */
  name: string;

  /** Fully resolved camera, including caption/crop policy. */
  camera: N.Camera;

  /** Existing line visibility mode. */
  mode: "xray" | "depth";

  /** Exact encoded PNG comparison. */
  pngIdentical: boolean;

  /** Exact unequal decoded-channel count; no visual tolerance is used. */
  channelDifferences: number;

  /** Actual decoded RGBA identity. */
  rgbaSha256: string;

  /** Uncached render wall time, excluding decode/comparison. */
  freshMilliseconds: number;

  /** Existing uncached Canvas/raster/encoder boundaries. */
  fresh: ReturnType<typeof R.render>["milliseconds"];

  /** Actual cache and reference work, not constructor timing. */
  cache: B.IFacts;

  /** Scene-equivalent visibility/insertion counts. */
  pixels: N.Frame["pixels"];

  /** Exact supplied current meshes, with the synthetic probe explicitly named. */
  meshes: string[];

  /** Entire observed comparison, including diagnostic decode overhead. */
  observationMilliseconds: number;
}

/** Exact raw byte identity from either native Canvas byte-vector type. */
function hash(bytes: Uint8Array | Uint8ClampedArray): string {
  return createHash("sha256")
    .update(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength))
    .digest("hex");
}
