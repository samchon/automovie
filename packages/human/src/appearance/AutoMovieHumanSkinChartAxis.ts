import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinChartMath } from "./AutoMovieHumanSkinChartMath";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanSkinChartAxis } from "./IAutoMovieHumanSkinChartAxis";

type IAxis = IAutoMovieHumanSkinChartAxis;
const { fill, leastNormal, perpendicular, smooth, spread }: typeof AutoMovieHumanSkinChartMath = AutoMovieHumanSkinChartMath;

/** The skin chart axes: the chart a piece belongs to and the cylinder each chart is unrolled about. */
export namespace AutoMovieHumanSkinChartAxis {
  /** Point or direction in mm. */
  export type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** Vector arithmetic. */
  export const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

  /**
   * Chain name of a piece name `<chain>/<k>`.
   *
   * @param name Piece name
   * @returns Chain name
   */
  export function chainOf(name: string): string {
    return name.slice(0, name.lastIndexOf("/"));
  }

  /**
   * Band index of a piece name `<chain>/<k>`.
   *
   * @param name Piece name
   * @returns Band index
   */
  export function bandOf(name: string): number {
    return Number(name.slice(name.lastIndexOf("/") + 1));
  }

  /**
   * Chart key: shared charts for horizontally lofted families, else the chain.
   *
   * @param chain Chain name
   * @returns Chart key
   */
  export function chartOf(chain: string): string {
    if (chain === "head" || chain.startsWith("head.")) return "head";
    if (chain === "upper" || chain === "trunk") return "trunk";
    return chain;
  }

