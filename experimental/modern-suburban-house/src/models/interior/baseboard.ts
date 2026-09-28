/**
 * Room-wall baseboard prototype from docs/models/06-interior-trim.md. Instances
 * supply each exposed wall-run length and placement; this source owns only its
 * closed 0.10 m high pentagonal section and square or 45-degree end cuts.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

type Vec = readonly [number, number, number];
type Miter = -1 | 0 | 1;
type Spec = {
  id: string;
  length: number;
  startMiter?: Miter;
  endMiter?: Miter;
};
const SECTION = [
  [0, 0],
  [0.1, 0],
  [0.1, 0.005],
  [0.09, 0.015],
  [0, 0.015],
] as const;

const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** One immutable-length run with every triangle in the wall-baseboard face. */
export class Baseboard {
  /** Sweep the reviewed section along local +X, retaining metric planar UVs. */
  public build(spec: Spec): {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, "wall-baseboard">>;
  } {
    const { id, length, startMiter = 0, endMiter = 0 } = spec;
    if (
      !id ||
      !Number.isFinite(length) ||
      length <= 0 ||
      length <= Math.max(0, (startMiter - endMiter) * 0.015)
    )
      throw new Error(`invalid baseboard run: ${id}`);
    const start = SECTION.map(([y, z]): Vec => [startMiter * z, y, z]);
    const end = SECTION.map(([y, z]): Vec => [length + endMiter * z, y, z]);
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const triangle = (
      a: Vec,
      b: Vec,
      c: Vec,
      uvA: readonly [number, number],
      uvB: readonly [number, number],
      uvC: readonly [number, number],
    ): void => {
      const ab: Vec = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac: Vec = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = cross(ab, ac);
      const size = Math.hypot(...n);
      const offset = positions.length / 3;
      for (const [p, uv] of [
        [a, uvA],
        [b, uvB],
        [c, uvC],
      ] as const) {
        positions.push(...p);
        normals.push(n[0] / size, n[1] / size, n[2] / size);
        uvs.push(...uv);
      }
      indices.push(offset, offset + 1, offset + 2);
    };
    // Perimeter strips are split into triangles so opposite miter slopes still
    // give correct flat normals on the sloping upper face.
    for (let i = 0; i < SECTION.length; i++) {
      const j = (i + 1) % SECTION.length;
      const [y0, z0] = SECTION[i]!;
      const [y1, z1] = SECTION[j]!;
      const edge = Math.hypot(y1 - y0, z1 - z0);
      triangle(
        start[i]!,
        start[j]!,
        end[j]!,
        [0, 0],
        [0, edge],
        [length, edge],
      );
      triangle(
        start[i]!,
        end[j]!,
        end[i]!,
        [0, 0],
        [length, edge],
        [length, 0],
      );
    }
    // The profile winds toward +X; each cap is a three-triangle convex fan.
    for (let i = 1; i < SECTION.length - 1; i++) {
      const a: readonly [number, number] = [SECTION[0]![1], SECTION[0]![0]];
      const b: readonly [number, number] = [SECTION[i]![1], SECTION[i]![0]];
      const c: readonly [number, number] = [
        SECTION[i + 1]![1],
        SECTION[i + 1]![0],
      ];
      triangle(end[0]!, end[i]!, end[i + 1]!, a, b, c);
      triangle(start[0]!, start[i + 1]!, start[i]!, a, c, b);
    }
    const mesh: IAutoMovieMesh = {
      positions,
      normals,
      uvs,
      indices,
      skin: null,
    };
    const model: IAutoMovieModel = {
      id: `baseboard:${id}`,
      name: id,
      origin: "generated",
      parts: [
        {
          id: "run",
          name: "run",
          geometry: { type: "mesh", mesh },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ],
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return { model, faceByPart: { run: "wall-baseboard" } };
  }
}
