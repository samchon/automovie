import type { IAutoMovieHumanLoftAperture } from "./IAutoMovieHumanLoftAperture";

/**
 * Openings in the lofted skin, bounded by a closed world curve.
 *
 * An aperture is an anatomical opening such as the palpebral fissure, where
 * the skin ends at the lid margin and the eyeball shows through. The margin
 * is a closed space curve, written as a truncated Fourier series in each
 * world coordinate:
 *
 * ```text
 * P(t) = (x(t), y(t), z(t)),  each a0 + sum_k (a_k cos kt + b_k sin kt)
 * ```
 *
 * The skin around the opening is lofted as if closed (its sections are
 * bridged across the opening); the aperture then removes the bridge by world
 * position, independently of which chain or phase rule produced it:
 *
 * 1. every skin vertex near the opening takes its {@link signed} distance to
 *    the margin seen along the aperture's `forward` axis, negative over the
 *    opening;
 * 2. every triangle is clipped at the zero level of that distance: the
 *    margin crosses an edge where its two vertices differ in sign, a new
 *    vertex is placed there by linear interpolation, and the part over the
 *    opening is dropped.
 *
 * The resulting boundary is an open edge of the skin surface on the margin,
 * which is the anatomy: the skin is not closed over the eye. Clipping works
 * on any mesh, whatever the orientation of the sections that built it, and
 * traces the margin to the mesh resolution.
 */
export namespace AutoMovieHumanLoftAperture {
  /** Point `[x, y, z]` in mm. */
  export type Point = [number, number, number];

  /**
   * World point of the margin at phase t.
   *
   * @param aperture Aperture data.
   * @param t Phase in radians.
   */
  export function evaluate(
    aperture: IAutoMovieHumanLoftAperture,
    t: number,
  ): Point {
    const w: number = 2 * aperture.order + 1;
    const out: Point = [0, 0, 0];
    for (let axis: number = 0; axis < 3; axis++) {
      const c: number[] = aperture.coefficients;
      let v: number = c[axis * w]!;
      for (let k: number = 1; k <= aperture.order; k++)
        v +=
          c[axis * w + 2 * k - 1]! * Math.cos(k * t) +
          c[axis * w + 2 * k]! * Math.sin(k * t);
      out[axis] = v;
    }
    return out;
  }

  /** Dense margin polyline, used for the range, crossings and the inside test. */
  export function polyline(aperture: IAutoMovieHumanLoftAperture): Point[] {
    return Array.from(
      { length: SAMPLES },
      (_: unknown, i: number): Point =>
        evaluate(aperture, (2 * Math.PI * i) / SAMPLES),
    );
  }

