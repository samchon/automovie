import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * A section ring of pieces, each owning a fixed run of the ring's phases (its
 * share of the control points) and read by arclength within it, so every
 * junction, and with it every guide, stands at a fixed phase on every section.
 */
export namespace AutoMovieHumanFootSectors {
  /** A piece's dense points and their arclengths. */
  export interface IPiece {
    /** Dense points in order. */
    points: G.Vec2[];

    /** Arclength up to each point. */
    lengths: number[];
  }

  /** The joined ring. */
  export interface ISectors {
    /** The point at a phase. */
    at: (t: number) => G.Vec2;

    /** The phase where a piece starts. */
    start: (index: number) => number;

    /** The phase on any of the given pieces where the across coordinate is `v`. */
    find: (v: number, pieces: number[]) => number;
  }

  /** A piece read by its arclength. */
  export function piece(points: G.Vec2[]): IPiece {
    const lengths: number[] = [0];
    for (let i: number = 1; i < points.length; i++)
      lengths.push(lengths[i - 1]! + Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]));
    return { points, lengths };
  }

  /**
   * Pieces joined into a ring over their fixed shares.
   *
   * @param pieces The pieces in ring order.
   * @param shares Each piece's share of the ring's control points.
   * @param miss Told when a cleft lies outside the listed pieces, which then answer their nearest point.
   */
  export function join(pieces: IPiece[], shares: readonly number[], miss?: (detail: string) => void): ISectors {
    const total: number = shares.reduce((s: number, n: number): number => s + n, 0);
    const starts: number[] = [0];
    for (const n of shares) starts.push(starts[starts.length - 1]! + n);
    const pointOf = (p: IPiece, f: number): G.Vec2 => {
      const L: number = p.lengths[p.lengths.length - 1]!;
      const target: number = Math.min(1, Math.max(0, f)) * L;
      let lo: number = 0;
      let hi: number = p.lengths.length - 1;
      while (hi - lo > 1) {
        const m: number = (lo + hi) >> 1;
        if (p.lengths[m]! <= target) lo = m;
        else hi = m;
      }
      const w: number = (target - p.lengths[lo]!) / (p.lengths[hi]! - p.lengths[lo]! || 1);
      const a: G.Vec2 = p.points[lo]!;
      const b: G.Vec2 = p.points[hi]!;
      return [a[0] + w * (b[0] - a[0]), a[1] + w * (b[1] - a[1])];
    };
    return {
      at: (t: number): G.Vec2 => {
        const x: number = (G.wrap(t) / G.TWO_PI) * total;
        let i: number = 0;
        while (i + 1 < shares.length && x >= starts[i + 1]!) i++;
        return pointOf(pieces[i]!, (x - starts[i]!) / shares[i]!);
      },
      start: (index: number): number => (starts[index]! / total) * G.TWO_PI,
      find: (v: number, list: number[]): number => {
        // The nearest point of the listed pieces across, for a cleft the
        // ring does not reach: the web then pinches at the ring's own edge.
        let nearest: number = 0;
        let gap: number = Infinity;
        for (const i of list) {
          const p: IPiece = pieces[i]!;
          const L: number = p.lengths[p.lengths.length - 1]!;
          for (let j: number = 0; j + 1 < p.points.length; j++) {
            const a: G.Vec2 = p.points[j]!;
            const b: G.Vec2 = p.points[j + 1]!;
            if ((a[0] - v) * (b[0] - v) <= 0 && a[0] !== b[0]) {
              const w: number = (v - a[0]) / (b[0] - a[0]);
              const f: number = (p.lengths[j]! + w * (p.lengths[j + 1]! - p.lengths[j]!)) / L;
              return G.wrap(((starts[i]! + f * shares[i]!) / total) * G.TWO_PI);
            }
            if (Math.abs(a[0] - v) < gap) {
              gap = Math.abs(a[0] - v);
              nearest = G.wrap(((starts[i]! + (p.lengths[j]! / L) * shares[i]!) / total) * G.TWO_PI);
            }
          }
        }
        miss?.(`a cleft at ${v.toFixed(2)} mm across lies ${gap.toFixed(2)} mm outside the web ring's pieces ${list.join(", ")}`);
        return nearest;
      },
    };
  }
}
