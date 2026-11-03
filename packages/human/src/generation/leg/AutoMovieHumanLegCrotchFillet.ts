import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import type { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { lerp, normalize, plus, scale, sub } = AutoMovieHumanLegVector;

/**
 * The crotch fold's leg side: the crotch ring at a depth under it, rounded.
 *
 * The ring the leg takes is the trunk's arc closed by the slit between the
 * thighs, so it has a corner at each pinch. Each corner is a fillet whose
 * sides run {@link GROWTH} mm along the arc and the slit per mm of depth, the
 * rate at which the trunk's own fold leaves the midline, so the contact
 * between the thighs shortens downward and the leg's own sections never keep
 * the root's corner. The corner opens from rest, so the ring's own derivative
 * stays the trunk's, and then at the fold's rate. The loop is read at the
 * leg's phases about the ring's centre.
 */
export namespace AutoMovieHumanLegCrotchFillet {
  /** The leg's start at a depth under the ring, at the leg's phases. */
  export interface ILoop {
    /** Points of the loop at the leg's phases. */
    points: Vec3[];

    /** Outward horizontal normals there. */
    normals: Vec3[];

    /** The trunk's station derivative at each point, per mm up. */
    rates: Vec3[];

    /** Distance along the trunk's arc to the nearer pinch; 0 off the arc. */
    edges: number[];
  }

  /**
   * Growth of the corner's sides per mm of depth: the trunk's crotch fold
   * leaves the midline as fast as it rises, and the leg's corner opens at that
   * rate.
   */
  export const GROWTH: number = 1;

  /** Largest share of the slit or the arc a corner may take. */
  export const CORNER_SHARE: number = 0.45;

  /** Samples of a fillet. */
  export const FILLET: number = 24;

  /** Samples of the slit. */
  export const SLIT: number = 32;

  /**
   * The ring at a depth under it, rounded, at the leg's phases.
   *
   * @param root The crotch ring the leg takes.
   * @param depth Depth under the ring, mm.
   */
  export function of(root: AutoMovieHumanLegCrotchRoot.IRoot, depth: number): ILoop {
    const arc: Vec3[] = root.arc;
    const n: number = arc.length;
    const front: Vec3 = arc[0]!;
    const rear: Vec3 = arc[n - 1]!;
    const slit: number = AutoMovieHumanLegVector.norm(sub(front, rear));
    const lengths: number[] = [0];
    for (let i: number = 1; i < n; i++) lengths.push(lengths[i - 1]! + AutoMovieHumanLegVector.norm(sub(arc[i]!, arc[i - 1]!)));
    const total: number = lengths[n - 1]!;

    // The corner opens from rest, then at the fold's rate, within its shares.
    const size: number = Math.min(
      root.corner + GROWTH * (Math.hypot(depth, root.corner) - root.corner),
      CORNER_SHARE * slit,
      CORNER_SHARE * total,
    );

    // A point of the arc at a length from its start, with its rate and tangent.
    const along = (s: number): { p: Vec3; d: Vec3; t: Vec3 } => {
      let i: number = 1;
      while (i < n - 1 && lengths[i]! < s) i++;
      const f: number = (s - lengths[i - 1]!) / (lengths[i]! - lengths[i - 1]! || 1);
      return {
        p: lerp(arc[i - 1]!, arc[i]!, f),
        d: lerp(root.rates[i - 1]!, root.rates[i]!, f),
        t: normalize(sub(arc[i]!, arc[i - 1]!)),
      };
    };

    // The slit carries the pinches' rates, on the midline.
    const slitRate = (f: number): Vec3 => {
      const r: Vec3 = lerp(root.rates[n - 1]!, root.rates[0]!, f);
      return [r[0], r[1], 0];
    };
    const start = along(size);
    const end = along(total - size);
    const toFront: Vec3 = normalize(sub(front, rear));
    const nearRear: Vec3 = plus(rear, scale(toFront, size));
    const nearFront: Vec3 = sub(front, scale(toFront, size));

    // A cubic Hermite fillet between two points with their tangents.
    const fillet = (
      p: Vec3,
      tp: Vec3,
      q: Vec3,
      tq: Vec3,
      dp: Vec3,
      dq: Vec3,
      ep: number,
      eq: number,
    ): { points: Vec3[]; rates: Vec3[]; edges: number[] } => {
      const lambda: number = AutoMovieHumanLegVector.norm(sub(q, p));
      const points: Vec3[] = [];
      const rates: Vec3[] = [];
      const edges: number[] = [];
      for (let k: number = 1; k < FILLET; k++) {
        const x: number = k / FILLET;
        edges.push(ep + (eq - ep) * x);
        points.push(
          [0, 1, 2].map(
            (c: number): number =>
              (2 * x ** 3 - 3 * x ** 2 + 1) * p[c]! +
              (x ** 3 - 2 * x ** 2 + x) * lambda * tp[c]! +
              (3 * x ** 2 - 2 * x ** 3) * q[c]! +
              (x ** 3 - x ** 2) * lambda * tq[c]!,
          ) as Vec3,
        );
        rates.push(lerp(dp, dq, x));
      }
      return { points, rates, edges };
    };

    // Round the loop: the arc, the rear fillet, the slit, the front fillet.
    // Each point keeps its distance along the arc from the nearer pinch.
    const points: Vec3[] = [];
    const rates: Vec3[] = [];
    const edges: number[] = [];
    points.push(start.p);
    rates.push(start.d);
    edges.push(size);
    for (let i: number = 1; i < n - 1; i++)
      if (lengths[i]! > size && lengths[i]! < total - size) {
        points.push(arc[i]!);
        rates.push(root.rates[i]!);
        edges.push(Math.min(lengths[i]!, total - lengths[i]!));
      }
    points.push(end.p);
    rates.push(end.d);
    edges.push(size);
    const back = fillet(end.p, end.t, nearRear, toFront, end.d, slitRate(size / slit), size, 0);
    points.push(...back.points);
    rates.push(...back.rates);
    edges.push(...back.edges);
    for (let k: number = 0; k <= SLIT; k++) {
      const f: number = (size + ((slit - 2 * size) * k) / SLIT) / slit;
      points.push(lerp(rear, front, f));
      rates.push(slitRate(f));
      edges.push(0);
    }
    const fore = fillet(nearFront, toFront, start.p, start.t, slitRate(1 - size / slit), start.d, 0, size);
    points.push(...fore.points);
    rates.push(...fore.rates);
    edges.push(...fore.edges);

    // Outward normals at the loop's vertices, horizontal.
    const count: number = points.length;
    let area: number = 0;
    points.forEach((p: Vec3, i: number): void => {
      const q: Vec3 = points[(i + 1) % count]!;
      area += p[0] * q[2] - q[0] * p[2];
    });
    const turn: number = area >= 0 ? 1 : -1;
    const normals: Vec3[] = points.map((_: Vec3, i: number): Vec3 => {
      const t: Vec3 = sub(points[(i + 1) % count]!, points[(i + count - 1) % count]!);
      return normalize([turn * t[2], 0, -turn * t[0]]);
    });

    // Read at the leg's phases: the farthest crossing of each ray.
    const out: ILoop = { points: [], normals: [], rates: [], edges: [] };
    for (const t of AutoMovieHumanLegSampling.PHASES) {
      const dx: number = Math.cos(t);
      const dz: number = Math.sin(t);
      let best: number = -1;
      let at: number = 0;
      let share: number = 0;
      for (let i: number = 0; i < count; i++) {
        const a: Vec3 = points[i]!;
        const b: Vec3 = points[(i + 1) % count]!;
        const ex: number = b[0] - a[0];
        const ez: number = b[2] - a[2];
        const det: number = ez * dx - ex * dz;
        if (Math.abs(det) < 1e-12) continue;
        const sx: number = a[0] - root.centre[0];
        const sz: number = a[2] - root.centre[1];
        const r: number = (ez * sx - ex * sz) / det;
        const f: number = (dz * sx - dx * sz) / det;
        if (r > best && f >= 0 && f < 1) {
          best = r;
          at = i;
          share = f;
        }
      }
      const j: number = (at + 1) % count;
      out.points.push(lerp(points[at]!, points[j]!, share));
      out.normals.push(normalize(lerp(normals[at]!, normals[j]!, share)));
      out.rates.push(lerp(rates[at]!, rates[j]!, share));
      out.edges.push(edges[at]! + share * (edges[j]! - edges[at]!));
    }
    return out;
  }
}
