/**
 * Open eave gutter and hollow downspout from docs/models/15-outdoor.md.
 * The caller gives a roof-edge length, eave-to-grade height, and wall datum in
 * the local Y-up frame. Roof, fascia, wall, openings and world placement stay
 * with their structural and instance owners.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type Point = readonly [number, number, number];
type Point2 = readonly [number, number];
type FaceId = "gutter" | "downspout";
type Result = {
  model: IAutoMovieModel;
  faceByPart: Readonly<Record<string, FaceId>>;
  outlet: "left" | "right";
};

const emptyMesh = (): IAutoMovieMesh => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
  skin: null,
});

const quad = (
  mesh: IAutoMovieMesh,
  points: readonly Point[],
  outward: Point,
  uv: readonly (readonly [number, number])[],
): void => {
  const a = points[0]!,
    b = points[1]!,
    c = points[2]!;
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];
  const forward = n[0] * outward[0] + n[1] * outward[1] + n[2] * outward[2] > 0;
  const ordered = forward ? points : [...points].reverse();
  const orderedUv = forward ? uv : [...uv].reverse();
  const size = Math.hypot(...outward);
  if (size <= 1e-12) throw new Error("degenerate drainage face");
  const normal = outward.map((v) => v / size);
  const start = mesh.positions.length / 3;
  for (let i = 0; i < ordered.length; i++) {
    mesh.positions.push(...ordered[i]!);
    mesh.normals!.push(...normal);
    mesh.uvs!.push(...orderedUv[i]!);
  }
  mesh.indices!.push(start, start + 1, start + 2, start, start + 2, start + 3);
};

const part = (id: FaceId, mesh: IAutoMovieMesh): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry: { type: "mesh", mesh },
  material: null,
  attachedBone: null,
  transform: null,
});

/** An open U-channel with a four-segment quarter-bend tube at one end.
 */
