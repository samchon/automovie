import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

type Point = Mpfb.Point;

/** Euclidean distance in the units of the input points. */
function distance(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Fit the annotated viewport and remove unrelated skin along the view axis. */
function frame(
  name: string,
  back: Point,
  up: Point,
  points: Point[],
): N.Camera {
  const camera: N.Camera = Camera.fitAnnotated(
    name,
    back,
    up,
    points,
    900,
    900,
  );
  const depth: number[] = points.map(
    (p): number => Camera.project(p, camera)[2],
  );
  const low: number = Math.min(...depth),
    high: number = Math.max(...depth);
  // ESTIMATE: keep half the observed depth beyond each side to retain nearby skin.
  const span: number = high - low;
  const distance: number = high + span * 1.5;
  return {
    ...camera,
    clipping: { distance, near: span, far: distance - low + span / 2 },
  };
}

/** Reproducible matched inspection of the public shoulder source and candidate. */
export namespace FamilyConicMpfbShoulder {
  /**
   * Write matched skin and contour views in the public rest pose, in the same
   * view directions as the joint comparison. A proximal preview receipt adds
   * candidate clay and guide passes using the same cameras. The receipt retains
   * the complete cameras for replay.
   *
   * @evidence contracts/development/implementation.md#principled-implementation An exact source mesh, published marker centres and transverse slice contours supply every geometric anchor.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One mesh and its prepared cut query serve the viewport and every section.
   */
  export async function capture(
    out: string,
    assetFile?: string,
    candidateFile?: string,
    limitDepth?: number,
  ): Promise<void> {
    const source: Mpfb.ISource = await Mpfb.load(assetFile);
    const shoulder: Point = source.joints.get("joint-l-shoulder")!;
    const clavicle: Point = source.joints.get("joint-l-clavicle")!;
    const elbow: Point = source.joints.get("joint-l-elbow")!;
    const landmarks = Armscye.measure(source);
    const guide = Armscye.guide(source, landmarks);
    const fold = landmarks.apex;
    const position: number[] = Array.from(source.body.positions);
    const shoulderRadius: number = distance(shoulder, clavicle);
    const foldRadius: number = distance(shoulder, fold);
    const points = (centre: Point, radius: number): Point[] => {
      const selection: Point[] = [];
      for (let i: number = 0; i < position.length; i += 3) {
        const p: Point = [position[i]!, position[i + 1]!, position[i + 2]!];
        if (distance(p, centre) <= radius)
          selection.push([p[0] / 1000, p[1] / 1000, p[2] / 1000]);
      }
      return selection;
    };
    const overview: Point[] = points(shoulder, shoulderRadius);
    const close: Point[] = points(fold, foldRadius);
    const cameras: N.Camera[] = [
      frame("front", [1, 0, 0], [0, 1, 0], overview),
      frame("back", [-1, 0, 0], [0, 1, 0], overview),
      frame("below", [0, -1, 0], [1, 0, 0], close),
      frame("axilla-close", [1, -1, 1], [0, 1, 0], close),
    ];
    const reference: N.Mesh = {
      id: "mpfb.hm08.skin",
      positions: position.map((mm: number): number => mm / 1000),
      indices: Array.from(source.body.indices),
      colour: [0.64, 0.65, 0.67],
    };
    const sceneCurve = (id: string, points: readonly Point[]): N.Curve => ({
      id,
      points: points.map(([x, y, z]): Point => [x / 1000, y / 1000, z / 1000]),
      closed: true,
    });
    const sourceSeam: N.Curve = sceneCurve(
      "hm08.reference.armscye",
      guide.points,
    );
    const passes: { pass: string; mesh: N.Mesh; guide?: N.Curve }[] = [
      { pass: "reference", mesh: reference },
      { pass: "reference-guides", mesh: reference, guide: sourceSeam },
    ];
    if (limitDepth !== undefined) {
      const limit: Subdivision.ISample = Subdivision.sample(source.body, limitDepth);
      const limitSource: Mpfb.ISource = { ...source, body: limit.body };
      const limitGuide = Armscye.guide(
        limitSource,
        Armscye.measure(limitSource),
        limit.normals,
      );
      const limitMesh: N.Mesh = {
        id: "mpfb.hm08.limit",
        positions: Array.from(limit.body.positions, (mm): number => mm / 1000),
        indices: Array.from(limit.body.indices),
        colour: reference.colour,
      };
      passes.push(
        { pass: "limit-reference", mesh: limitMesh },
        {
          pass: "limit-reference-guides",
          mesh: limitMesh,
          guide: sceneCurve("hm08.limit.armscye", limitGuide.points),
        },
      );
    }
    let candidatePreviewSha256: string | undefined;
    let candidateGuideSamples: number | undefined;
    if (candidateFile !== undefined) {
      const bytes: Buffer = await fs.readFile(candidateFile);
      candidatePreviewSha256 = createHash("sha256").update(bytes).digest("hex");
      const candidate = JSON.parse(bytes.toString("utf8")) as {
        source: Mpfb.ISource["source"];
        candidate: {
          mesh: { positions: number[]; indices: number[]; normals?: number[] };
          guide?: { points: Point[] };
          grid?: { columns: number; rootIntervals: number; verticesPerColumn: number };
        };
      };
      if (candidate.source.sha256 !== source.source.sha256)
        throw new Error(
          "The proximal chart preview was measured on a different asset",
        );
      const surface: N.Mesh = {
        id: "hm08.arm.proximal.preview",
        positions: candidate.candidate.mesh.positions.map(
          (mm): number => mm / 1000,
        ),
        indices: candidate.candidate.mesh.indices,
        colour: reference.colour,
      };
      const fittedSeam: Point[] | undefined = candidate.candidate.guide?.points;
      if (
        fittedSeam !== undefined &&
        (fittedSeam.length < 3 ||
          fittedSeam.some(
            (p): boolean => p.length !== 3 || !p.every(Number.isFinite),
          ))
      )
        throw new Error(
          "The fitted shoulder preview must carry one closed finite world guide",
        );
      candidateGuideSamples = fittedSeam?.length;
      passes.push(
        { pass: "proximal-clay", mesh: surface },
        {
          pass: "proximal-guides",
          mesh: surface,
          guide:
            fittedSeam === undefined
              ? sourceSeam
              : sceneCurve("hm08.candidate.armscye", fittedSeam),
        },
      );
      if (candidate.candidate.mesh.normals !== undefined)
        passes.push({
          pass: "analytic-clay",
          mesh: { ...surface, normals: candidate.candidate.mesh.normals },
        });
      const grid = candidate.candidate.grid;
      if (grid !== undefined) {
        const outlet: Point[] = Array.from({ length: grid.columns }, (_, i) => {
          const at: number = 3 * (i * grid.verticesPerColumn + grid.rootIntervals);
          const positions: number[] = candidate.candidate.mesh.positions;
          return [positions[at]!, positions[at + 1]!, positions[at + 2]!];
        });
        passes.push({
          pass: "protected-section",
          mesh: surface,
          guide: { ...sceneCurve("hm08.child.protected", outlet), colour: "1480cf" },
        });
      }
    }
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const frames: {
      file: string;
      sha256: string;
      camera: N.Camera;
      pass: string;
    }[] = [];
    for (const camera of cameras) {
      for (const { pass, mesh, guide: shown } of passes) {
        const file: string = `mpfb.hm08.shoulder.${camera.name}.${pass}.png`;
        const record = await Frame.write(
          null,
          out,
          file,
          camera,
          [mesh],
          shown === undefined ? [] : [shown],
          "depth",
          `MPFB HM08 | shoulder | ${camera.name} | ${pass}`,
          pass,
          "left shoulder",
          undefined,
          "MPFB HM08",
        );
        frames.push({ ...record, camera, pass });
      }
    }
    await fs.writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify(
        {
          asset: source.source,
          limitDepth,
          candidatePreviewSha256,
          pose: "HM08 rest",
          landmarksMm: { ...landmarks, shoulder, clavicle, elbow },
          radiusMm: { shoulder: shoulderRadius, axilla: foldRadius },
          guide: {
            winding: guide.winding,
            stations: guide.stations,
            sampledPoints: guide.points.length,
            candidateSampledPoints: candidateGuideSamples,
            candidateMode:
              candidateFile === undefined
                ? undefined
                : candidateGuideSamples === undefined
                  ? "source-registration"
                  : "fitted",
          },
          vertices: reference.positions.length / 3,
          triangles: reference.indices.length / 3,
          frames,
        },
        null,
        2,
      ),
    );
  }
}

if (require.main === module) {
  const out: string | undefined = process.argv[2];
  if (out === undefined)
    throw new Error(
      "Usage: FamilyConicMpfbShoulder <output-directory> [exact-hm08-obj] [--candidate=<preview-json>]",
    );
  const assets: string | undefined = process.argv
    .slice(3)
    .find((argument): boolean => !argument.startsWith("--"));
  const candidate: string | undefined = process.argv
    .slice(3)
    .find((argument): boolean => argument.startsWith("--candidate="))
    ?.slice("--candidate=".length);
  const subdivision: string | undefined = process.argv
    .slice(3)
    .find((argument): boolean => argument.startsWith("--limit="))
    ?.slice("--limit=".length);
  void FamilyConicMpfbShoulder.capture(
    path.resolve(out),
    assets,
    candidate,
    subdivision === undefined ? undefined : Number(subdivision),
  ).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
