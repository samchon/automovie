import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import type { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { lerp, normalize, plus, scale, sub } = AutoMovieHumanLegVector;

/**
 * The crotch ring the leg starts on, rounded.
 *
 * The ring the leg takes is the trunk's arc closed by the slit between the
 * thighs, so it has a corner at each pinch. Each corner is a cubic Hermite
 * fillet whose sides run the root's corner size along the arc and the slit,
 * so the leg's own sections never keep the root's corner. The trunk's first
 * and second station derivatives are carried round the loop: the arc's own, a
 * linear run along each fillet, and the pinches' on the slit, on the midline.
 * The loop is read at the leg's phases about the ring's centre.
 */
export namespace AutoMovieHumanLegCrotchFillet {
  /** The leg's start ring at the leg's phases. */
  export interface ILoop {
    /** Points of the loop at the leg's phases. */
    points: Vec3[];

    /** Outward horizontal normals there. */
    normals: Vec3[];

    /** The trunk's station derivative at each point, per mm up. */
    rates: Vec3[];

    /** The trunk's second station derivative at each point, per mm squared. */
    seconds: Vec3[];

    /** Distance along the trunk's arc to the nearer pinch; 0 off the arc. */
    edges: number[];
  }

  /** A point of the trunk's arc read at a length along it. */
  interface IPlace {
    /** The point. */
    p: Vec3;

    /** The trunk's station derivative there, per mm up. */
    d: Vec3;

    /** The trunk's second station derivative there. */
    e: Vec3;

    /** Unit tangent of the arc there, in its own order. */
    t: Vec3;
  }

  /** One run of the loop's samples with what they carry. */
  interface IRun {
    /** Points. */
    points: Vec3[];

    /** The trunk's station derivative carried along, per mm up. */
    rates: Vec3[];

    /** The trunk's second station derivative carried along. */
    seconds: Vec3[];

    /** Distance along the arc to the nearer pinch, carried along. */
    edges: number[];
  }

  /** Largest share of the slit or the arc a corner may take. */
  export const CORNER_SHARE: number = 0.45;

  /** Samples of a fillet. */
  export const FILLET: number = 24;

  /** Samples of the slit. */
  export const SLIT: number = 32;

  /**
   * The ring, rounded, at the leg's phases.
   *
   * @param root The crotch ring the leg takes.
   */
  export function of(root: AutoMovieHumanLegCrotchRoot.IRoot): ILoop {
    const arc: Vec3[] = root.arc;
    const n: number = arc.length;
    const front: Vec3 = arc[0]!;
    const rear: Vec3 = arc[n - 1]!;
    const slit: number = AutoMovieHumanLegVector.norm(sub(front, rear));
    const lengths: number[] = [0];
    for (let i: number = 1; i < n; i++) lengths.push(lengths[i - 1]! + AutoMovieHumanLegVector.norm(sub(arc[i]!, arc[i - 1]!)));
    const total: number = lengths[n - 1]!;
    const size: number = Math.min(root.corner, CORNER_SHARE * slit, CORNER_SHARE * total);

    // A point of the arc at a length from its start, with its derivatives and tangent.
    const along: (s: number) => IPlace = (s: number): IPlace => {
      let i: number = 1;
      while (i < n - 1 && lengths[i]! < s) i++;
      const f: number = (s - lengths[i - 1]!) / (lengths[i]! - lengths[i - 1]! || 1);
      return {
        p: lerp(arc[i - 1]!, arc[i]!, f),
        d: lerp(root.rates[i - 1]!, root.rates[i]!, f),
        e: lerp(root.seconds[i - 1]!, root.seconds[i]!, f),
        t: normalize(sub(arc[i]!, arc[i - 1]!)),
      };
    };

    // The slit carries the pinches' derivatives, on the midline.
    const midline: (r: Vec3) => Vec3 = (r: Vec3): Vec3 => [r[0], r[1], 0];
    const slitRate: (f: number) => Vec3 = (f: number): Vec3 => midline(lerp(root.rates[n - 1]!, root.rates[0]!, f));
    const slitSecond: (f: number) => Vec3 = (f: number): Vec3 => midline(lerp(root.seconds[n - 1]!, root.seconds[0]!, f));
    const start: IPlace = along(size);
    const end: IPlace = along(total - size);
    const toFront: Vec3 = normalize(sub(front, rear));
    const nearRear: Vec3 = plus(rear, scale(toFront, size));
    const nearFront: Vec3 = sub(front, scale(toFront, size));

    // A cubic Hermite fillet between two places, both ends left out.
    const fillet: (a: IPlace, b: IPlace, ea: number, eb: number) => IRun = (a: IPlace, b: IPlace, ea: number, eb: number): IRun => {
      const lambda: number = AutoMovieHumanLegVector.norm(sub(b.p, a.p));
      const run: IRun = { points: [], rates: [], seconds: [], edges: [] };
      for (let k: number = 1; k < FILLET; k++) {
        const x: number = k / FILLET;
        run.edges.push(ea + (eb - ea) * x);
        run.points.push(
          [0, 1, 2].map(
            (c: number): number =>
              (2 * x ** 3 - 3 * x ** 2 + 1) * a.p[c]! +
              (x ** 3 - 2 * x ** 2 + x) * lambda * a.t[c]! +
              (3 * x ** 2 - 2 * x ** 3) * b.p[c]! +
              (x ** 3 - x ** 2) * lambda * b.t[c]!,
          ) as Vec3,
        );
        run.rates.push(lerp(a.d, b.d, x));
        run.seconds.push(lerp(a.e, b.e, x));
      }
      return run;
    };

    // Round the loop: the arc, the rear fillet, the slit, the front fillet.
    // Each point keeps its distance along the arc from the nearer pinch.
    const loop: IRun = { points: [], rates: [], seconds: [], edges: [] };
    const add: (p: Vec3, d: Vec3, e: Vec3, edge: number) => void = (p: Vec3, d: Vec3, e: Vec3, edge: number): void => {
      loop.points.push(p);
      loop.rates.push(d);
      loop.seconds.push(e);
      loop.edges.push(edge);
    };
    const append: (run: IRun) => void = (run: IRun): void => run.points.forEach((p: Vec3, k: number): void => add(p, run.rates[k]!, run.seconds[k]!, run.edges[k]!));
    add(start.p, start.d, start.e, size);
    for (let i: number = 1; i < n - 1; i++)
      if (lengths[i]! > size && lengths[i]! < total - size) add(arc[i]!, root.rates[i]!, root.seconds[i]!, Math.min(lengths[i]!, total - lengths[i]!));
    add(end.p, end.d, end.e, size);
    append(fillet(end, { p: nearRear, d: slitRate(size / slit), e: slitSecond(size / slit), t: toFront }, size, 0));
    for (let k: number = 0; k <= SLIT; k++) {
      const f: number = (size + ((slit - 2 * size) * k) / SLIT) / slit;
      add(lerp(rear, front, f), slitRate(f), slitSecond(f), 0);
    }
    append(fillet({ p: nearFront, d: slitRate(1 - size / slit), e: slitSecond(1 - size / slit), t: toFront }, start, 0, size));

    // Outward normals at the loop's vertices, horizontal.
    const points: Vec3[] = loop.points;
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
    const out: ILoop = { points: [], normals: [], rates: [], seconds: [], edges: [] };
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
      out.rates.push(lerp(loop.rates[at]!, loop.rates[j]!, share));
      out.seconds.push(lerp(loop.seconds[at]!, loop.seconds[j]!, share));
      out.edges.push(loop.edges[at]! + share * (loop.edges[j]! - loop.edges[at]!));
    }
    return out;
  }
}
