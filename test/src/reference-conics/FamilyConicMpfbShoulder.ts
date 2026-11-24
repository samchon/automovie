import { AutoMovieMeshExtract } from "@automovie/engine";
import type {
  IAutoMovieMeshSectionChain,
  IAutoMovieMeshSectionCut,
  IAutoMovieMeshSectionFrame,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

type Point = Mpfb.Point;
type Planar = [number, number];
type Pair = { trunk: Planar[]; upperArm: Planar[] };

/** Euclidean distance in the units of the input points. */
function distance(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Test which section contains the arm's skeletal axis. */
function encloses(loop: readonly Planar[], [x, z]: Planar): boolean {
  let inside: boolean = false;
  for (let i: number = 0; i < loop.length; ++i) {
    const [xa, za] = loop[i]!;
    const [xb, zb] = loop[(i + 1) % loop.length]!;
    if (za > z !== zb > z && x < xa + ((xb - xa) * (z - za)) / (zb - za))
      inside = !inside;
  }
  return inside;
}

/** Find the opening between the trunk and arm using real skin sections. */
function axilla(
  source: Mpfb.IGeometry,
  shoulder: Point,
  elbow: Point,
): {
  point: Point;
  yBracketMm: [number, number];
  cutGapMm: number;
} {
  const query = AutoMovieMeshExtract.prepareOutline(source.body);
  const frame: IAutoMovieMeshSectionFrame = {
    origin: [0, 0, 0],
    axes: [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  };
  const sections = (y: number): Pair | null => {
    const t: number = (y - shoulder[1]) / (elbow[1] - shoulder[1]);
    const target: Planar = [
      shoulder[0] + t * (elbow[0] - shoulder[0]),
      shoulder[2] + t * (elbow[2] - shoulder[2]),
    ];
    // Exact slice contours from the asset. A zero bridge preserves an actual opening.
    const section: IAutoMovieMeshSectionCut = query(frame, [y], 0, 0.5, 0)[0]!;
    const closed: Planar[][] = section.outer
      .filter((face: IAutoMovieMeshSectionChain): boolean => face.closed)
      .map((face): Planar[] => face.points);
    const trunk: Planar[] | undefined = closed.find(
      (loop): boolean =>
        loop.some((p): boolean => p[1] < 0) &&
        loop.some((p): boolean => p[1] > 0),
    );
    const upperArm: Planar[] | undefined = closed.find(
      (loop): boolean =>
        loop !== trunk &&
        loop.every((p): boolean => p[1] > 0) &&
        encloses(loop, target),
    );
    return trunk === undefined || upperArm === undefined
      ? null
      : { trunk, upperArm };
  };

  let low: number = elbow[1],
    high: number = shoulder[1];
  let separated: Pair | null = sections(low);
  if (separated === null || sections(high) !== null)
    throw new Error(
      "The public skin does not bracket a separate arm below its shoulder",
    );
  // Resolve the height within one millimetre, the existing diagnostic view's chord.
  while (high - low > 1) {
    const y: number = (low + high) / 2;
    const at: Pair | null = sections(y);
    if (at === null) high = y;
    else {
      low = y;
      separated = at;
    }
  }

  // Below the contact height the nearest facing crossings converge to the crease.
  let gap: number = Infinity;
  let point: Point = [0, low, 0];
  for (const a of separated.trunk)
    for (const b of separated.upperArm) {
      const separation: number = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (separation < gap) {
        gap = separation;
        point = [(a[0] + b[0]) / 2, low, (a[1] + b[1]) / 2];
      }
    }
  return { point, yBracketMm: [low, high], cutGapMm: gap };
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
 * Write four source-only views in the public rest pose, in the same view
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
  const opening = axilla(source, shoulder, elbow);
  const position: number[] = Array.from(source.body.positions);
  const shoulderRadius: number = distance(shoulder, clavicle);
  const foldRadius: number = distance(shoulder, opening.point);
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
  const close: Point[] = points(opening.point, foldRadius);
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
  const frames: { file: string; sha256: string; camera: N.Camera }[] = [];
  for (const camera of cameras) {
    const file: string = `mpfb.hm08.shoulder.${camera.name}.png`;
    const record = await Frame.write(
      null,
      out,
      file,
      camera,
      [mesh],
      [],
      "depth",
      `MPFB HM08 | shoulder | ${camera.name}`,
      "reference",
      "left shoulder",
      undefined,
      "MPFB HM08",
    );
    frames.push({ ...record, camera });
  }
  await fs.writeFile(
    path.join(out, "receipt.json"),
    JSON.stringify(
      {
        asset: source.source,
        pose: "HM08 rest",
        landmarksMm: { shoulder, clavicle, elbow, axilla: opening },
        radiusMm: { shoulder: shoulderRadius, axilla: foldRadius },
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