  /** Lowest and highest world height of the margin, mm. */
  export function range(margin: readonly Point[]): [number, number] {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const p of margin) {
      lo = Math.min(lo, p[1]);
      hi = Math.max(hi, p[1]);
    }
    return [lo, hi];
  }

  /**
   * The margin seen along the aperture's `forward` axis.
   *
   * Points are projected onto the plane perpendicular to `forward`, spanned
   * by `lateral` and `up`, and keep their depth along `forward`. `lateral`
   * is `forward x` world up (world +X for an opening facing within 25
   * degrees of vertical, such as a nostril, where that product vanishes), and
   * `up = lateral x forward`, which is world up for a horizontal `forward`.
   */
  export interface IOutline {
    /** Unit direction the opening faces. */
    forward: Point;

    /** Unit lateral axis of the projection plane. */
    lateral: Point;

    /** Unit second axis of the projection plane, `lateral x forward`. */
    up: Point;

    /** Projected margin polyline `[lateral, up]`, mm. */
    points: [number, number][];

    /** Depth window along `forward`: the margin's own, widened by `depth`. */
    window: [number, number];

    /** Bounding box of `points`: `[lateral, up]` minimum then maximum. */
    box: [number, number, number, number];

    /** The segments of `points` by cell and by row, for {@link signed}. */
    grid: IGrid;
  }

  /** Project a dense margin along the aperture's `forward` axis. */
  export function outline(
    aperture: IAutoMovieHumanLoftAperture,
    margin: readonly Point[],
  ): IOutline {
    const f: Point = aperture.forward;
    const cross = (a: Readonly<Point>, b: Readonly<Point>): Point => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    let lateral: Point = cross(f, [0, 1, 0]);
    if (Math.hypot(...lateral) < 0.42) lateral = cross(f, [1, 0, 0]);
    const length: number = Math.hypot(...lateral);
    lateral = [lateral[0] / length, lateral[1] / length, lateral[2] / length];
    const up: Point = cross(lateral, f);

    let near: number = Infinity;
    let far: number = -Infinity;
    const box: [number, number, number, number] = [
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
    ];
    const points: [number, number][] = margin.map(
      (q: Readonly<Point>): [number, number] => {
        const [u, v] = project(lateral, up, q);
        const depth: number = q[0] * f[0] + q[1] * f[1] + q[2] * f[2];
        near = Math.min(near, depth);
        far = Math.max(far, depth);
        box[0] = Math.min(box[0], u);
        box[1] = Math.min(box[1], v);
        box[2] = Math.max(box[2], u);
        box[3] = Math.max(box[3], v);
        return [u, v];
      },
    );
    return {
      forward: f,
      lateral,
      up,
      points,
      window: [near - aperture.depth, far + aperture.depth],
      box,
      grid: gridOf(points, box),
    };
  }

  /**
   * Signed distance from a skin point to the margin, seen along `forward`.
   *
   * The point is projected like the margin; the value is its distance to the
   * projected polyline, negative when the projection lies inside it
   * (even-odd rule). A point outside the depth window, or farther than
   * `reach` mm from the outline's bounding box, is skin elsewhere on the
   * body and gets `+Infinity`. The value is continuous across the margin, so
   * its zero level between two vertices of opposite sign locates the margin
   * on the edge joining them.
   *
   * @param outline Projected margin.
   * @param p Skin point in mm.
   * @param reach Distance beyond the bounding box still measured, mm.
   */
  export function signed(
    outline: IOutline,
    p: Readonly<Point>,
    reach: number,
  ): number {
    const f: Point = outline.forward;
    const depth: number = p[0] * f[0] + p[1] * f[1] + p[2] * f[2];
    if (depth < outline.window[0] || depth > outline.window[1]) return Infinity;
    const [u, v] = project(outline.lateral, outline.up, p);
    const b: [number, number, number, number] = outline.box;
    if (
      u < b[0] - reach ||
      v < b[1] - reach ||
      u > b[2] + reach ||
      v > b[3] + reach
    )
      return Infinity;

    const points: [number, number][] = outline.points;
    const n: number = points.length;
    const g: IGrid = outline.grid;

    // The even-odd ray test over the segments of the point's row band: a
    // segment the horizontal ray through `v` crosses has one end above `v`
    // and the other at or below it, so its rows contain `v`'s row; outside
    // the grid's rows no segment straddles `v`.
    let odd: boolean = false;
    const row: number = Math.floor((v - g.origin[1]) / g.size);
    if (row >= 0 && row < g.rows)
      for (const i of g.bands[row]!) {
        const a: [number, number] = points[(i + n - 1) % n]!;
        const c: [number, number] = points[i]!;
        if (a[1] > v !== c[1] > v && u < ((c[0] - a[0]) * (v - a[1])) / (c[1] - a[1]) + a[0]) odd = !odd;
      }

    // The nearest segment, over rings of cells round the point's cell: the
    // cells outside ring r lie at least the point's distance to the square of
    // rings 0 to r away, so once the best squared distance is within that,
    // no unread segment is nearer. The same formula over a subset that holds
    // the nearest gives the full scan's value exactly.
    const cu: number = Math.min(g.columns - 1, Math.max(0, Math.floor((u - g.origin[0]) / g.size)));
    const cv: number = Math.min(g.rows - 1, Math.max(0, Math.floor((v - g.origin[1]) / g.size)));
    let nearest: number = Infinity;
    for (let r: number = 0; ; r++) {
      for (let w: number = cv - r; w <= cv + r; w++) {
        if (w < 0 || w >= g.rows) continue;
        const edge: boolean = w === cv - r || w === cv + r;
        for (let c: number = cu - r; c <= cu + r; c += edge || r === 0 ? 1 : 2 * r) {
          if (c < 0 || c >= g.columns) continue;
          for (const i of g.cells[w * g.columns + c]!) nearest = Math.min(nearest, squared(points[(i + n - 1) % n]!, points[i]!, u, v));
        }
      }
      const left: number = g.origin[0] + (cu - r) * g.size;
      const right: number = g.origin[0] + (cu + r + 1) * g.size;
      const bottom: number = g.origin[1] + (cv - r) * g.size;
      const top: number = g.origin[1] + (cv + r + 1) * g.size;
      const inside: boolean = u >= left && u <= right && v >= bottom && v <= top;
      const bound: number = inside ? Math.min(u - left, right - u, v - bottom, top - v) : 0;
      if (nearest <= bound * bound) break;
      if (cu - r <= 0 && cu + r >= g.columns - 1 && cv - r <= 0 && cv + r >= g.rows - 1) break;
    }
    return odd ? -Math.sqrt(nearest) : Math.sqrt(nearest);
  }

  /**
   * A square grid of cells over an outline's bounding box, each cell listing
   * the segments whose bounding box overlaps it, and each row of cells (a
   * band) listing the segments whose height range overlaps it. Segment `i`
   * runs from point `i - 1` (the last for `i = 0`) to point `i`.
   */
  export interface IGrid {
    /** Lower corner `[lateral, up]` of the first cell, mm. */
    origin: [number, number];

    /** Side of a cell, mm. */
    size: number;

    /** Cells across. */
    columns: number;

    /** Cells up. */
    rows: number;

    /** Segments per cell, row by row. */
    cells: number[][];

    /** Segments per row of cells. */
    bands: number[][];
  }

  /**
   * The grid of an outline: about `sqrt(n)` cells along its longer side for
   * `n` segments, so a dense margin puts a few segments in each cell it
   * crosses.
   *
   * @param points The projected margin.
   * @param box Its bounding box `[lateral, up]` minimum then maximum.
   */
  function gridOf(points: readonly [number, number][], box: readonly [number, number, number, number]): IGrid {
    const n: number = points.length;
    const side: number = Math.max(1, Math.ceil(Math.sqrt(n)));
    const size: number = Math.max(box[2] - box[0], box[3] - box[1], 1e-9) / side;
    const columns: number = Math.max(1, Math.ceil((box[2] - box[0]) / size));
    const rows: number = Math.max(1, Math.ceil((box[3] - box[1]) / size));
    const cells: number[][] = Array.from({ length: columns * rows }, (): number[] => []);
    const bands: number[][] = Array.from({ length: rows }, (): number[] => []);
    const column = (u: number): number => Math.min(columns - 1, Math.max(0, Math.floor((u - box[0]) / size)));
    const rowOf = (v: number): number => Math.min(rows - 1, Math.max(0, Math.floor((v - box[1]) / size)));
    for (let i: number = 0; i < n; i++) {
      const a: [number, number] = points[(i + n - 1) % n]!;
      const c: [number, number] = points[i]!;
      const c0: number = column(Math.min(a[0], c[0]));
      const c1: number = column(Math.max(a[0], c[0]));
      const r0: number = rowOf(Math.min(a[1], c[1]));
      const r1: number = rowOf(Math.max(a[1], c[1]));
      for (let w: number = r0; w <= r1; w++) {
        bands[w]!.push(i);
        for (let k: number = c0; k <= c1; k++) cells[w * columns + k]!.push(i);
      }
    }
    return { origin: [box[0], box[1]], size, columns, rows, cells, bands };
  }

  /** Squared distance from `(u, v)` to the segment from `a` to `c`. */
  function squared(a: readonly [number, number], c: readonly [number, number], u: number, v: number): number {
    const du: number = c[0] - a[0];
    const dv: number = c[1] - a[1];
    const l: number = du * du + dv * dv;
    const w: number = l > 0 ? Math.min(1, Math.max(0, ((u - a[0]) * du + (v - a[1]) * dv) / l)) : 0;
    return (a[0] + w * du - u) ** 2 + (a[1] + w * dv - v) ** 2;
  }

  /**
   * Move a point within the projection plane onto the projected margin.
   *
   * The point keeps its depth along `forward`; its in-plane position moves
   * to the nearest point of the projected polyline. Used to place the
   * vertices where the cut crosses the margin exactly on it, instead of
   * where a linear interpolation of the signed distance put them.
   *
   * @param outline Projected margin.
   * @param p Point in mm.
   */
  export function snap(outline: IOutline, p: Readonly<Point>): Point {
    const [u, v] = project(outline.lateral, outline.up, p);
    let best: number = Infinity;
    let target: [number, number] = [u, v];
    const points: [number, number][] = outline.points;
    for (
      let i: number = 0, j: number = points.length - 1;
      i < points.length;
      j = i++
    ) {
      const a: [number, number] = points[j]!;
      const c: [number, number] = points[i]!;
      const du: number = c[0] - a[0];
      const dv: number = c[1] - a[1];
      const l: number = du * du + dv * dv;
      const w: number =
        l > 0
          ? Math.min(1, Math.max(0, ((u - a[0]) * du + (v - a[1]) * dv) / l))
          : 0;
      const d: number = (a[0] + w * du - u) ** 2 + (a[1] + w * dv - v) ** 2;
      if (d < best) {
        best = d;
        target = [a[0] + w * du, a[1] + w * dv];
      }
    }
    const du: number = target[0] - u;
    const dv: number = target[1] - v;
    return [0, 1, 2].map(
      (k: number): number =>
        p[k]! + du * outline.lateral[k]! + dv * outline.up[k]!,
    ) as Point;
  }

  /** In-plane coordinates `[lateral, up]` of a point. */
  function project(
    lateral: Readonly<Point>,
    up: Readonly<Point>,
    p: Readonly<Point>,
  ): [number, number] {
    return [
      p[0] * lateral[0] + p[1] * lateral[1] + p[2] * lateral[2],
      p[0] * up[0] + p[1] * up[1] + p[2] * up[2],
    ];
  }

  /** Margin samples used by the polyline. */
  const SAMPLES: number = 720;
}
