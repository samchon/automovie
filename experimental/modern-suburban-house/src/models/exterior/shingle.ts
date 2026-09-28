/**
 * Roof-course and folded-edge prototypes from docs/models/15-outdoor.md.
 * Roof planes, course order, trimming planes, and world placement are caller
 * inputs; this file emits only the local metre geometry and surface identity.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Point = readonly [number, number, number];
type FaceId =
  | "shingle-face"
  | "shingle-butt"
  | "shingle-back"
  | "shingle-cut"
  | "roof-flashing";
type Result = {
  model: IAutoMovieModel;
  faceByPart: Readonly<Record<string, FaceId>>;
};
type Point2 = readonly [number, number];
type ClipPlane = { x: number; y: number; limit: number };

const clipPolygon = (
  polygon: readonly Point2[],
  plane: ClipPlane,
): Point2[] => {
  const output: Point2[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!,
      b = polygon[(i + 1) % polygon.length]!;
    const da = plane.x * a[0] + plane.y * a[1] - plane.limit;
    const db = plane.x * b[0] + plane.y * b[1] - plane.limit;
    const insideA = da <= 1e-10,
      insideB = db <= 1e-10;
    if (insideA) output.push(a);
    if (insideA !== insideB) {
      const t = da / (da - db);
      output.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  const unique: Point2[] = [];
  for (const point of output)
    if (
      unique.length === 0 ||
      Math.hypot(
        point[0] - unique[unique.length - 1]![0],
        point[1] - unique[unique.length - 1]![1],
      ) > 1e-10
    )
      unique.push(point);
  if (
    unique.length > 1 &&
    Math.hypot(
      unique[0]![0] - unique[unique.length - 1]![0],
      unique[0]![1] - unique[unique.length - 1]![1],
    ) <= 1e-10
  )
    unique.pop();
  return unique;
};

const edgeKey = (a: Point2, b: Point2): string =>
  `${Math.round(a[0] * 1e9)},${Math.round(a[1] * 1e9)}|${Math.round(b[0] * 1e9)},${Math.round(b[1] * 1e9)}`;

class MeshParts {
  public readonly parts: IAutoMovieModelPart[] = [];
  public readonly faceByPart: Record<string, FaceId> = {};

  public face(
    name: string,
    id: FaceId,
    corners: readonly Point[],
    outward: Point,
    uv: (p: Point) => readonly [number, number],
  ): void {
    if (this.faceByPart[name] !== undefined)
      throw new Error(`duplicate shingle face: ${name}`);
    const a = corners[0]!,
      b = corners[1]!,
      c = corners[2]!;
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const normal = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const ordered =
      normal[0] * outward[0] + normal[1] * outward[1] + normal[2] * outward[2] >
      0
        ? corners
        : [...corners].reverse();
    const size = Math.hypot(...outward);
    const unit = outward.map((v) => v / size);
    const mesh: IAutoMovieMesh = {
      positions: ordered.flatMap((p) => [...p]),
      normals: ordered.flatMap(() => unit),
      uvs: ordered.flatMap((p) => [...uv(p)]),
      indices: [],
      skin: null,
    };
    for (let i = 1; i < ordered.length - 1; i++)
      mesh.indices!.push(0, i, i + 1);
    this.parts.push({
      id: name,
      name,
      geometry: { type: "mesh", mesh },
      material: null,
      attachedBone: null,
      transform: null,
    });
    this.faceByPart[name] = id;
  }

  public result(id: string): Result {
    const model: IAutoMovieModel = {
      id: `roof:${id}`,
      name: id,
      origin: "generated",
      parts: this.parts,
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return { model, faceByPart: this.faceByPart };
  }
}

/** Three-tab shingle and starter, folded ridge cap, and metal flashing.
 */