export class EaveDrainage {
  /** A continuous roof-edge channel when no grounded pipe route is available. */
  public buildGutter(input: { id: string; length: number }): {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, "gutter">>;
  } {
    const { id, length } = input;
    if (!id || !Number.isFinite(length) || length <= 0)
      throw new Error(`invalid eave gutter length: ${id}`);
    const model: IAutoMovieModel = {
      id: `gutter:${id}`,
      name: id,
      origin: "generated",
      parts: [part("gutter", this.gutter(length))],
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return { model, faceByPart: { gutter: "gutter" } };
  }

  /** Gutter origin is the roof drip-edge start, +X follows that edge. */
  public build(input: {
    id: string;
    length: number;
    eaveToGround: number;
    wallDepth: number;
    rightClearance: number;
    leftClearance: number;
    rightInset?: number;
    leftInset?: number;
  }): Result {
    const {
      id,
      length,
      eaveToGround,
      wallDepth,
      rightClearance,
      leftClearance,
    } = input;
    const rightInset = input.rightInset ?? 0.08,
      leftInset = input.leftInset ?? 0.08;
    if (
      !id ||
      ![length, eaveToGround, wallDepth, rightClearance, leftClearance].every(
        Number.isFinite,
      ) ||
      ![rightInset, leftInset].every(
        (v) => Number.isFinite(v) && v >= 0.08 && v <= length - 0.08,
      ) ||
      length <= 0.16 ||
      eaveToGround <= 0.405 ||
      rightClearance < 0 ||
      leftClearance < 0
    )
      throw new Error(`invalid eave drainage bounds: ${id}`);
    const outlet: "left" | "right" =
      rightClearance >= 0.15
        ? "right"
        : leftClearance >= 0.15
          ? "left"
          : (() => {
              throw new Error(`no clear downspout end: ${id}`);
            })();
    const centerX = outlet === "right" ? length - rightInset : leftInset;
    const wallCenter = wallDepth + 0.05;
    if (0.09 - wallCenter < 0.2 - 1e-9)
      throw new Error(`no 0.20 m elbow depth: ${id}`);
    const gutter = this.gutter(length, centerX);
    const downspout = this.downspout(centerX, eaveToGround, wallCenter);
    const parts = [part("gutter", gutter), part("downspout", downspout)];
    const model: IAutoMovieModel = {
      id: `drainage:${id}`,
      name: id,
      origin: "generated",
      parts,
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return {
      model,
      faceByPart: { gutter: "gutter", downspout: "downspout" },
      outlet,
    };
  }

  private gutter(length: number, centerX?: number): IAutoMovieMesh {
    const mesh = emptyMesh();
    // Open top. 0.003 m shell; inner width 0.12 m and inner depth 0.08 m.
    const profile: readonly Point2[] = [
      [-0.025, 0.027],
      [-0.025, 0.03],
      [-0.105, 0.03],
      [-0.105, 0.15],
      [-0.025, 0.15],
      [-0.025, 0.153],
      [-0.108, 0.153],
      [-0.108, 0.027],
    ];
    const area = profile.reduce((sum, a, i) => {
      const b = profile[(i + 1) % profile.length]!;
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0);
    const orientation = area > 0 ? 1 : -1;
    const lengths = centerX === undefined
      ? [0, length]
      : [0, centerX - 0.04, centerX + 0.04, length];
    let perimeter = 0;
    for (let i = 0; i < profile.length; i++) {
      const a = profile[i]!,
        b = profile[(i + 1) % profile.length]!;
      const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (centerX === undefined || (i !== 2 && i !== 6))
        for(let segment=0;segment<lengths.length-1;segment++) {
          const xa=lengths[segment]!,xb=lengths[segment+1]!;
          if(xb-xa<=1e-10) continue;
          quad(
          mesh,
          [
            [xa, a[0], a[1]],
            [xb, a[0], a[1]],
            [xb, b[0], b[1]],
            [xa, b[0], b[1]],
          ],
          [0, orientation * (b[1] - a[1]), orientation * (a[0] - b[0])],
          [
            [xa, perimeter],
            [xb, perimeter],
            [xb, perimeter + span],
            [xa, perimeter + span],
          ],
        );
        }
      perimeter += span;
    }
    // A grounded pipe creates an actual aperture through the gutter floor.
    if (centerX !== undefined) {
      const x0 = centerX - 0.04,
        x1 = centerX + 0.04;
      for (const [y, z0, z1, normal] of [
        [-0.105, 0.03, 0.15, 1],
        [-0.108, 0.027, 0.153, -1],
      ] as const) {
        const bands: readonly (readonly [number, number, number, number])[] = [
          [0, x0, z0, 0.06],
          [0, x0, 0.06, 0.12],
          [0, x0, 0.12, z1],
          [x0, x1, z0, 0.06],
          [x0, x1, 0.12, z1],
          [x1, length, z0, 0.06],
          [x1, length, 0.06, 0.12],
          [x1, length, 0.12, z1],
        ];
        for (const [xa, xb, za, zb] of bands)
          if (xb - xa > 1e-10 && zb - za > 1e-10)
            quad(
              mesh,
              [
                [xa, y, za],
                [xb, y, za],
                [xb, y, zb],
                [xa, y, zb],
              ],
              [0, normal, 0],
              [
                [xa, za],
                [xb, za],
                [xb, zb],
                [xa, zb],
              ],
            );
      }
      for (const [z, sign] of [
        [0.06, 1],
        [0.12, -1],
      ] as const)
        quad(
          mesh,
          [
            [x0, -0.108, z],
            [x1, -0.108, z],
            [x1, -0.105, z],
            [x0, -0.105, z],
          ],
          [0, 0, sign],
          [
            [x0, 0],
            [x1, 0],
            [x1, 0.003],
            [x0, 0.003],
          ],
        );
      for (const [x, sign] of [
        [x0, 1],
        [x1, -1],
      ] as const)
        if (x > 1e-10 && x < length - 1e-10)
          quad(
            mesh,
            [
              [x, -0.108, 0.06],
              [x, -0.108, 0.12],
              [x, -0.105, 0.12],
              [x, -0.105, 0.06],
            ],
            [sign, 0, 0],
            [
              [0, 0],
              [0.06, 0],
              [0.06, 0.003],
              [0, 0.003],
            ],
          );
    }
    {
      const remaining = profile.map((_, index) => index);
      const triangles: number[][] = [];
      const turn = (a: Point2, b: Point2, c: Point2): number =>
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      while (remaining.length > 3) {
        let found = false;
        for (let index = 0; index < remaining.length; index++) {
          const previous =
            remaining[(index + remaining.length - 1) % remaining.length]!;
          const current = remaining[index]!;
          const next = remaining[(index + 1) % remaining.length]!;
          const a = profile[previous]!,
            b = profile[current]!,
            c = profile[next]!;
          if (turn(a, b, c) * orientation <= 1e-12) continue;
          const inside = remaining.some(
            (candidate) =>
              candidate !== previous &&
              candidate !== current &&
              candidate !== next &&
              turn(a, b, profile[candidate]!) * orientation >= -1e-12 &&
              turn(b, c, profile[candidate]!) * orientation >= -1e-12 &&
              turn(c, a, profile[candidate]!) * orientation >= -1e-12,
          );
          if (inside) continue;
          triangles.push([previous, current, next]);
          remaining.splice(index, 1);
          found = true;
          break;
        }
        if (!found)
          throw new Error("gutter end section cannot be triangulated");
      }
      triangles.push(remaining);
      const capProfile: Point2[] = [...profile];
      const splitEdge = (a: number, b: number): void => {
        const first = capProfile.length;
        capProfile.push([profile[a]![0], 0.06], [profile[a]![0], 0.12]);
        const additions: number[][] = [];
        for (let index = 0; index < triangles.length; index++) {
          const triangle = triangles[index]!;
          const edge = triangle.findIndex(
            (vertex, corner) =>
              (vertex === a && triangle[(corner + 1) % 3] === b) ||
              (vertex === b && triangle[(corner + 1) % 3] === a),
          );
          if (edge < 0) continue;
          const start = triangle[edge]!;
          const end = triangle[(edge + 1) % 3]!;
          const opposite = triangle[(edge + 2) % 3]!;
          const near = profile[start]![1] < profile[end]![1] ? first : first + 1;
          const far = near === first ? first + 1 : first;
          triangles.splice(index, 1);
          additions.push(
            [start, near, opposite],
            [near, far, opposite],
            [far, end, opposite],
          );
          break;
        }
        triangles.push(...additions);
      };
      // Only the outlet variant subdivides its floor. The bare channel has
      // uninterrupted side faces, so extra cap vertices would make T-joints.
      if (centerX !== undefined) {
        splitEdge(2, 3);
        splitEdge(6, 7);
      }
      for (const [x, direction] of [
        [0, -1],
        [length, 1],
      ] as const)
        for (const triangle of triangles) {
          const ordered =
            direction * orientation > 0 ? triangle : [...triangle].reverse();
          const offset = mesh.positions.length / 3;
          for (const index of ordered) {
            const [y, z] = capProfile[index]!;
            mesh.positions.push(x, y, z);
            mesh.normals!.push(direction, 0, 0);
            mesh.uvs!.push(z - 0.027, y + 0.108);
          }
          mesh.indices!.push(offset, offset + 1, offset + 2);
        }
    }
    return mesh;
  }

  private downspout(
    centerX: number,
    eaveToGround: number,
    wallCenter: number,
  ): IAutoMovieMesh {
    const mesh = emptyMesh(),
      r = 0.1,
      startZ = 0.09,
      startY = -0.105;
    const path: Point2[] = []; // [Y,Z], beginning at the gutter outlet.
    for (let j = 0; j <= 4; j++) {
      const angle = (-j * Math.PI) / 8;
      path.push([
        startY + r * Math.sin(angle),
        startZ - r + r * Math.cos(angle),
      ]);
    }
    const secondStartZ = wallCenter + r;
    if (Math.abs(secondStartZ - path[path.length - 1]![1]) > 1e-9)
      path.push([startY - r, secondStartZ]);
    for (let j = 1; j <= 4; j++) {
      const angle = Math.PI / 2 + (j * Math.PI) / 8;
      path.push([
        startY - 2 * r + r * Math.sin(angle),
        wallCenter + r + r * Math.cos(angle),
      ]);
    }
    path.push([-eaveToGround + 0.1, wallCenter]);
    const distance: number[] = [0];
    for (let i = 1; i < path.length; i++)
      distance.push(
        distance[i - 1]! +
          Math.hypot(
            path[i]![0] - path[i - 1]![0],
            path[i]![1] - path[i - 1]![1],
          ),
      );
    const ring = (index: number, hx: number, hd: number): readonly Point[] => {
      const here = path[index]!,
        before = path[Math.max(0, index - 1)]!,
        after = path[Math.min(path.length - 1, index + 1)]!;
      const ty = after[0] - before[0],
        tz = after[1] - before[1],
        size = Math.hypot(ty, tz);
      const lateralY = tz / size,
        lateralZ = -ty / size;
      return [
        [centerX - hx, here[0] - hd * lateralY, here[1] - hd * lateralZ],
        [centerX + hx, here[0] - hd * lateralY, here[1] - hd * lateralZ],
        [centerX + hx, here[0] + hd * lateralY, here[1] + hd * lateralZ],
        [centerX - hx, here[0] + hd * lateralY, here[1] + hd * lateralZ],
      ];
    };
    const outer = path.map((_, i) => ring(i, 0.04, 0.03));
    const inner = path.map((_, i) => ring(i, 0.037, 0.027));
    const perimeter = [0, 0.08, 0.14, 0.22, 0.28];
    for (let i = 0; i < path.length - 1; i++)
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4;
        for (const [shell, inside] of [
          [outer, false],
          [inner, true],
        ] as const) {
          const a = shell[i]![edge]!,
            b = shell[i + 1]![edge]!,
            c = shell[i + 1]![next]!,
            d = shell[i]![next]!;
          const center = [
            centerX,
            (path[i]![0] + path[i + 1]![0]) / 2,
            (path[i]![1] + path[i + 1]![1]) / 2,
          ];
          const radial: Point = [
            (a[0] + d[0]) / 2 - center[0],
            (a[1] + d[1]) / 2 - center[1],
            (a[2] + d[2]) / 2 - center[2],
          ];
          const sign = inside ? -1 : 1;
          quad(
            mesh,
            [a, b, c, d],
            [sign * radial[0], sign * radial[1], sign * radial[2]],
            [
              [distance[i]!, perimeter[edge]!],
              [distance[i + 1]!, perimeter[edge]!],
              [distance[i + 1]!, perimeter[edge + 1]!],
              [distance[i]!, perimeter[edge + 1]!],
            ],
          );
        }
      }
    for (const index of [0, path.length - 1]) {
      const before = path[Math.max(0, index - 1)]!,
        after = path[Math.min(path.length - 1, index + 1)]!;
      const sign = index === 0 ? -1 : 1,
        ty = after[0] - before[0],
        tz = after[1] - before[1];
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4;
        quad(
          mesh,
          [
            outer[index]![edge]!,
            outer[index]![next]!,
            inner[index]![next]!,
            inner[index]![edge]!,
          ],
          [0, sign * ty, sign * tz],
          [
            [perimeter[edge]!, 0],
            [perimeter[edge + 1]!, 0],
            [perimeter[edge + 1]!, 0.003],
            [perimeter[edge]!, 0.003],
          ],
        );
      }
    }
    return mesh;
  }
}
