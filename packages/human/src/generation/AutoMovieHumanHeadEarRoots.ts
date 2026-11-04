import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadRoots } from "./IAutoMovieHumanHeadRoots";

/**
 * The auricle spliced into the sections of `head.middle`: where its front and
 * back roots leave the head at a height, and the control points of a section
 * with the ear's path in it, at fixed counts per piece so the rim keeps one
 * phase up the ear.
 */
export namespace AutoMovieHumanHeadEarRoots {
  /** The point of a side at a place along x, with its tangent toward the back. */
  function at(side: readonly Vec3[], x: number): [number, P2, P2] {
    // The outline runs back along x past the nose, so start beyond it.
    const first: number = Math.floor(side.length * 0.12);
    let i: number = first;
    for (; i + 2 < side.length; i++) if (side[i + 1]![0] <= x) break;
    const a: Vec3 = side[i]!;
    const b: Vec3 = side[i + 1]!;
    const f: number =
      Math.abs(a[0] - b[0]) < 1e-9 ? 0 : (a[0] - x) / (a[0] - b[0]);
    const dx: number = b[0] - a[0];
    const dz: number = b[2] - a[2];
    const l: number = Math.hypot(dx, dz) || 1;
    return [i, [a[0] + f * dx, a[2] + f * dz], [dx / l, dz / l]];
  }

  /** A section's side in the left frame's `[x, z]`. */
  function planar(side: readonly Vec3[], sign: 1 | -1): P2[] {
    return side.map((p: Vec3): P2 => [p[0], sign * p[2]]);
  }

  /** Ear's chord and roots at a height, on a side in the left frame. */
  export function roots(
    ear: AutoMovieHumanEarConstruction.IEar,
    side: readonly Vec3[],
    sign: 1 | -1,
    y: number,
  ): IAutoMovieHumanHeadRoots {
    const canonical: Vec3[] = side.map(
      (p: Vec3): Vec3 => [p[0], p[1], sign * p[2]],
    );
    const head: number = at(canonical, ear.x)[1][1];
    const half: number = AutoMovieHumanEarConstruction.chord(ear, y);
    const c: P2 = AutoMovieHumanEarConstruction.centre(ear, y, head);
    const tip: P2 = [c[0] - half * ear.along[0], c[1] - half * ear.along[1]];
    const rim: P2 = [c[0] + half * ear.along[0], c[1] + half * ear.along[1]];
    const gap: number = AutoMovieHumanHeadPrior.PRIOR.ear.root * 2 * half;
    return {
      front: at(canonical, tip[0]),
      back: at(canonical, tip[0] - gap),
      rim,
      tip,
    };
  }

  /**
   * A side's control points with an ear spliced in. Every ring gives the same
   * phases to the head in front of the ear, the ear's two faces and the head
   * behind it, so the rim keeps one phase up the ear and the stations interpolate
   * along it.
   */
  export function spliced(
    ear: AutoMovieHumanEarConstruction.IEar,
    side: readonly Vec3[],
    sign: 1 | -1,
    y: number,
    weight: (p: Vec3) => number,
  ): Vec3[] {
    const flat: P2[] = planar(side, sign);
    const r: IAutoMovieHumanHeadRoots = roots(ear, side, sign, y);
    const path: P2[] = AutoMovieHumanEarConstruction.path(
      ear,
      y,
      {
        front: r.front[1],
        frontTangent: r.front[2],
        back: r.back[1],
        backTangent: [-r.back[2][0], -r.back[2][1]],
      },
      r.rim,
    );
    const rim: number = AutoMovieHumanEarConstruction.ANTERIOR;
    const pieces: P2[][] = [
      [...flat.slice(0, r.front[0] + 1), path[0]!],
      path.slice(0, rim + 1),
      path.slice(rim),
      [path[path.length - 1]!, ...flat.slice(r.back[0] + 1)],
    ];
    const out: Vec3[] = [];
    pieces.forEach((piece: P2[], i: number): void => {
      const line: Vec3[] = piece.map((p: P2): Vec3 => [p[0], y, sign * p[1]]);
      const count: number = SPLICE[i]!;
      out.push(
        ...resample(line, count + 1, i === 0 ? weight : undefined).slice(
          0,
          count,
        ),
      );
    });
    const last: P2 = flat[flat.length - 1]!;
    out.push([last[0], y, sign * last[1]]);
    return out;
  }

  /**
   * Points at uniform arclength along a polyline, both ends included, or uniform
   * in the arclength a weight scales.
   */
  export function resample(
    line: readonly Vec3[],
    count: number,
    weight?: (p: Vec3) => number,
  ): Vec3[] {
    const s: number[] = [0];
    for (let i: number = 1; i < line.length; i++) {
      const d: number = AutoMovieHumanHeadMath.dist(line[i]!, line[i - 1]!);
      s.push(
        s[i - 1]! +
          (weight === undefined
            ? d
            : (d * (weight(line[i]!) + weight(line[i - 1]!))) / 2),
      );
    }
    const out: Vec3[] = [];
    let j: number = 0;
    for (let i: number = 0; i < count; i++) {
      const target: number = (s[s.length - 1]! * i) / (count - 1);
      while (j + 2 < s.length && s[j + 1]! < target) j++;
      const h: number = s[j + 1]! - s[j]! || 1;
      const f: number = Math.min(1, (target - s[j]!) / h);
      const p: Vec3 = line[j]!;
      const q: Vec3 = line[j + 1]!;
      out.push([
        p[0] + f * (q[0] - p[0]),
        p[1] + f * (q[1] - p[1]),
        p[2] + f * (q[2] - p[2]),
      ]);
    }
    return out;
  }

  /** Control points of the sections that hold the ears. */
  export const ORDER_MIDDLE: number = 512;

  /**
   * Control points of half a middle section: the head in front of the ear, the
   * ear's anterior and posterior faces and the head behind it.
   */
  export const SPLICE: number[] = [112, 72, 28, 44];
}

/** A point. */
type Vec3 = [number, number, number];

/** A point of a section. */
type P2 = [number, number];
