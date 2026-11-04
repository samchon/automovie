import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type ILoop = AutoMovieSolidMesh.ILoop;
type IMesh = AutoMovieSolidMesh.IMesh;
const { dot, norm, sub } = AutoMovieSolidVector;

/**
 * The trim-loop readings of a face's tessellation (`AutoMovieSolidMesh.face`): which grid vertices a loop keeps with a metric margin, which drawn-cell cycle belongs to which loop, and the arclength parameter and alignment the zipper (`AutoMovieSolidZip`) stitches a loop to its cycle by.
 */
export namespace AutoMovieSolidMeshLoop {
  /**
   * Whether a grid vertex lies on a loop's kept side, at least `margin` mm
   * from it.
   *
   * @param loop The loop.
   * @param u The vertex's station.
   * @param v The vertex's phase.
   * @param jet The surface's jet there, for the metric.
   * @param margin The least distance from the loop, mm.
   * @param period The face's phase period, or undefined.
   * @returns True when the vertex is kept at the margin.
   */
  export function keeps(loop: ILoop, u: number, v: number, jet: IAutoMovieSolidSurface.IJet, margin: number, period: number | undefined): boolean {
    if (!AutoMovieSolidCycle.kept(loop, u, v, period)) return false;

    // The least distance to the loop's segments in millimetres, each segment
    // read on the branch of the point's phase nearest it.
    const E: number = dot(jet.u, jet.u);
    const F: number = dot(jet.u, jet.v);
    const G: number = dot(jet.v, jet.v);
    const n: number = loop.chart.length;
    let least: number = Infinity;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = loop.chart[k]!;
      const raw: [number, number] = loop.chart[(k + 1) % n]!;
      const bv: number = AutoMovieSolidCycle.shift(raw[1], a[1], period);
      const w: number = AutoMovieSolidCycle.shift(v, a[1], period);
      least = Math.min(least, segment(u - a[0], w - a[1], raw[0] - a[0], bv - a[1], E, F, G));
    }
    return least >= margin;
  }

  /** The metric distance from a chart offset to a chart segment, mm. */
  function segment(px: number, py: number, dx: number, dy: number, E: number, F: number, G: number): number {
    const dd: number = E * dx * dx + 2 * F * dx * dy + G * dy * dy;
    const pd: number = E * px * dx + F * (px * dy + py * dx) + G * py * dy;
    const t: number = dd > 0 ? Math.min(1, Math.max(0, pd / dd)) : 0;
    const x: number = px - t * dx;
    const y: number = py - t * dy;
    return Math.sqrt(Math.max(0, E * x * x + 2 * F * x * y + G * y * y));
  }

  /**
   * The mean chart distance from a cycle's points to a loop, for matching a drawn-cell cycle to its loop.
   *
   * @param loop The loop.
   * @param points The cycle's chart points.
   * @param period The face's phase period, or undefined.
   * @returns The mean distance.
   */
  export function nearest(loop: ILoop, points: readonly [number, number][], period: number | undefined): number {
    let sum: number = 0;
    for (const p of points) sum += AutoMovieSolidCycle.foot(loop, p[0], p[1], period).distance;
    return sum / points.length;
  }

  /**
   * The zipper's parameter of a closed vertex sequence: its cumulative length
   * between its points from its first, over its whole length, times a turn.
   * Arclength holds for any simple cycle a clip leaves, where an angle about
   * a centre turns back on a cycle that is not star-shaped.
   *
   * @param mesh The mesh holding the vertices.
   * @param ids The sequence's vertices.
   * @returns Each vertex's parameter, radians from 0.
   */
  export function arc(mesh: IMesh, ids: readonly number[]): number[] {
    const p = (v: number): Vec3 => [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];
    const out: number[] = [0];
    for (let k: number = 1; k < ids.length; k++) out.push(out[k - 1]! + norm(sub(p(ids[k]!), p(ids[k - 1]!))));
    const total: number = out[ids.length - 1]! + norm(sub(p(ids[0]!), p(ids[ids.length - 1]!)));
    return out.map((x: number): number => (total > 0 ? (2 * Math.PI * x) / total : 0));
  }

  /**
   * A drawn-cell cycle turned and started to run with a loop: started at its
   * vertex nearest the loop's first, and turned the way whose point a quarter
   * of its length on lies nearer the loop's point a quarter on.
   *
   * @param mesh The mesh holding the vertices.
   * @param loop The loop's vertices.
   * @param cycle The cycle's vertices.
   * @returns The cycle, started and turned to run with the loop.
   */
  export function aligned(mesh: IMesh, loop: readonly number[], cycle: readonly number[]): number[] {
    const p = (v: number): Vec3 => [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];
    const head: Vec3 = p(loop[0]!);
    let start: number = 0;
    cycle.forEach((v: number, k: number): void => {
      if (norm(sub(p(v), head)) < norm(sub(p(cycle[start]!), head))) start = k;
    });
    const forward: number[] = cycle.map((_: number, k: number): number => cycle[(start + k) % cycle.length]!);
    const backward: number[] = [forward[0]!, ...forward.slice(1).reverse()];
    const quarter = (ids: readonly number[]): Vec3 => {
      const a: number[] = arc(mesh, ids);
      const k: number = a.findIndex((x: number): boolean => x >= Math.PI / 2);
      return p(ids[k < 0 ? 0 : k]!);
    };
    const target: Vec3 = quarter(loop);
    return norm(sub(quarter(forward), target)) <= norm(sub(quarter(backward), target)) ? forward : backward;
  }
}
