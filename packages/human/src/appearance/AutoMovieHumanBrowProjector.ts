import type { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";

/**
 * Projection of face-plane points onto the head's lofted skin along the line
 * of sight: the head chain's point whose place in the face plane is the
 * given one, the frontmost where two chains hold it, with the chain's own
 * normal. Each point is solved on the chain's parameters by Newton's method
 * from the last point's solution (the trim loop's rule,
 * `AutoMovieHumanBodyRoots.trim`); no triangle is read.
 */
export class AutoMovieHumanBrowProjector {
  /** Keep the head chains and the calibration-mm face frame. */
  private constructor(
    private readonly chains: readonly IAutoMovieLoftChain[],
    private readonly g: AutoMovieHumanEyelid.IGlobe,
    private readonly origin: AutoMovieHumanEyelid.Point,
    private readonly temple: AutoMovieHumanEyelid.Point,
  ) {}

  /** The last solution per chain, the next point's start. */
  private readonly last: Map<IAutoMovieLoftChain, [number, number]> = new Map();

  /** Largest in-plane miss of a solution, mm. */
  private static readonly MISS: number = 0.05;

  /**
   * A projector on the head's chains.
   *
   * @param chains The calibration's chains, mm.
   * @param g The eye's globe frame.
   * @param origin The face plane's origin, mm.
   * @param temple Unit direction toward the temple in the face plane.
   * @returns The projector, or null without a head chain
   */
  public static create(
    chains: readonly IAutoMovieLoftChain[],
    g: AutoMovieHumanEyelid.IGlobe,
    origin: AutoMovieHumanEyelid.Point,
    temple: AutoMovieHumanEyelid.Point,
  ): AutoMovieHumanBrowProjector | null {
    const head: IAutoMovieLoftChain[] = chains.filter(
      (c: IAutoMovieLoftChain): boolean => c.name === "head" || c.name.startsWith("head."),
    );
    return head.length === 0 ? null : new AutoMovieHumanBrowProjector(head, g, origin, temple);
  }

  /**
   * Frontmost skin point on the line of sight through a face-plane point.
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
    let best: { point: AutoMovieHumanEyelid.Point; normal: AutoMovieHumanEyelid.Point } | null = null;
    let front: number = -Infinity;
    for (const chain of this.chains) {
      const solved: [number, number] | null = this.solve(chain, a, h);
      if (solved === null) continue;
      const p: [number, number, number] = AutoMovieLoftChain.point(chain, solved[0], solved[1]);
      const depth: number = dot(p, this.g.forward);
      if (depth <= front) continue;
      front = depth;
      best = { point: p, normal: this.normal(chain, solved[0], solved[1]) };
    }
    return best;
  }

  /** The chain's parameters whose point has the face-plane place `(a, h)`, or null. */
  private solve(chain: IAutoMovieLoftChain, a: number, h: number): [number, number] | null {
    const ys: number[] = chain.layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y);
    const lowest: number = Math.min(...ys);
    const highest: number = Math.max(...ys);
    const place: (s: number, t: number) => [number, number, number] = (s: number, t: number): [number, number, number] => {
      const p: [number, number, number] = AutoMovieLoftChain.point(chain, s, t);
      const r: [number, number, number] = [p[0] - this.origin[0], p[1] - this.origin[1], p[2] - this.origin[2]];
      return [dot(r, this.temple), dot(r, this.g.up), dot(p, this.g.forward)];
    };
    let [s, t]: [number, number] = this.last.get(chain) ?? this.seed(chain, a, h, lowest, highest, place);
    for (let k: number = 0; k < 30; k++) {
      const [x, y] = place(s, t);
      const rx: number = x - a;
      const ry: number = y - h;
      if (Math.hypot(rx, ry) < 1e-4) break;
      const ds: number = s + 0.01 <= highest ? 0.01 : -0.01;
      const ps: [number, number, number] = place(s + ds, t);
      const pt: [number, number, number] = place(s, t + 1e-4);
      const j11: number = (ps[0] - x) / ds;
      const j21: number = (ps[1] - y) / ds;
      const j12: number = (pt[0] - x) / 1e-4;
      const j22: number = (pt[1] - y) / 1e-4;
      const det: number = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-12) break;
      let step: [number, number] = [(-rx * j22 + ry * j12) / det, (rx * j21 - ry * j11) / det];
      // Bound the step to a millimetre of skin.
      const length: number = Math.hypot(step[0], step[1] * 50);
      if (length > 1) step = [step[0] / length, step[1] / length];
      s = Math.min(highest, Math.max(lowest, s + step[0]));
      t += step[1];
    }
    const [x, y, depth] = place(s, t);
    if (!(Math.hypot(x - a, y - h) <= AutoMovieHumanBrowProjector.MISS) || !(depth >= place(s, t + Math.PI)[2])) {
      this.last.delete(chain);
      return null;
    }
    this.last.set(chain, [s, t]);
    return [s, t];
  }

  /**
   * Each chain's seed grid, its places read once: every millimetre of station
   * from the lowest layer by 256 phases, as `[s, t, x, y, depth]` rows. A
   * chain that misses a point is seeded again at the next one, so the grid is
   * kept for the projector's life rather than evaluated per seed.
   */
  private readonly grids: Map<IAutoMovieLoftChain, Float64Array> = new Map();

  /** A start for a chain: its forward-facing grid point nearest the face-plane place. */
  private seed(
    chain: IAutoMovieLoftChain,
    a: number,
    h: number,
    lowest: number,
    highest: number,
    place: (s: number, t: number) => [number, number, number],
  ): [number, number] {
    let grid: Float64Array | undefined = this.grids.get(chain);
    if (grid === undefined) {
      const rows: number[] = [];
      for (let s: number = lowest; s <= highest; s += 1)
        for (let i: number = 0; i < 256; i++) {
          const t: number = (2 * Math.PI * i) / 256;
          const [x, y, depth] = place(s, t);
          rows.push(s, t, x, y, depth);
        }
      grid = Float64Array.from(rows);
      this.grids.set(chain, grid);
    }
    let best: [number, number] = [(lowest + highest) / 2, 0];
    let least: number = Infinity;
    for (let k: number = 0; k < grid.length; k += 5) {
      const d: number = Math.hypot(grid[k + 2]! - a, grid[k + 3]! - h) - 1e-3 * grid[k + 4]!;
      if (d < least) {
        least = d;
        best = [grid[k]!, grid[k + 1]!];
      }
    }
    return best;
  }

  /** The chain's unit normal at its parameters, turned to face forward. */
  private normal(chain: IAutoMovieLoftChain, s: number, t: number): AutoMovieHumanEyelid.Point {
    const p: [number, number, number] = AutoMovieLoftChain.point(chain, s, t);
    const ps: [number, number, number] = AutoMovieLoftChain.point(chain, s + 0.01, t);
    const pt: [number, number, number] = AutoMovieLoftChain.point(chain, s, t + 1e-4);
    const ds: number[] = [ps[0] - p[0], ps[1] - p[1], ps[2] - p[2]];
    const dt: number[] = [pt[0] - p[0], pt[1] - p[1], pt[2] - p[2]];
    const n: number[] = [ds[1]! * dt[2]! - ds[2]! * dt[1]!, ds[2]! * dt[0]! - ds[0]! * dt[2]!, ds[0]! * dt[1]! - ds[1]! * dt[0]!];
    const l: number = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    const sign: number = dot(n as [number, number, number], this.g.forward) < 0 ? -1 : 1;
    return [(sign * n[0]!) / l, (sign * n[1]!) / l, (sign * n[2]!) / l];
  }
}

/** Dot product of two 3-vectors. */
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