export class AsphaltShingle {
  /** The lower strip butt centre is (0,0,0); +Y rises toward the ridge. */
  public buildStrip(input: {
    id: string;
    starter?: boolean;
    clipPlanes?: readonly ClipPlane[];
  }): Result {
    if (!input.id) throw new Error("invalid shingle id");
    const clipPlanes = input.clipPlanes ?? [];
    if (
      clipPlanes.some(
        (p) =>
          ![p.x, p.y, p.limit].every(Number.isFinite) ||
          Math.hypot(p.x, p.y) === 0,
      )
    )
      throw new Error(`invalid shingle clipping plane: ${input.id}`);
    const builder = new MeshParts();
    const top = (y: number): number => 0.01 - (0.008 * y) / 0.3;
    const spans: readonly (readonly [number, number])[] = input.starter
      ? [[-0.5, 0.5]]
      : [
          [-0.5, -0.17],
          [-0.17, -0.165],
          [-0.165, 0.165],
          [0.165, 0.17],
          [0.17, 0.5],
        ];
    const rectangles: readonly (readonly [number, number, number, number])[] =
      input.starter
        ? [[-0.5, 0.5, 0, 0.3]]
        : [
            ...spans
              .filter((_, i) => i % 2 === 0)
              .map(([x0, x1]) => [x0, x1, 0, 0.14] as const),
            ...spans.map(([x0, x1]) => [x0, x1, 0.14, 0.3] as const),
          ];
    const polygons = rectangles.map(([x0, x1, y0, y1]) =>
      clipPlanes.reduce<Point2[]>(
        (current, plane) =>
          current.length < 3 ? [] : clipPolygon(current, plane),
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ],
      ),
    );
    const edgeCounts = new Map<string, number>();
    for (const polygon of polygons)
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i]!,
          b = polygon[(i + 1) % polygon.length]!;
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= 1e-9) continue;
        const key = edgeKey(a, b),
          reverse = edgeKey(b, a);
        if (edgeCounts.has(reverse))
          edgeCounts.set(reverse, edgeCounts.get(reverse)! - 1);
        else edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
      }
    let edgeNumber = 0;
    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i]!;
      if (polygon.length < 3) continue;
      const area = polygon.reduce((sum, a, k) => {
        const b = polygon[(k + 1) % polygon.length]!;
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0);
      if (area <= 1e-12) continue;
      builder.face(
        `front-${i}`,
        "shingle-face",
        polygon.map(([x, y]) => [x, y, top(y)] as const),
        [0, 0.008 / 0.3, 1],
        (p) => [p[0] + 0.5, p[1]],
      );
      builder.face(
        `back-${i}`,
        "shingle-back",
        polygon.map(([x, y]) => [x, y, 0] as const),
        [0, 0, -1],
        (p) => [p[0] + 0.5, p[1]],
      );
      for (let k = 0; k < polygon.length; k++) {
        const a = polygon[k]!,
          b = polygon[(k + 1) % polygon.length]!;
        if (
          Math.hypot(a[0] - b[0], a[1] - b[1]) <= 1e-9 ||
          (edgeCounts.get(edgeKey(a, b)) ?? 0) <= 0
        )
          continue;
        const face: FaceId =
          Math.abs(a[1]) < 1e-9 && Math.abs(b[1]) < 1e-9
            ? "shingle-butt"
            : "shingle-cut";
        builder.face(
          `edge-${edgeNumber++}`,
          face,
          [
            [a[0], a[1], 0],
            [b[0], b[1], 0],
            [b[0], b[1], top(b[1])],
            [a[0], a[1], top(a[1])],
          ],
          [b[1] - a[1], a[0] - b[0], 0],
          (p) => [Math.hypot(p[0] - a[0], p[1] - a[1]), p[2]],
        );
      }
    }
    if (builder.parts.length === 0)
      throw new Error(`shingle clipped away: ${input.id}`);
    return builder.result(input.id);
  }

  /** One cap along +X, folded to the caller's two actual roof pitches. */
  public buildRidgeCap(input: {
    id: string;
    leftPitch: number;
    rightPitch: number;
    length?: number;
  }): Result {
    const { id, leftPitch, rightPitch } = input;
    const length = input.length ?? 0.3;
    if (
      !id ||
      !Number.isFinite(length) ||
      length <= 0 ||
      length > 0.3 ||
      ![leftPitch, rightPitch].every(
        (v) => Number.isFinite(v) && v > 0 && v < Math.PI / 2,
      )
    )
      throw new Error(`invalid ridge cap pitch: ${id}`);
    const builder = new MeshParts(),
      width = 0.165,
      thick = 0.006;
    const profile: readonly (readonly [number, number])[] = [
      [-width, -width * Math.tan(leftPitch)],
      [0, 0],
      [width, -width * Math.tan(rightPitch)],
      [width, -width * Math.tan(rightPitch) - thick],
      [0, -thick],
      [-width, -width * Math.tan(leftPitch) - thick],
    ];
    this.fold(
      builder,
      profile,
      length,
      "shingle-face",
      "shingle-back",
      "shingle-cut",
    );
    return builder.result(id);
  }

  /** Valley underlay: two 0.10 m wings folded along a caller-matched valley. */
  public buildValleyFlashing(input: {
    id: string;
    length: number;
    leftPitch: number;
    rightPitch: number;
  }): Result {
    const { id, length, leftPitch, rightPitch } = input;
    if (
      !id ||
      !Number.isFinite(length) ||
      length <= 0 ||
      ![leftPitch, rightPitch].every(
        (v) => Number.isFinite(v) && v > 0 && v < Math.PI / 2,
      )
    )
      throw new Error(`invalid valley flashing: ${id}`);
    const w = 0.1,
      t = 0.003;
    const profile: readonly (readonly [number, number])[] = [
      [-w, w * Math.tan(leftPitch)],
      [0, 0],
      [w, w * Math.tan(rightPitch)],
      [w, w * Math.tan(rightPitch) - t],
      [0, -t],
      [-w, w * Math.tan(leftPitch) - t],
    ];
    const builder = new MeshParts();
    this.fold(
      builder,
      profile,
      length,
      "roof-flashing",
      "roof-flashing",
      "roof-flashing",
    );
    return builder.result(id);
  }

  /** L flashing: 0.12 m roof wing and 0.15 m wall upstand. */
  public buildWallFlashing(input: { id: string; length: number }): Result {
    const { id, length } = input;
    if (!id || !Number.isFinite(length) || length <= 0)
      throw new Error(`invalid wall flashing: ${id}`);
    const profile: readonly (readonly [number, number])[] = [
      [0, 0.15],
      [0.003, 0.15],
      [0.003, 0.003],
      [0.12, 0.003],
      [0.12, 0],
      [0, 0],
    ];
    const builder = new MeshParts();
    this.fold(
      builder,
      profile,
      length,
      "roof-flashing",
      "roof-flashing",
      "roof-flashing",
      [
        [profile[0]!, profile[1]!, profile[2]!],
        [profile[0]!, profile[2]!, profile[5]!],
        [profile[2]!, profile[3]!, profile[4]!],
        [profile[2]!, profile[4]!, profile[5]!],
      ],
    );
    return builder.result(id);
  }

  /** Extrude one thin folded profile along its shared-edge direction. */
  private fold(
    builder: MeshParts,
    profile: readonly (readonly [number, number])[],
    length: number,
    front: FaceId,
    back: FaceId,
    cut: FaceId,
    endSections?: readonly (readonly (readonly [number, number])[])[],
  ): void {
    let perimeter = 0;
    const signedArea = profile.reduce((sum, a, i) => {
      const b = profile[(i + 1) % profile.length]!;
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0);
    const orientation = signedArea > 0 ? 1 : -1;
    for (let i = 0; i < profile.length; i++) {
      const a = profile[i]!,
        b = profile[(i + 1) % profile.length]!;
      const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const base = perimeter;
      const role = i < 2 ? front : i >= 3 && i < 5 ? back : cut;
      const ridgeFold = i < 2 ? profile[1]! : profile[4]!;
      builder.face(
        `fold-${i}`,
        role,
        [
          [0, a[0], a[1]],
          [length, a[0], a[1]],
          [length, b[0], b[1]],
          [0, b[0], b[1]],
        ],
        [0, orientation * (b[1] - a[1]), orientation * (a[0] - b[0])],
        (p) => [
          p[0],
          front === "shingle-face" && (i < 2 || i === 3 || i === 4)
            ? Math.hypot(p[1] - ridgeFold[0], p[2] - ridgeFold[1])
            : base + Math.hypot(p[1] - a[0], p[2] - a[1]),
        ],
      );
      perimeter += span;
    }
    // Each half-wing is a convex end quad; the shared fold edge is only a seam.
    const sections = endSections ?? [
      [profile[0]!, profile[1]!, profile[4]!, profile[5]!],
      [profile[1]!, profile[2]!, profile[3]!, profile[4]!],
    ];
    for (const [x, direction] of [
      [0, -1],
      [length, 1],
    ] as const)
      for (let k = 0; k < sections.length; k++)
        builder.face(
          `end-${x === 0 ? "left" : "right"}-${k}`,
          cut,
          sections[k]!.map(([y, z]) => [x, y, z] as const),
          [direction, 0, 0],
          (p) => [p[1], p[2]],
        );
  }
}
