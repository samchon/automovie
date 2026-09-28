/**
 * One variable-length lap-siding board from docs/models/15-outdoor.md.
 * The wall datum and course membership come from instances; this source owns
 * only the board's local Y-up metre section and independently bound faces.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type FaceId =
  | "siding-face"
  | "siding-butt"
  | "siding-back"
  | "siding-top"
  | "siding-cut";
type Point = readonly [number, number, number];
type Result = {
  model: IAutoMovieModel;
  faceByPart: Readonly<Record<string, FaceId>>;
};

const faceMesh = (
  corners: readonly Point[],
  outward: Point,
  uv: (point: Point) => readonly [number, number],
): IAutoMovieMesh => {
  const a = corners[0]!,
    b = corners[1]!,
    c = corners[2]!;
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cross = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];
  const ordered =
    cross[0] * outward[0] + cross[1] * outward[1] + cross[2] * outward[2] > 0
      ? corners
      : [...corners].reverse();
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let i = 1; i < ordered.length - 1; i++) {
    const triangle = [ordered[0]!, ordered[i]!, ordered[i + 1]!];
    const p = triangle[0]!,
      q = triangle[1]!,
      r = triangle[2]!;
    const pq = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const pr = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const n = [
      pq[1] * pr[2] - pq[2] * pr[1],
      pq[2] * pr[0] - pq[0] * pr[2],
      pq[0] * pr[1] - pq[1] * pr[0],
    ];
    const size = Math.hypot(...n);
    if (size === 0) throw new Error("degenerate siding face");
    const offset = positions.length / 3;
    for (const vertex of triangle) {
      positions.push(...vertex);
      normals.push(...n.map((component) => component / size));
      uvs.push(...uv(vertex));
    }
    indices.push(offset, offset + 1, offset + 2);
  }
  return { positions, normals, uvs, indices, skin: null };
};

/** One closed wedge board whose parts partition its six physical faces.
 */
export class Siding {
  /** Build around the lower back-edge centre; +Z points away from the wall. */
  public build(input: {
    id: string;
    length: number;
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
  }): Result {
    const { id, length } = input;
    if (!id || !Number.isFinite(length) || length <= 0)
      throw new Error(`invalid siding length: ${id}`);
    const yl = input.topLeft ?? 0.18,
      yr = input.topRight ?? 0.18;
    const bl = input.bottomLeft ?? 0,
      br = input.bottomRight ?? 0;
    if (
      ![yl, yr, bl, br].every(Number.isFinite) ||
      bl < 0 ||
      br < 0 ||
      yl > 0.18 ||
      yr > 0.18 ||
      bl >= yl ||
      br >= yr
    )
      throw new Error(`invalid siding cut: ${id}`);
    const x0 = -length / 2,
      x1 = length / 2;
    const z0 = 0;
    const front = (y: number): number => 0.018 - (0.012 * y) / 0.18;
    const entries: readonly [
      string,
      FaceId,
      readonly Point[],
      Point,
      (p: Point) => readonly [number, number],
    ][] = [
      [
        "face",
        "siding-face",
        [
          [x0, bl, front(bl)],
          [x1, br, front(br)],
          [x1, yr, front(yr)],
          [x0, yl, front(yl)],
        ],
        [0, 0.012, 0.18],
        (p) => [p[0] - x0, p[1]],
      ],
      [
        "butt",
        "siding-butt",
        [
          [x0, bl, z0],
          [x1, br, z0],
          [x1, br, front(br)],
          [x0, bl, front(bl)],
        ],
        [0, -1, 0],
        (p) => [p[0] - x0, p[2]],
      ],
      [
        "back",
        "siding-back",
        [
          [x0, bl, z0],
          [x0, yl, z0],
          [x1, yr, z0],
          [x1, br, z0],
        ],
        [0, 0, -1],
        (p) => [p[0] - x0, p[1]],
      ],
      [
        "top",
        "siding-top",
        [
          [x0, yl, z0],
          [x0, yl, front(yl)],
          [x1, yr, front(yr)],
          [x1, yr, z0],
        ],
        [0, 1, 0],
        (p) => [p[0] - x0, p[2]],
      ],
      [
        "left-cut",
        "siding-cut",
        [
          [x0, bl, z0],
          [x0, bl, front(bl)],
          [x0, yl, front(yl)],
          [x0, yl, z0],
        ],
        [-1, 0, 0],
        (p) => [p[1], p[2]],
      ],
      [
        "right-cut",
        "siding-cut",
        [
          [x1, br, z0],
          [x1, yr, z0],
          [x1, yr, front(yr)],
          [x1, br, front(br)],
        ],
        [1, 0, 0],
        (p) => [p[1], p[2]],
      ],
    ];
    const parts: IAutoMovieModelPart[] = entries.map(
      ([name, , corners, outward, uv]) => ({
        id: name,
        name,
        geometry: { type: "mesh", mesh: faceMesh(corners, outward, uv) },
        material: null,
        attachedBone: null,
        transform: null,
      }),
    );
    const faceByPart = Object.fromEntries(
      entries.map(([name, face]) => [name, face]),
    ) as Record<string, FaceId>;
    const model: IAutoMovieModel = {
      id: `siding:${id}`,
      name: id,
      origin: "generated",
      parts,
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return { model, faceByPart };
  }
}
