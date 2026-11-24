import {
  AutoMovieMeshExtract,
  AutoMovieSolidVector as Vector,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type {
  IAutoMovieMeshRayCaster,
  IAutoMovieMeshRayHit,
  AutoMovieVector2Tuple as Pixel,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

type Point = Mpfb.Point;

/**
 * The anatomical observations on the public HM08 rest skin. Eye, head and mouth
 * helpers place the observation charts. All reported landmarks are on the
 * indexed `body` group. FaceBase and Cho et al. name the measurements. These
 * observations seed future curve work on this one asset.
 *
 * @see https://www.facebase.org/resources/human/facial_norms/notes/
 * @see https://doi.org/10.1597/15-199
 * @see https://doi.org/10.3346/jkms.2025.40.e107
 */
export namespace FamilyConicMpfbHead {
  /**
   * A first-hit annotation with the surface face and camera location to replay
   * it.
   */
  export interface IPick {
    /** World millimetres, +X anterior, +Y superior, +Z anatomical left. */
    point: Point;
    /** Zero-based body triangle from the pinned importer. */
    triangle: number;
    /** Exact screen-space probe in the named camera. */
    observation: { camera: string; pixel: Pixel };
  }

  /**
   * Derive the sagittal landmarks and read bilateral markings on exact body
   * triangles.
   */
  export function measure(source: Mpfb.ISource): ReturnType<typeof read> {
    return read(source, charts(source));
  }

  /** Share the pinned mesh between a scan of the landmarks and the clay capture. */
  function read(source: Mpfb.ISource, views: ReturnType<typeof charts>) {
    const caster: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster({
      positions: views.mesh.positions.slice(),
      indices: views.mesh.indices.slice(),
      normals: null,
      uvs: null,
      skin: null,
    });
    const annotation = (camera: N.Camera, pixel: Pixel): IPick =>
      pick(caster, camera, pixel);
    const leftSulcus: IPick = annotation(views.front, [161, 202]);
    const rightSulcus: IPick = annotation(views.front, [739, 202]);
    const sagittal = profile(
      source,
      views.middle,
      (leftSulcus.point[1] + rightSulcus.point[1]) / 2,
    );
    const ala = (side: -1 | 1) => {
      const camera: N.Camera = side < 0 ? views.noseRight : views.noseLeft;
      const skin = (pixel: Pixel): IPick =>
        annotation(camera, mirrorPixel(camera, pixel, side > 0));

      // ESTIMATE: inspect the visible ala-cheek crease from superior to
      // inferior. The shadowed lower transition admits a nearby trace too.
      const crease: IPick[] = [
        [427, 480],
        [431, 525],
        [423, 562],
        [421, 593],
        [394, 609],
      ].map((p): IPick => skin(p as Pixel));
      const al: IPick = skin([398, 574]);
      const sbal: IPick = skin([367, 627]);
      const ac: IPick = support(crease, (p): number =>
        distance(p.point, sagittal.prn),
      );
      return { al, ac, sbal, crease };
    };
    const ear = (side: -1 | 1) => {
      const camera: N.Camera = side > 0 ? views.earLeft : views.earRight;
      const skin = (pixel: Pixel): IPick =>
        annotation(camera, mirrorPixel(camera, pixel, side < 0));

      // ESTIMATE: these manually marked surface faces follow the visible
      // transitions of the pinna. Insertion ends and notch are not sharp vertices.
      const c: IPick = skin([677, 376]);
      const d: IPick = skin([674, 748]);
      const e: IPick = skin([565, 310]);
      const f: IPick = skin([658, 815]);
      const t: IPick = skin([657, 535]);
      return {
        c,
        d,
        e,
        f,
        t,
        length: distance(e.point, f.point),
        insertion: distance(c.point, d.point),
      };
    };
    const left = ala(1);
    const right = ala(-1);
    return {
      asset: source.source,
      frame:
        "HM08 rest, millimetres, +X anterior, +Y superior, +Z anatomical left",
      methods: {
        n: "ESTIMATE: anterior midsagittal cut at mean marked upper palpebral sulcus height. The OBJ does not identify the nasofrontal suture.",
        se: "Deepest anterior profile point above the eye centres and at or below the proxy nasion.",
        prn: "Most anterior midsagittal point in the eye-to-mouth rig interval.",
        sn: "First anterior-profile recess below pronasale on the way to the upper lip.",
        al: "ESTIMATE: lateral wing crest marked in frontal and low oblique clay. Local resolution is set by the HM08 triangles.",
        ac: "FaceBase distance sweep from pronasale over the marked alar crease samples.",
        sbal: "ESTIMATE: inferomedial wing-to-lip insertion marked below the visible nostril rim.",
        c: "ESTIMATE: superior otobasion at the visible attachment fade.",
        d: "ESTIMATE: inferior otobasion at the visible lobe-to-scalp attachment fade.",
        e: "Superaurale marked on the upper helix support.",
        f: "Subaurale marked on the lower lobule support.",
        t: "ESTIMATE: superior tragal notch, marked in profile following FaceBase.",
      },
      rig: {
        leftEye: joint(source, "joint-l-eye"),
        rightEye: joint(source, "joint-r-eye"),
        head: joint(source, "joint-head"),
        mouth: joint(source, "joint-mouth"),
      },
      nose: {
        ...sagittal,
        superiorPalpebralSulci: { left: leftSulcus, right: rightSulcus },
        left,
        right,
        width: distance(left.al.point, right.al.point),
        subnasalWidth: distance(left.sbal.point, right.sbal.point),
        height: distance(sagittal.n, sagittal.sn),
        protrusion: distance(sagittal.sn, sagittal.prn),
      },
      ears: { left: ear(1), right: ear(-1) },
    };
  }

  /**
   * Write marked and unmarked clay plus exact replay cameras and all measured
   * points.
   */
  export async function capture(
    out: string,
    assetFile?: string,
  ): Promise<void> {
    const source: Mpfb.ISource = await Mpfb.load(assetFile);
    const views = charts(source);
    const result = read(source, views);
    const { n, se, sn, prn, left, right } = result.nose;
    const nose = (curves: ReturnType<typeof measure>["nose"]["left"]) => ({
      al: curves.al.point,
      ac: curves.ac.point,
      sbal: curves.sbal.point,
    });
    const ear = ({
      c,
      d,
      e,
      f,
      t,
    }: ReturnType<typeof measure>["ears"]["left"]) => ({
      c: c.point,
      d: d.point,
      e: e.point,
      f: f.point,
      t: t.point,
    });
    const bilateral: Record<string, Point> = {
      "left.al": left.al.point,
      "right.al": right.al.point,
      "left.sbal": left.sbal.point,
      "right.sbal": right.sbal.point,
    };
    const overlays: Record<string, Record<string, Point>> = {
      front: { n, se, sn, prn, ...bilateral },
      "low-oblique": { n, se, sn, prn, ...nose(right) },
      "nose-left": { n, se, sn, prn, ...nose(left) },
      "nose-profile": { n, se, sn, prn },
      "nose-underside": { sn, prn, ...bilateral },
      left: ear(result.ears.left),
      right: ear(result.ears.right),
    };
    await mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const frames: {
      file: string;
      sha256: string;
      camera: N.Camera;
      curves: string[];
    }[] = [];
    for (const camera of [
      views.front,
      views.noseRight,
      views.noseLeft,
      views.noseProfile,
      views.noseUnderside,
      views.earLeft,
      views.earRight,
    ]) {
      const overlay: Record<string, Point> = overlays[camera.name]!;
      const marks: N.Curve[] = glyphs(camera, overlay);
      for (const [pass, curves] of [
        ["clay", []],
        ["landmarks", marks],
      ] as const) {
        const file: string = `mpfb.hm08.head.${camera.name}.${pass}.png`;
        const frame = await Frame.write(
          null,
          out,
          file,
          camera,
          [views.mesh],
          [...curves],
          "xray",
          pass === "clay"
            ? "MPFB HM08 | raw skin"
            : `Landmarks in blue: ${marks
                .slice(0, 2)
                .map(({ id }): string => id)
                .join(", ")} · red: ${marks
                .slice(2)
                .map(({ id }): string => id)
                .join(", ")}`,
          pass,
          "head",
          undefined,
          "MPFB HM08",
        );
        frames.push({
          ...frame,
          camera,
          curves: curves.map(({ id }): string => id),
        });
      }
    }
    await writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify({ ...result, frames }, null, 2),
    );
  }
}

/** Straight distance in world millimetres. */
function distance(a: Point, b: Point): number {
  return Vector.norm(Vector.sub(a, b));
}

/** Reflection of a marked pixel for the anatomical opposite view. */
function mirrorPixel(camera: N.Camera, [x, y]: Pixel, reflect: boolean): Pixel {
  return [reflect ? camera.width - x : x, y];
}

/** Exact nearest body triangle under a manual orthographic surface mark. */
function pick(
  caster: IAutoMovieMeshRayCaster,
  camera: N.Camera,
  pixel: Pixel,
): FamilyConicMpfbHead.IPick {
  const [x, y] = pixel;
  const origin: Point = Vector.add(
    camera.target,
    Vector.add(
      Vector.scale(camera.right, (x - camera.width / 2) / camera.scale),
      Vector.scale(camera.up, ((camera.height + 40) / 2 - y) / camera.scale),
    ),
  );

  // A metre of travel starts outside the head and spans its full depth.
  const start: Point = Vector.add(origin, camera.back);
  const hit: IAutoMovieMeshRayHit | null = caster.nearestHit(
    start,
    Vector.scale(camera.back, -1),
    2,
  );
  if (hit === null)
    throw new Error(`No HM08 skin at ${camera.name} (${x}, ${y})`);
  return {
    point: Vector.scale(
      Vector.add(start, Vector.scale(camera.back, -hit.distance)),
      1000,
    ),
    triangle: hit.triangle,
    observation: { camera: camera.name, pixel },
  };
}

/** Read one required support point, with the caller's score in its own units. */
function support<T>(points: readonly T[], score: (point: T) => number): T {
  const first: T | undefined = points[0];
  if (first === undefined)
    throw new Error("No HM08 points in the anatomical observation interval");
  return points.reduce(
    (best, point): T => (score(point) > score(best) ? point : best),
    first,
  );
}

/** Cut the pure sagittal line first, then read the anterior profile extrema. */
function profile(
  source: Mpfb.IGeometry,
  middle: number,
  sulcus: number,
): Record<"n" | "se" | "prn" | "sn", Point> {
  const eye: Point = joint(source, "joint-l-eye");
  const mouth: Point = joint(source, "joint-mouth");
  const cut = AutoMovieMeshExtract.outline(
    source.body,
    {
      origin: [0, 0, middle],
      axes: [
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    [0],
    0,
    0,
    0,
  )[0]!;
  const planes: Pixel[] = cut.loops.flatMap(({ points }): Pixel[] => points);
  const front = (y: number): Point => {
    const points: number[] = [];
    for (const { points: line, closed } of cut.loops)
      for (let i: number = 0; i < line.length - (closed ? 0 : 1); ++i) {
        const [x0, y0] = line[i]!;
        const [x1, y1] = line[(i + 1) % line.length]!;
        if (Math.min(y0, y1) <= y && y <= Math.max(y0, y1))
          points.push(
            y0 === y1
              ? Math.max(x0, x1)
              : x0 + ((y - y0) * (x1 - x0)) / (y1 - y0),
          );
      }
    if (points.length === 0)
      throw new Error(`No HM08 sagittal skin at ${y} mm`);
    return [Math.max(...points), y, middle];
  };
  const n: Point = front(sulcus);
  const se: Point = [
    ...support(
      planes
        .filter(([, y]): boolean => eye[1] <= y && y <= sulcus)
        .filter(([x]): boolean => x >= eye[0]),
      ([x]): number => -x,
    ),
    middle,
  ];
  const prn: Point = [
    ...support(
      planes.filter(([, y]): boolean => mouth[1] <= y && y <= eye[1]),
      ([x]): number => x,
    ),
    middle,
  ];

  // Half the rig's eye-to-mouth height beneath the mouth helper contains
  // the first recess and upper lip in the inspected basemesh.
  const floor: number = mouth[1] - (eye[1] - mouth[1]) / 2;
  const levels: number[] = [
    ...new Set(
      planes
        .map(([, y]): number => y)
        .filter((y): boolean => floor <= y && y < prn[1]),
    ),
  ].sort((a, b): number => b - a);
  const wall: Point[] = [prn, ...levels.map(front)];
  const sn: Point | undefined = wall.find(
    ([x], i): boolean =>
      i > 0 &&
      i + 1 < wall.length &&
      x < wall[i - 1]![0] &&
      x < wall[i + 1]![0],
  );
  if (sn === undefined)
    throw new Error("No recess between the HM08 nose tip and upper lip");
  return { n, se, prn, sn };
}

/**
 * Frame all authoring views from the pinned rig centres and display the same
 * body triangles.
 */
function charts(source: Mpfb.ISource) {
  const eye: Point = joint(source, "joint-l-eye");
  const other: Point = joint(source, "joint-r-eye");
  const width: number = Math.abs(eye[2] - other[2]);
  const middle: number = (eye[2] + other[2]) / 2;
  const nose: Point = [eye[0], eye[1] - width / 3, middle];
  const ear: Point = [
    joint(source, "joint-head")[0] + width / 3,
    eye[1] - width / 6,
    middle,
  ];
  const noseRight: N.Camera = viewport("low-oblique", nose, width);
  const front: N.Camera = viewport("front", nose, width);
  const noseLeft: N.Camera = {
    ...noseRight,
    name: "nose-left",
    back: [noseRight.back[0], noseRight.back[1], -noseRight.back[2]],
    right: [-noseRight.right[0], -noseRight.right[1], noseRight.right[2]],
    up: [noseRight.up[0], noseRight.up[1], -noseRight.up[2]],
  };
  const mesh: N.Mesh = {
    id: "mpfb.hm08.skin",
    positions: Array.from(
      source.body.positions,
      (mm: number): number => mm / 1000,
    ),
    indices: Array.from(source.body.indices),
    colour: [0.64, 0.65, 0.67],
  };
  return {
    middle,
    mesh,
    front,
    noseLeft,
    noseRight,
    noseProfile: { ...viewport("left", nose, width), name: "nose-profile" },
    noseUnderside: {
      ...front,
      name: "nose-underside",
      back: [Math.SQRT1_2, -Math.SQRT1_2, 0] as Point,
      up: [Math.SQRT1_2, Math.SQRT1_2, 0] as Point,
    },
    earLeft: viewport("left", ear, width),
    earRight: viewport("right", ear, width),
  };
}

/** Draw two short pixel-scale strokes centered on each measured world position. */
function glyphs(camera: N.Camera, marks: Record<string, Point>): N.Curve[] {
  return Object.entries(marks).map(([id, mm], k): N.Curve => {
    const centre: Point = Vector.scale(mm, 1 / 1000);
    const u: Point = Vector.scale(camera.right, 5 / camera.scale);
    const v: Point = Vector.scale(camera.up, 5 / camera.scale);
    return {
      id,
      closed: false,
      colour: k < 2 ? "156B78" : "CE424D",
      points: [
        Vector.sub(centre, u),
        Vector.add(centre, u),
        centre,
        Vector.sub(centre, v),
        Vector.add(centre, v),
      ],
    };
  });
}

/** Look up a named marker from the published standard rig. */
function joint(source: Mpfb.IGeometry, id: string): Point {
  const point: Point | undefined = source.joints.get(id);
  if (point === undefined) throw new Error(`HM08 body is missing ${id}`);
  return point;
}

/**
 * Metre camera framing at the selected view centre, based on the rig's eye
 * span.
 */
function viewport(name: string, middle: Point, width: number): N.Camera {
  const target: Point = middle.map((mm: number): number => mm / 1000) as Point;
  const camera: N.Camera = Camera.fit(name, [target], 900, 900);
  return { ...camera, scale: 600_000 / width };
}

if (require.main === module) {
  const [, , out, assetFile] = process.argv;
  if (out === undefined)
    throw new Error(
      "Usage: FamilyConicMpfbHead <output-directory> [exact-hm08-obj]",
    );
  void FamilyConicMpfbHead.capture(path.resolve(out), assetFile).catch(
    (error: unknown): void => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
