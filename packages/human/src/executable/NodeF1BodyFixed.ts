import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { AutoMovieHumanF1BodyAssembly } from "../generation/AutoMovieHumanF1BodyAssembly";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes } from "../inspection/NodeCanvasTypes";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster } from "./NodeCanvasRaster";
import baseline from "./NodeF1BodyFixedCameraInputs.json";

/** Camera vectors or renderer coordinates; display points use metres. */
type Point = NodeCanvasTypes.Point;

/** Draw the public fixed F1 realization without acquiring a comparison source. */
export namespace NodeF1BodyFixed {
  /** The exact source bytes present before generation and any guarded-read receipt. */
  export interface IInput {
    /** SHA-256 by repository-relative runtime input path. */
    readonly identities: Readonly<Record<string, string>>;

    /** Public fixed-body generation elapsed milliseconds. */
    readonly generationMs: number;

    /** Rejected reference/archive accesses observed by an external process guard. */
    readonly forbiddenReads?: readonly string[];
  }

  /** Generate once, then optionally acquire an explicit original comparison. */
  export async function run(compare: boolean): Promise<void> {
    const identities: Record<string, string> = snapshot();
    const { AutoMovieHumanF1Body } =
      await import("../generation/AutoMovieHumanF1Body.js");
    const start: number = performance.now();
    const body: AutoMovieHumanF1BodyAssembly.IFixed =
      AutoMovieHumanF1Body.create();
    await draw(body, compare, {
      identities,
      generationMs: performance.now() - start,
    });
  }

  /** Render an already generated body in the immutable accepted comparison cameras. */
  export async function draw(
    body: AutoMovieHumanF1BodyAssembly.IFixed,
    compare: boolean,
    input?: IInput,
  ): Promise<void> {
    const created: number = performance.now();
    const originalIdentities: Readonly<Record<string, string>> =
      input?.identities ?? snapshot();
    const points: Point[] = [];
    for (let i: number = 0; i < body.mesh.positions.length; i += 3)
      points.push(
        display([
          body.mesh.positions[i]!,
          body.mesh.positions[i + 1]!,
          body.mesh.positions[i + 2]!,
        ]),
      );
    const clay: NodeCanvasTypes.Mesh = {
      id: "fixed F1",
      positions: points.flat(),
      indices: body.mesh.indices,
      colour: [0.62, 0.56, 0.5],
    };
    const reference: Awaited<ReturnType<typeof comparison>> | null = compare
      ? await comparison()
      : null;
    const cameras: NodeCanvasTypes.Camera[] = baseline.cameras.map(
      (camera: (typeof baseline.cameras)[number]): NodeCanvasTypes.Camera => ({
        ...camera,
        target: point(camera.target),
        back: point(camera.back),
        right: point(camera.right),
        up: point(camera.up),
      }),
    );
    const comparisonCameras: { view: string; equal: boolean }[] | null =
      reference === null
        ? null
        : cameras.map(
            (
              camera: NodeCanvasTypes.Camera,
            ): { view: string; equal: boolean } => ({
              view: camera.name,
              equal:
                JSON.stringify(camera) ===
                JSON.stringify(
                  NodeCanvasCamera.fit(camera.name, reference.points),
                ),
            }),
          );
    const out: string = HumanNodePaths.resolve(
      `packages/human/.shots/f1_integration/body-fixed-${new Date().toISOString().replaceAll(":", "-")}`,
    );
    fs.mkdirSync(out, { recursive: true });
    const files: string[] = [];
    const pngSha256: Record<string, string> = {};
    const meshes: [string, NodeCanvasTypes.Mesh][] = [["clay", clay]];
    if (reference !== null) meshes.push(["reference", reference.mesh]);
    for (const camera of cameras)
      for (const [kind, mesh] of meshes) {
        const file: string = `${camera.name}.${kind}.png`;
        const { png }: ReturnType<typeof NodeCanvasRaster.render> =
          NodeCanvasRaster.render(
            camera,
            [mesh],
            [],
            "depth",
            `F1 fixed coordinates | ${camera.name} | ${kind}`,
          );
        fs.writeFileSync(path.join(out, file), png);
        pngSha256[file] = createHash("sha256").update(png).digest("hex");
        files.push(file);
      }
    const identitiesAtExit: Record<string, string> = snapshot();
    const changedDuringRun: string[] = [
      ...new Set([
        ...Object.keys(originalIdentities),
        ...Object.keys(identitiesAtExit),
      ]),
    ].filter(
      (file: string): boolean =>
        originalIdentities[file] !== identitiesAtExit[file],
    );
    const {
      seams,
      skin,
      sources,
      milliseconds,
    }: AutoMovieHumanF1BodyAssembly.IFixed = body;
    const report: {
      stage: string;
      seams: typeof seams;
      skin: typeof skin;
      sources: typeof sources;
      milliseconds: typeof milliseconds;
      cameras: NodeCanvasTypes.Camera[];
      files: string[];
      pngSha256: Record<string, string>;
      cameraBaseline: typeof baseline;
      referenceSha256: string | null;
      comparisonCameras: typeof comparisonCameras;
      provenance: {
        identities: Readonly<Record<string, string>>;
        identitiesAtExit: Record<string, string>;
        changedDuringRun: string[];
      };
      generationMs: number | null;
      forbiddenReads: readonly string[] | null;
      captureMs: number;
    } = {
      stage: "fixed-coordinate F1",
      seams,
      skin,
      sources,
      milliseconds,
      cameras,
      files,
      pngSha256,
      cameraBaseline: baseline,
      referenceSha256: reference?.sha256 ?? null,
      comparisonCameras,
      provenance: {
        identities: originalIdentities,
        identitiesAtExit,
        changedDuringRun,
      },
      generationMs: input?.generationMs ?? null,
      forbiddenReads: input?.forbiddenReads ?? null,
      captureMs: performance.now() - created,
    };
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(`node:f1-body ${out}`);
    console.log(
      JSON.stringify(
        {
          seams,
          skin,
          sources,
          milliseconds,
          changedDuringRun,
          comparisonCameras,
        },
        null,
        2,
      ),
    );
  }

