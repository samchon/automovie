import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Projection of face-plane points onto the head skin along the line of
 * sight: the frontmost crossing, with the skin's interpolated normal.
 */
export class AutoMovieHumanBrowProjector {
  /** Borrow the factory's generated triangle index and its calibration-mm face frame. */
  private constructor(
    private readonly triangles: Float64Array,
    private readonly grid: Map<number, number[]>,
    private readonly g: AutoMovieHumanEyelid.IGlobe,
    private readonly origin: AutoMovieHumanEyelid.Point,
    private readonly temple: AutoMovieHumanEyelid.Point,
  ) {}

  /** Cell size of the face-plane index, mm. */
  private static readonly CELL: number = 2;

  /**
   * Index the head skin triangles near the brow.
   *
   * @returns The projector, or null without head skin
   */
  public static create(
    parts: readonly IAutoMovieModelPart[],
    scale: number,
    g: AutoMovieHumanEyelid.IGlobe,
    origin: AutoMovieHumanEyelid.Point,
    temple: AutoMovieHumanEyelid.Point,
  ): AutoMovieHumanBrowProjector | null {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const data: number[] = [];
    const grid: Map<number, number[]> = new Map();
    for (const part of parts) {
      if (
        !AutoMovieHumanHeadField.owns(part.id) ||
        part.geometry.type !== "mesh"
      )
        continue;
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      const p: number[] = mesh.positions;
      const nrm: number[] | null = mesh.normals;
      const index: number[] | null = mesh.indices;
      const count: number = index === null ? p.length / 3 : index.length;
      for (let t: number = 0; t < count; t += 3) {
        const corners: number[] = [0, 1, 2].map((k: number): number =>
          index === null ? t + k : index[t + k]!,
        );
        const pts: AutoMovieHumanEyelid.Point[] = corners.map(
          (v: number): AutoMovieHumanEyelid.Point => [
            p[3 * v]! / scale,
            p[3 * v + 1]! / scale,
            p[3 * v + 2]! / scale,
          ],
        );
        const plane: [number, number][] = pts.map(
          (q: AutoMovieHumanEyelid.Point): [number, number] => [
            E.dot(E.sub(q, origin), temple),
            E.dot(E.sub(q, origin), g.up),
          ],
        );
        const lo: [number, number] = [
          Math.min(...plane.map((q: [number, number]): number => q[0])),
          Math.min(...plane.map((q: [number, number]): number => q[1])),
        ];
        const hi: [number, number] = [
          Math.max(...plane.map((q: [number, number]): number => q[0])),
          Math.max(...plane.map((q: [number, number]): number => q[1])),
        ];
        if (hi[0] < -15 || lo[0] > 60 || hi[1] < 5 || lo[1] > 45) continue;
        const id: number = data.length / 18;
        for (let k: number = 0; k < 3; k++) {
          data.push(...pts[k]!);
          const v: number = corners[k]!;
          const n: AutoMovieHumanEyelid.Point =
            nrm === null
              ? [0, 0, 0]
              : [nrm[3 * v]!, nrm[3 * v + 1]!, nrm[3 * v + 2]!];
          data.push(...n);
        }
        for (
          let i: number = Math.floor(lo[0] / AutoMovieHumanBrowProjector.CELL);
          i <= Math.floor(hi[0] / AutoMovieHumanBrowProjector.CELL);
          i++
        )
          for (
            let j: number = Math.floor(
              lo[1] / AutoMovieHumanBrowProjector.CELL,
            );
            j <= Math.floor(hi[1] / AutoMovieHumanBrowProjector.CELL);
            j++
          ) {
            const key: number = i * 4096 + j;
            const list: number[] = grid.get(key) ?? [];
            list.push(id);
            grid.set(key, list);
          }
      }
    }
    if (data.length === 0) return null;
    return new AutoMovieHumanBrowProjector(
      Float64Array.from(data),
      grid,
      g,
      origin,
      temple,
    );
  }

  /**
   * Frontmost skin crossing of the line of sight through a face-plane
   * point.
   *
   * @param a Distance toward the temple from the origin, mm
   * @param h Height above the origin, mm
   * @returns Point and unit normal, or null where no skin lies
   */
  public project(
    a: number,
    h: number,
  ): {
    point: AutoMovieHumanEyelid.Point;
    normal: AutoMovieHumanEyelid.Point;
  } | null {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const list: number[] | undefined = this.grid.get(
      Math.floor(a / AutoMovieHumanBrowProjector.CELL) * 4096 +
        Math.floor(h / AutoMovieHumanBrowProjector.CELL),
    );
    if (list === undefined) return null;
    let best: {
      point: AutoMovieHumanEyelid.Point;
      normal: AutoMovieHumanEyelid.Point;
    } | null = null;
    let front: number = -Infinity;
    const d: Float64Array = this.triangles;
    for (const id of list) {
      const o: number = id * 18;
      const P: (k: number) => AutoMovieHumanEyelid.Point = (
        k: number,
      ): AutoMovieHumanEyelid.Point => [
        d[o + 6 * k]!,
        d[o + 6 * k + 1]!,
        d[o + 6 * k + 2]!,
      ];
      const Nn: (k: number) => AutoMovieHumanEyelid.Point = (
        k: number,
      ): AutoMovieHumanEyelid.Point => [
        d[o + 6 * k + 3]!,
        d[o + 6 * k + 4]!,
        d[o + 6 * k + 5]!,
      ];
      const q: [number, number][] = [0, 1, 2].map(
        (k: number): [number, number] => [
          E.dot(E.sub(P(k), this.origin), this.temple),
          E.dot(E.sub(P(k), this.origin), this.g.up),
        ],
      );
      const det: number =
        (q[1]![0] - q[0]![0]) * (q[2]![1] - q[0]![1]) -
        (q[2]![0] - q[0]![0]) * (q[1]![1] - q[0]![1]);
      if (Math.abs(det) < 1e-12) continue;
      const u: number =
        ((a - q[0]![0]) * (q[2]![1] - q[0]![1]) -
          (q[2]![0] - q[0]![0]) * (h - q[0]![1])) /
        det;
      const v: number =
        ((q[1]![0] - q[0]![0]) * (h - q[0]![1]) -
          (a - q[0]![0]) * (q[1]![1] - q[0]![1])) /
        det;
      if (u < -1e-9 || v < -1e-9 || u + v > 1 + 1e-9) continue;
      const point: AutoMovieHumanEyelid.Point = E.add(
        E.add(E.scale(P(0), 1 - u - v), E.scale(P(1), u)),
        E.scale(P(2), v),
      );
      const depth: number = E.dot(point, this.g.forward);
      if (depth <= front) continue;
      front = depth;
      let normal: AutoMovieHumanEyelid.Point = E.normalize(
        E.add(
          E.add(E.scale(Nn(0), 1 - u - v), E.scale(Nn(1), u)),
          E.scale(Nn(2), v),
        ),
      );
      if (E.dot(normal, normal) < 0.5)
        normal = E.normalize(E.cross(E.sub(P(1), P(0)), E.sub(P(2), P(0))));
      if (E.dot(normal, this.g.forward) < 0) normal = E.scale(normal, -1);
      best = { point, normal };
    }
    return best;
  }
}
