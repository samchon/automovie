import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import type { AutoMovieHumanWeightField } from "./AutoMovieHumanWeightField";

/** The generated skin, sampled once for geometric binding measurements. */
export namespace AutoMovieHumanBindingGeometry {
  /** Model-space triple. */
  export type Vector = AutoMovieHumanWeightField.Vector;

  /** Measurements shared by every joint of one immutable body. */
  export interface IGeometry {
    /** Nearest skin sample, metres. */
    depth(point: Vector): number;
    /** Outermost generated section radius in a joint's bone-normal plane. */
    outer(chain: string, point: Vector, axis: Vector): number;

    /** Sampled segment envelope, including intersections with its endpoint planes. */
    envelope(chain: string, from: Vector, to: Vector): number;
  }

  /** Prepare shared rings without retaining a body in any global cache. */
  export function prepare(body: IAutoMovieHumanBodyCalibration, scale: number): IGeometry {
    const phases: number[] = Array.from({ length: 48 }, (_: unknown, i: number): number => 2 * Math.PI * i / 48);
    const rings: Map<string, Vector[][]> = new Map(body.chains.map((chain): [string, Vector[][]] => [
      chain.name,
      chain.layers.map((layer): Vector[] => AutoMovieHumanLoftChain.ring(chain, layer.y, phases)
        .map((point: Vector): Vector => [point[0] * scale, point[1] * scale, point[2] * scale])),
    ]));
    const points: Vector[] = [...rings.values()].flat(2);
    return {
      depth(point: Vector): number {
        let squared: number = Infinity;
        for (const p of points)
          squared = Math.min(squared, (p[0] - point[0]) ** 2 + (p[1] - point[1]) ** 2 + (p[2] - point[2]) ** 2);
        return Math.sqrt(squared);
      },
      outer(chain: string, point: Vector, axis: Vector): number {
        const rows: Vector[][] = rings.get(chain) ?? [];
        let radius: number = 0;
        const distance = (p: Vector): number => (p[0] - point[0]) * axis[0] + (p[1] - point[1]) * axis[1] + (p[2] - point[2]) * axis[2];
        const edge = (a: Vector, b: Vector): void => {
          const da: number = distance(a);
          const db: number = distance(b);
          if (da === 0 && db === 0) {
            radius = Math.max(radius, Math.hypot(a[0] - point[0], a[1] - point[1], a[2] - point[2]), Math.hypot(b[0] - point[0], b[1] - point[1], b[2] - point[2]));
            return;
          }
          if (da * db > 0 || da === db) return;
          const u: number = da / (da - db);
          const q: Vector = [a[0] + u * (b[0] - a[0]) - point[0], a[1] + u * (b[1] - a[1]) - point[1], a[2] + u * (b[2] - a[2]) - point[2]];
          radius = Math.max(radius, Math.hypot(...q));
        };
        for (let r: number = 0; r < rows.length; r++) {
          const row: Vector[] = rows[r]!;
          for (let k: number = 0; k < row.length; k++) {
            edge(row[k]!, row[(k + 1) % row.length]!);
            if (r > 0) edge(row[k]!, rows[r - 1]![k]!);
          }
        }
        return radius;
      },
      envelope(chain: string, from: Vector, to: Vector): number {
        const length: number = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
        if (!(length > 0)) throw new Error("A sampled segment envelope needs a positive segment length");
        const axis: Vector = [(to[0] - from[0]) / length, (to[1] - from[1]) / length, (to[2] - from[2]) / length];
        const rows: Vector[][] = rings.get(chain) ?? [];
        let radius: number = 0;
        const station = (p: Vector): number => (p[0] - from[0]) * axis[0] + (p[1] - from[1]) * axis[1] + (p[2] - from[2]) * axis[2];
        const include = (p: Vector, along: number): void => {
          if (along < 0 || along > length) return;
          radius = Math.max(radius, Math.hypot(p[0] - from[0] - along * axis[0], p[1] - from[1] - along * axis[1], p[2] - from[2] - along * axis[2]));
        };
        const edge = (a: Vector, b: Vector): void => {
          const da: number = station(a);
          const db: number = station(b);
          include(a, da);
          include(b, db);
          if (da === db) return;
          for (const end of [0, length]) {
            const u: number = (end - da) / (db - da);
            if (u < 0 || u > 1) continue;
            include([a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1]), a[2] + u * (b[2] - a[2])], end);
          }
        };
        for (let r: number = 0; r < rows.length; r++) {
          const row: Vector[] = rows[r]!;
          for (let k: number = 0; k < row.length; k++) {
            edge(row[k]!, row[(k + 1) % row.length]!);
            if (r > 0) edge(row[k]!, rows[r - 1]![k]!);
          }
        }
        return radius;
      },
    };
  }

  /** Largest supported compound rotation, bounded by the principal DQ arc. */
  export function range(bone: string): number {
    const canonical: string = bone.replace(/^(left|right)/, "<side>");
    const axes: Map<string, number> = new Map();
    for (const [, own, axis, , low, high] of AutoMovieHumanPoseChannels) {
      if (own !== canonical || axis === "forward" || axis === "lateral") continue;
      axes.set(axis, Math.max(axes.get(axis) ?? 0, Math.abs(low), Math.abs(high)));
    }
    return Math.min(Math.PI, [...axes.values()].reduce((sum: number, angle: number): number => sum + angle, 0) * Math.PI / 180);
  }
}
