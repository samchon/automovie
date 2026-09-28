/**
 * Three closed stair side-finish plates from docs/models/04-stair-members.md.
 * Treads and room boundaries stay in spaces; these plates occupy only the
 * outward 0.015 m bands and end at the ground-floor ceiling underside.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Vec = readonly [number, number, number];

const subtract = (a: Vec, b: Vec): Vec => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec): number => Math.hypot(a[0], a[1], a[2]);

/** A quadrilateral side swept through its 0.015 m exterior thickness. */
const plateMesh = (
  front: readonly [Vec, Vec, Vec, Vec],
  thickness: Vec,
): IAutoMovieMesh => {
  const back = front.map(
    (p): Vec => [p[0] + thickness[0], p[1] + thickness[1], p[2] + thickness[2]],
  );
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const addFace = (
    points: readonly Vec[],
    uv: readonly (readonly [number, number])[],
  ): void => {
    const n = cross(
      subtract(points[1]!, points[0]!),
      subtract(points[2]!, points[0]!),
    );
    const size = length(n);
    const start = positions.length / 3;
    for (let i = 0; i < 4; i++) {
      positions.push(...points[i]!);
      normals.push(n[0] / size, n[1] / size, n[2] / size);
      uvs.push(...uv[i]!);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  const run = length(subtract(front[1], front[0]));
  const rise = length(subtract(front[3], front[0]));
  const thick = length(thickness);
  addFace(front, [
    [0, 0],
    [run, 0],
    [run, rise],
    [0, rise],
  ]);
  addFace(
    [back[3]!, back[2]!, back[1]!, back[0]!],
    [
      [0, rise],
      [run, rise],
      [run, 0],
      [0, 0],
    ],
  );
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const edge = length(subtract(front[j], front[i]));
    addFace(
      [front[j], front[i], back[i]!, back[j]!],
      [
        [edge, 0],
        [0, 0],
        [0, thick],
        [edge, thick],
      ],
    );
  }
  return { positions, normals, uvs, indices, skin: null };
};

/** The two sloped white runs and their non-overlapping landing corner. */
export class StairSkirt {
  /** Emit the three stair-skirt parts at their reviewed stair-space interfaces. */
  public build(): {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, "stair-skirt">>;
  } {
    const lowerEnd = (0.17 * (3.395 - 1.45)) / 0.28;
    const upperStart = 1.36 + (0.17 * 0.015) / 0.28;
    const ceilingX = -0.65 + ((2.75 - 1.46) * 0.28) / 0.17;
    const lower: readonly [Vec, Vec, Vec, Vec] = [
      [-0.635, 0, -1.45],
      [-0.635, lowerEnd, -3.395],
      [-0.635, lowerEnd + 0.1, -3.395],
      [-0.635, 0.1, -1.45],
    ];
    const upper: readonly [Vec, Vec, Vec, Vec] = [
      [-0.635, upperStart, -3.395],
      [ceilingX, 2.65, -3.395],
      [ceilingX, 2.75, -3.395],
      [-0.635, upperStart + 0.1, -3.395],
    ];
    const corner: readonly [Vec, Vec, Vec, Vec] = [
      [-0.65, lowerEnd, -3.395],
      [-0.635, lowerEnd, -3.395],
      [-0.635, upperStart + 0.1, -3.395],
      [-0.65, upperStart + 0.1, -3.395],
    ];
    const members = [
      ["lower-skirt", lower, [-0.015, 0, 0]],
      ["upper-skirt", upper, [0, 0, -0.015]],
      ["landing-corner-skirt", corner, [0, 0, -0.015]],
    ] as const;
    const parts: IAutoMovieModelPart[] = members.map(
      ([id, profile, depth]) => ({
        id,
        name: id,
        geometry: { type: "mesh", mesh: plateMesh(profile, depth) },
        material: null,
        attachedBone: null,
        transform: null,
      }),
    );
    const model: IAutoMovieModel = {
      id: "stair-skirt",
      name: "stair-skirt",
      origin: "generated",
      parts,
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return {
      model,
      faceByPart: {
        "lower-skirt": "stair-skirt",
        "upper-skirt": "stair-skirt",
        "landing-corner-skirt": "stair-skirt",
      },
    };
  }
}
