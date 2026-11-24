import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
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
  const camera: N.Camera = Capture.NailEvidence.fit(
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

/**
 * Write matched skin and contour views in the public rest pose, in the same view
 * directions as the joint comparison. The receipt retains the complete cameras
 * for replay.
 *
 * @evidence contracts/development/implementation.md#principled-implementation An exact source mesh, published marker centres and transverse slice contours supply every geometric anchor.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One mesh and its prepared cut query serve the viewport and every section.
 */
export async function captureMpfbShoulder(
  out: string,
  assetFile?: string,
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
  const mesh: N.Mesh = {
    id: "mpfb.hm08.skin",
    positions: position.map((mm: number): number => mm / 1000),
    indices: Array.from(source.body.indices),
    colour: [0.64, 0.65, 0.67],
  };
  await fs.mkdir(out, { recursive: true });
  NodeCanvasRaster.initialize();
  const frames: { file: string; sha256: string; camera: N.Camera; pass: string }[] = [];
  const seam: N.Curve = {
    id: "hm08.armscye",
    points: guide.points.map(([x, y, z]): Point => [x / 1000, y / 1000, z / 1000]),
    closed: true,
  };
  for (const camera of cameras) {
    for (const pass of ["reference", "reference-guides"] as const) {
      const file: string = `mpfb.hm08.shoulder.${camera.name}.${pass}.png`;
      const record = await Frame.write(
        null,
        out,
        file,
        camera,
        [mesh],
        pass === "reference" ? [] : [seam],
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
        pose: "HM08 rest",
        landmarksMm: { ...landmarks, shoulder, clavicle, elbow },
        radiusMm: { shoulder: shoulderRadius, axilla: foldRadius },
        guide: { winding: guide.winding, stations: guide.stations, sampledPoints: guide.points.length },
        vertices: mesh.positions.length / 3,
        triangles: mesh.indices.length / 3,
        frames,
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  const out: string | undefined = process.argv[2];
  if (out === undefined)
    throw new Error(
      "Usage: FamilyConicMpfbShoulder <output-directory> [exact-hm08-obj]",
    );
  void captureMpfbShoulder(path.resolve(out), process.argv[3]).catch(
    (error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
