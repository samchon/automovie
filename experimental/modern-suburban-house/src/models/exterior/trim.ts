/**
 * One exposed exterior L-corner trim run from docs/models/15-outdoor.md.
 * The caller supplies the actual corner run height and world placement; this
 * source owns only the local outward X/Z section and its metric face mapping.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

type Point = readonly [number, number, number];
type Point2 = readonly [number, number];

const profile: readonly Point2[] = [
  [-0.035, -0.035],
  [0.075, -0.035],
  [0.075, 0],
  [0, 0],
  [0, 0.075],
  [-0.035, 0.075],
];

/** A single L-section member whose broad faces and exposed ends share one id.
 */
export class ExteriorCornerTrim {
  /** The origin is the lower intersection of the two structural outer planes. */
  public build(input: { id: string; height: number }): {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, "exterior-trim">>;
  } {
    const { id, height } = input;
    if (!id || !Number.isFinite(height) || height <= 0)
      throw new Error(`invalid exterior trim height: ${id}`);
    const mesh: IAutoMovieMesh = {
      positions: [],
      normals: [],
      uvs: [],
      indices: [],
      skin: null,
    };
    const add = (
      corners: readonly Point[],
      outward: Point,
      uv: (p: Point) => readonly [number, number],
    ): void => {
      const a = corners[0]!,
        b = corners[1]!,
        c = corners[2]!;
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
      const ordered =
        n[0] * outward[0] + n[1] * outward[1] + n[2] * outward[2] > 0
          ? corners
          : [...corners].reverse();
      const scale = Math.hypot(...outward);
      const normal = outward.map((v) => v / scale);
      const start = mesh.positions.length / 3;
      for (const p of ordered) {
        mesh.positions.push(...p);
        mesh.normals!.push(...normal);
        mesh.uvs!.push(...uv(p));
      }
      for (let i = 1; i < ordered.length - 1; i++)
        mesh.indices!.push(start, start + i, start + i + 1);
    };
    for (let i = 0; i < profile.length; i++) {
      const a = profile[i]!,
        b = profile[(i + 1) % profile.length]!;
      add(
        [
          [a[0], 0, a[1]],
          [b[0], 0, b[1]],
          [b[0], height, b[1]],
          [a[0], height, a[1]],
        ],
        [b[1] - a[1], 0, a[0] - b[0]],
        (p) => [p[1], Math.hypot(p[0] - a[0], p[2] - a[1])],
      );
    }
    // Triangles use the exact six contour corners, leaving no T-junction at the concave bend.
    const endTriangles: readonly (readonly Point2[])[] = [
      [profile[0]!, profile[1]!, profile[2]!],
      [profile[0]!, profile[2]!, profile[3]!],
      [profile[0]!, profile[3]!, profile[5]!],
      [profile[3]!, profile[4]!, profile[5]!],
    ];
    for (const section of endTriangles)
      for (const [y, direction] of [
        [0, -1],
        [height, 1],
      ] as const)
        add(
          section.map(([x, z]) => [x, y, z] as const),
          [0, direction, 0],
          (p) => [p[0] + 0.035, p[2] + 0.035],
        );
    const model: IAutoMovieModel = {
      id: `exterior-trim:${id}`,
      name: id,
      origin: "generated",
      parts: [
        {
          id: "exterior-trim",
          name: "exterior-trim",
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
    return { model, faceByPart: { "exterior-trim": "exterior-trim" } };
  }
}
