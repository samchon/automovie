import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLegCrotchFillet,
  IAutoMovieHumanLegCrotchRoot,
} from "@automovie/interface";

import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

/**
 * The crotch ring the leg starts on, rounded.
 *
 * The ring the leg takes is the trunk's arc closed by the slit between the
 * thighs, so it has a corner at each pinch. Each corner is a cubic Hermite
 * fillet whose sides run the root's corner size along the arc and the slit, so
 * the leg's own sections never keep the root's corner. The trunk's first and
 * second station derivatives are carried round the loop: the arc's own, a
 * linear run along each fillet, and the pinches' on the slit, on the midline.
 * The loop is read at the leg's phases about the ring's centre.
 */
export namespace AutoMovieHumanLegCrotchFillet {

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
  export function of(
    root: IAutoMovieHumanLegCrotchRoot.IRoot,
  ): IAutoMovieHumanLegCrotchFillet.ILoop {
    const arc: AutoMovieVector3Tuple[] = root.arc;
    const n: number = arc.length;
    const front: AutoMovieVector3Tuple = arc[0]!;
    const rear: AutoMovieVector3Tuple = arc[n - 1]!;
    const slit: number = AutoMovieHumanLegVector.norm(sub(front, rear));
    const lengths: number[] = [0];
    for (let i: number = 1; i < n; i++)
      lengths.push(
        lengths[i - 1]! +
          AutoMovieHumanLegVector.norm(sub(arc[i]!, arc[i - 1]!)),
      );
    const total: number = lengths[n - 1]!;
    const size: number = Math.min(
      root.corner,
      CORNER_SHARE * slit,
      CORNER_SHARE * total,
    );

    // A point of the arc at a length from its start, with its derivatives and tangent.
    function along(s: number): IPlace {
      let i: number = 1;
      while (i < n - 1 && lengths[i]! < s) i++;
      const f: number =
        (s - lengths[i - 1]!) / (lengths[i]! - lengths[i - 1]! || 1);
      return {
        p: lerp(arc[i - 1]!, arc[i]!, f),
        d: lerp(root.rates[i - 1]!, root.rates[i]!, f),
        e: lerp(root.seconds[i - 1]!, root.seconds[i]!, f),
        t: normalize(sub(arc[i]!, arc[i - 1]!)),
      };
    }

    // The slit carries the pinches' derivatives, on the midline.
    function midline(r: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
      return [r[0], r[1], 0];
    }
    function slitRate(f: number): AutoMovieVector3Tuple {
      return midline(lerp(root.rates[n - 1]!, root.rates[0]!, f));
    }
    function slitSecond(f: number): AutoMovieVector3Tuple {
      return midline(lerp(root.seconds[n - 1]!, root.seconds[0]!, f));
    }
    const start: IPlace = along(size);
    const end: IPlace = along(total - size);
    const toFront: AutoMovieVector3Tuple = normalize(sub(front, rear));
    const nearRear: AutoMovieVector3Tuple = plus(rear, scale(toFront, size));
    const nearFront: AutoMovieVector3Tuple = sub(front, scale(toFront, size));

    // A cubic Hermite fillet between two places, both ends left out.
    function fillet(a: IPlace, b: IPlace, ea: number, eb: number): IRun {
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
          ) as AutoMovieVector3Tuple,
        );
        run.rates.push(lerp(a.d, b.d, x));
        run.seconds.push(lerp(a.e, b.e, x));
      }
      return run;
    }

    // Round the loop: the arc, the rear fillet, the slit, the front fillet.
    // Each point keeps its distance along the arc from the nearer pinch.
    const loop: IRun = { points: [], rates: [], seconds: [], edges: [] };
    function add(
      p: AutoMovieVector3Tuple,
      d: AutoMovieVector3Tuple,
      e: AutoMovieVector3Tuple,
      edge: number,
    ): void {
      loop.points.push(p);
      loop.rates.push(d);
      loop.seconds.push(e);
      loop.edges.push(edge);
    }
    function append(run: IRun): void {
      return run.points.forEach((p: AutoMovieVector3Tuple, k: number): void =>
        add(p, run.rates[k]!, run.seconds[k]!, run.edges[k]!),
      );
    }
    add(start.p, start.d, start.e, size);
    for (let i: number = 1; i < n - 1; i++)
      if (lengths[i]! > size && lengths[i]! < total - size)
        add(
          arc[i]!,
          root.rates[i]!,
          root.seconds[i]!,
          Math.min(lengths[i]!, total - lengths[i]!),
        );
    add(end.p, end.d, end.e, size);
    append(
      fillet(
        end,
        {
          p: nearRear,
          d: slitRate(size / slit),
          e: slitSecond(size / slit),
          t: toFront,
        },
        size,
        0,
      ),
    );
    for (let k: number = 0; k <= SLIT; k++) {
      const f: number = (size + ((slit - 2 * size) * k) / SLIT) / slit;
      add(lerp(rear, front, f), slitRate(f), slitSecond(f), 0);
    }
    append(
      fillet(
        {
          p: nearFront,
          d: slitRate(1 - size / slit),
          e: slitSecond(1 - size / slit),
          t: toFront,
        },
        start,
        0,
        size,
      ),
    );

    // Outward normals at the loop's vertices, horizontal.
    const points: AutoMovieVector3Tuple[] = loop.points;
    const count: number = points.length;
    let area: number = 0;
    points.forEach((p: AutoMovieVector3Tuple, i: number): void => {
      const q: AutoMovieVector3Tuple = points[(i + 1) % count]!;
      area += p[0] * q[2] - q[0] * p[2];
    });
    const turn: number = area >= 0 ? 1 : -1;
    const normals: AutoMovieVector3Tuple[] = points.map(
      (_: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple => {
        const t: AutoMovieVector3Tuple = sub(
          points[(i + 1) % count]!,
          points[(i + count - 1) % count]!,
        );
        return normalize([turn * t[2], 0, -turn * t[0]]);
      },
    );

    // Read at the leg's phases: the farthest crossing of each ray.
    const out: IAutoMovieHumanLegCrotchFillet.ILoop = {
      points: [],
      normals: [],
      rates: [],
      seconds: [],
      edges: [],
    };
    for (const t of AutoMovieHumanLegSampling.PHASES) {
      const dx: number = Math.cos(t);
      const dz: number = Math.sin(t);
      let best: number = -1;
      let at: number = 0;
      let share: number = 0;
      for (let i: number = 0; i < count; i++) {
        const a: AutoMovieVector3Tuple = points[i]!;
        const b: AutoMovieVector3Tuple = points[(i + 1) % count]!;
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
      out.edges.push(
        loop.edges[at]! + share * (loop.edges[j]! - loop.edges[at]!),
      );
    }
    return out;
  }
  /*
   * A point of the trunk's arc read at a length along it.
   */
  interface IPlace {
    /*
     * The point.
     */
    p: AutoMovieVector3Tuple;

    /*
     * The trunk's station derivative there, per mm up.
     */
    d: AutoMovieVector3Tuple;

    /*
     * The trunk's second station derivative there.
     */
    e: AutoMovieVector3Tuple;

    /*
     * Unit tangent of the arc there, in its own order.
     */
    t: AutoMovieVector3Tuple;
  }

  /*
   * One run of the loop's samples with what they carry.
   */
  interface IRun {
    /*
     * Points.
     */
    points: AutoMovieVector3Tuple[];

    /*
     * The trunk's station derivative carried along, per mm up.
     */
    rates: AutoMovieVector3Tuple[];

    /*
     * The trunk's second station derivative carried along.
     */
    seconds: AutoMovieVector3Tuple[];

    /*
     * Distance along the arc to the nearer pinch, carried along.
     */
    edges: number[];
  }
}

const { lerp, normalize, plus, scale, sub } = AutoMovieHumanLegVector;