  /** Read only code-owned geometry controls, adapters and the executable renderer. */
  export function snapshot(): Record<string, string> {
    const files: string[] = [];

    /** Visit runtime input trees in stable path order without loading a source model. */
    const collect: (relative: string) => void = (relative: string): void => {
      const absolute: string = HumanNodePaths.resolve(relative);
      for (const entry of fs
        .readdirSync(absolute, { withFileTypes: true })
        .sort((a: fs.Dirent, b: fs.Dirent): number =>
          a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
        )) {
        const file: string = `${relative}/${entry.name}`;
        if (entry.isDirectory()) collect(file);
        else if (entry.isFile() && /\.(?:ts|json)$/.test(entry.name))
          files.push(file);
      }
    };
    collect("packages/human/src/generation");
    collect("packages/human/src/lofting");
    files.push(
      "packages/human/src/index.ts",
      "packages/human/src/executable/NodeF1Body.ts",
      "packages/human/src/executable/NodeF1BodyFixed.ts",
      "packages/human/src/executable/NodeF1BodyFixedCameraInputs.json",
      "packages/human/src/executable/NodeCanvasRaster.ts",
      "packages/human/src/inspection/NodeCanvasCamera.ts",
    );
    return Object.fromEntries(
      files.map((file: string): [string, string] => [
        file,
        createHash("sha256")
          .update(fs.readFileSync(HumanNodePaths.resolve(file)))
          .digest("hex"),
      ]),
    );
  }

  /** Copy a recorded camera vector without changing its immutable baseline coordinates. */
  function point(value: readonly number[]): Point {
    return [value[0]!, value[1]!, value[2]!];
  }

  /** Convert capture-world millimetres to renderer metres, reflecting Z exactly once. */
  function display([x, y, z]: Point): Point {
    return [x / 1000, y / 1000, -z / 1000];
  }

  /** Acquire raw comparison geometry only after explicit comparison and pure generation. */
  async function comparison(): Promise<{
    points: Point[];
    mesh: NodeCanvasTypes.Mesh;
    sha256: string;
  }> {
    const [
      { NodeCaptureSources },
      { NodeTrunkReference },
      { NodeCaptureRender },
    ] = await Promise.all([
      import("./NodeCaptureSources.js"),
      import("./NodeTrunkReference.js"),
      import("./NodeCaptureRender.js"),
    ]);
    const context: import("./NodeCaptureSources").NodeCaptureSources.IContext =
      await NodeCaptureSources.context("reference");
    const reference: import("./NodeCaptureSources").NodeCaptureSources.IReference =
      await context.reference();
    const source: import("./NodeTrunkReference").NodeTrunkReference.IMesh =
      NodeTrunkReference.fromModel(reference.model, 1);
    const points: Point[] = source.points.map(display);
    return {
      points,
      sha256: reference.sha256,
      mesh: {
        id: "original F1 skin",
        positions: points.flat(),
        indices: source.triangles.flat(),
        colour: NodeCaptureRender.REFERENCE_COLOUR,
      },
    };
  }
}