  /**
   * Vertical axis through the centroids of height bins, for charts lofted from
   * horizontal sections; the reference is `+X`.
   *
   * @param pieces The chart's pieces
   * @returns The axis
   */
  export function verticalAxis(
    pieces: readonly AutoMovieHumanSkinChart.IPiece[],
  ): IAxis {
    const BIN: number = 2;
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const piece of pieces)
      for (let i: number = 1; i < piece.positions.length; i += 3) {
        lo = Math.min(lo, piece.positions[i]!);
        hi = Math.max(hi, piece.positions[i]!);
      }
    const n: number = Math.max(2, Math.ceil((hi - lo) / BIN) + 1);
    const sx: number[] = new Array(n).fill(0);
    const sz: number[] = new Array(n).fill(0);
    const count: number[] = new Array(n).fill(0);
    for (const piece of pieces)
      for (let i: number = 0; i < piece.positions.length; i += 3) {
        const b: number = Math.min(
          n - 1,
          Math.round((piece.positions[i + 1]! - lo) / BIN),
        );
        sx[b]! += piece.positions[i]!;
        sz[b]! += piece.positions[i + 2]!;
        count[b]! += 1;
      }
    const x: number[] = smooth(
      fill(
        sx.map((v: number, b: number): number =>
          count[b]! > 0 ? v / count[b]! : NaN,
        ),
      ),
      3,
    );
    const z: number[] = smooth(
      fill(
        sz.map((v: number, b: number): number =>
          count[b]! > 0 ? v / count[b]! : NaN,
        ),
      ),
      3,
    );
    const centre: (y: number) => [number, number] = (
      y: number,
    ): [number, number] => {
      const t: number = Math.min(n - 1, Math.max(0, (y - lo) / BIN));
      const b: number = Math.min(n - 2, Math.floor(t));
      const f: number = t - b;
      return [x[b]! + (x[b + 1]! - x[b]!) * f, z[b]! + (z[b + 1]! - z[b]!) * f];
    };
    return {
      locate: (p: Vec3): [number, number, number] => {
        const c: [number, number] = centre(p[1]);
        const dx: number = p[0] - c[0];
        const dz: number = p[2] - c[1];
        return [p[1], Math.hypot(dx, dz), Math.atan2(dz, dx)];
      },
      point: (s: number, theta: number, rho: number): Vec3 => {
        const c: [number, number] = centre(s);
        return [c[0] + rho * Math.cos(theta), s, c[1] + rho * Math.sin(theta)];
      },
    };
  }

  /**
   * Axis polyline through the band centroids of one chain, with a
   * rotation-minimising reference frame transported along it.
   *
   * @param pieces The chain's pieces
   * @returns The axis
   */
  export function chainAxis(pieces: readonly AutoMovieHumanSkinChart.IPiece[]): IAxis {
    const ordered: AutoMovieHumanSkinChart.IPiece[] = [...pieces].sort(
      (
        a: AutoMovieHumanSkinChart.IPiece,
        b: AutoMovieHumanSkinChart.IPiece,
      ): number => bandOf(a.name) - bandOf(b.name),
    );
    let bands: number[] = ordered.map(
      (piece: AutoMovieHumanSkinChart.IPiece): number => bandOf(piece.name),
    );
    let centres: Vec3[] = ordered.map(
      (piece: AutoMovieHumanSkinChart.IPiece): Vec3 =>
        V.centroid(piece.positions),
    );

    // Without a usable centroid polyline (one band, or centroids closer than
    // half the chain's radius), the axis is the direction the normals are most
    // nearly perpendicular to, through the chain's centroid and spanning it.
    let length: number = 0;
    for (let k: number = 1; k < centres.length; ++k)
      length += V.norm(V.sub(centres[k]!, centres[k - 1]!));
    if (centres.length < 2 || length < 0.5 * spread(ordered)) {
      const all: number[] = ordered.flatMap(
        (piece: AutoMovieHumanSkinChart.IPiece): number[] => piece.positions,
      );
      const c: Vec3 = V.centroid(all);
      const d: Vec3 = leastNormal(ordered);
      let reach: number = 1;
      for (let i: number = 0; i < all.length; i += 3)
        reach = Math.max(reach, Math.abs(V.dot(V.sub(V.at(all, i / 3), c), d)));
      centres = [V.sub(c, V.scale(d, reach)), V.add(c, V.scale(d, reach))];
      bands = [];
    }

    // Segment directions, cumulative stations and transported references.
    const m: number = centres.length - 1;
    const dirs: Vec3[] = [];
    const stations: number[] = [0];
    for (let k: number = 0; k < m; ++k) {
      const d: Vec3 = V.sub(centres[k + 1]!, centres[k]!);
      const len: number = Math.max(1e-9, V.norm(d));
      dirs.push(V.scale(d, 1 / len));
      stations.push(stations[k]! + len);
    }
    const mean: Vec3 = V.normalize(V.sub(centres[m]!, centres[0]!));
    const refs: Vec3[] = [];
    let r: Vec3 = Math.abs(mean[0]) > 0.8 ? [0, 1, 0] : [1, 0, 0];
    for (let k: number = 0; k < m; ++k) {
      const t: Vec3 = dirs[k]!;
      const projected: Vec3 = V.sub(r, V.scale(t, V.dot(r, t)));
      r = V.norm(projected) > 1e-6 ? V.normalize(projected) : perpendicular(t);
      refs.push(r);
    }

    // Joint frames: each inner centroid carries the bisector of its two
    // segments and the mean reference, the ends their segment's own. Space
    // between consecutive joint planes belongs to one segment, so stations
    // and frames vary continuously across joints instead of clamping every
    // point outside a bend onto the joint.
    const jointAxis: Vec3[] = [];
    const jointRef: Vec3[] = [];
    for (let k: number = 0; k <= m; ++k) {
      const t: Vec3 = V.normalize(
        V.add(dirs[Math.max(0, k - 1)]!, dirs[Math.min(m - 1, k)]!),
      );
      const raw: Vec3 = V.add(
        refs[Math.max(0, k - 1)]!,
        refs[Math.min(m - 1, k)]!,
      );
      jointAxis.push(t);
      jointRef.push(V.normalize(V.sub(raw, V.scale(t, V.dot(raw, t)))));
    }
    const frameAt: (k: number, f: number) => [Vec3, Vec3, Vec3, Vec3] = (
      k: number,
      f: number,
    ): [Vec3, Vec3, Vec3, Vec3] => {
      const g: number = Math.min(1, Math.max(0, f));
      const t: Vec3 = V.normalize(
        V.add(V.scale(jointAxis[k]!, 1 - g), V.scale(jointAxis[k + 1]!, g)),
      );
      const raw: Vec3 = V.add(
        V.scale(jointRef[k]!, 1 - g),
        V.scale(jointRef[k + 1]!, g),
      );
      const ref: Vec3 = V.normalize(V.sub(raw, V.scale(t, V.dot(raw, t))));
      const foot: Vec3 = V.add(
        centres[k]!,
        V.scale(V.sub(centres[k + 1]!, centres[k]!), f),
      );
      return [foot, t, ref, V.cross(t, ref)];
    };

    // A band's vertices search the segments around it: the band k spans
    // centroids k-1..k+1 in the polyline order.
    const position: Map<number, number> = new Map(
      bands.map((b: number, i: number): [number, number] => [b, i]),
    );
    return {
      locate: (p: Vec3, band: number): [number, number, number] => {
        const at: number = Math.min(m - 1, position.get(band) ?? 0);
        // Fallback where no nearby joint interval holds the point: the
        // unclamped projection onto the band's own segment.
        let k: number = at;
        let f: number =
          V.dot(V.sub(p, centres[at]!), dirs[at]!) /
          (stations[at + 1]! - stations[at]!);
        for (const candidate of [at, at - 1, at + 1, at - 2, at + 2]) {
          if (candidate < 0 || candidate > m - 1) continue;
          const a: number = V.dot(
            V.sub(p, centres[candidate]!),
            jointAxis[candidate]!,
          );
          const b: number = V.dot(
            V.sub(p, centres[candidate + 1]!),
            jointAxis[candidate + 1]!,
          );
          const inside: boolean =
            (a >= 0 || candidate === 0) && (b < 0 || candidate === m - 1);
          if (inside && a - b > 1e-9) {
            k = candidate;
            f = a / (a - b);
            break;
          }
        }
        const frame: [Vec3, Vec3, Vec3, Vec3] = frameAt(k, f);
        const d: Vec3 = V.sub(p, frame[0]);
        const across: Vec3 = V.sub(d, V.scale(frame[1], V.dot(d, frame[1])));
        return [
          stations[k]! + f * (stations[k + 1]! - stations[k]!),
          V.norm(across),
          Math.atan2(V.dot(across, frame[3]), V.dot(across, frame[2])),
        ];
      },
      point: (s: number, theta: number, rho: number): Vec3 => {
        let k: number = 0;
        while (k < m - 1 && s > stations[k + 1]!) ++k;
        const f: number = (s - stations[k]!) / (stations[k + 1]! - stations[k]!);
        const frame: [Vec3, Vec3, Vec3, Vec3] = frameAt(k, f);
        return V.add(
          frame[0],
          V.add(
            V.scale(frame[2], rho * Math.cos(theta)),
            V.scale(frame[3], rho * Math.sin(theta)),
          ),
        );
      },
    };
  }

}
