import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftJet } from "../lofting/AutoMovieHumanLoftJet";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The strip joining an appendage's end ring to its root loop on a base
 * (the redesign plan's section 3).
 *
 * At each phase u of the appendage's end ring, the strip's column is a
 * clamped cubic B-spline in w from the appendage (w = 0) to the base
 * (w = 1) on uniform knots. Its three control rows at each edge are set by
 * that edge's point and its first and second cross derivatives by arc
 * length, scaled by the edge length `l` (the root's reach times the chord
 * between the edges) and `l^2`, so the strip meets both surfaces with their
 * positions, tangent planes and curvatures (G2) by construction. With knot
 * span h, at w = 0
 *
 * ```text
 * P_0 = A,   P_1 = A + h A' / 3,   P_2 = A + h A' + h^2 A'' / 3
 * ```
 *
 * and symmetrically at w = 1 with the derivatives taken toward the base.
 * Each interior row is the quintic Hermite blend of the two edges at its
 * Greville abscissa, offset in the blend's local frame (its unit tangent
 * along the ring, its unit normal and their cross product) by the root's
 * fitted rows, periodic cubic B-splines in u, so whatever moves an edge
 * carries them. Edge derivatives come from the chains' jets where they
 * carry them, otherwise from differences of the chain functions.
 */
export namespace AutoMovieHumanBodyStrip {
  /** Both edges of one column: points and outward arc-length derivatives. */
  export interface IColumn {
    /** Appendage end point. */
    A: V;

    /** Appendage's unit tangent leaving its end, into the strip. */
    a1: V;

    /** Appendage's curvature vector there. */
    a2: V;

    /** Base point on the root loop. */
    C: V;

    /** Base's unit tangent across the loop, away from the hole. */
    c1: V;

    /** Base's curvature vector there. */
    c2: V;

    /** Edge length: the reach times the chord between the edges, mm. */
    l: number;
  }

  /**
   * Control rows of the strip's column at ring phase u, from the appendage
   * (first) to the base (last).
   *
   * @param base Base chain.
   * @param appendage Appendage chain.
   * @param root Root description, its reach and interior rows.
   * @param u Ring phase and loop parameter, radians.
   * @param sense Turning sense of the loop in the (phase, station) plane.
   */
  export function controls(
    base: IAutoMovieHumanLoftChain,
    appendage: IAutoMovieHumanLoftChain,
    root: IAutoMovieHumanBodyCalibration.IAppendage,
    u: number,
    sense: number,
  ): V[] {
    const c: IColumn = column(base, appendage, root, u, sense);
    const rows: number[][] = root.rows ?? [];
    const n: number = 6 + rows.length;
    const h: number = 1 / (n - 3);
    const out: V[] = new Array<V>(n);

    // Edge rows from the clamped B-spline's end derivatives.
    const a1: V = scale(c.a1, c.l);
    const a2: V = scale(c.a2, c.l * c.l);
    const c1: V = scale(c.c1, c.l);
    const c2: V = scale(c.c2, c.l * c.l);
    out[0] = c.A;
    out[1] = add(c.A, scale(a1, h / 3));
    out[2] = add(c.A, scale(a1, h), scale(a2, (h * h) / 3));
    out[n - 1] = c.C;
    out[n - 2] = add(c.C, scale(c1, -h / 3));
    out[n - 3] = add(c.C, scale(c1, -h), scale(c2, (h * h) / 3));

    // Interior rows: the blend at each row's Greville abscissa, offset in
    // the blend's frame there; the tangent along the ring is the difference
    // of the blends of the neighbouring columns.
    if (rows.length > 0) {
      const delta: number = 1e-4;
      const before: IColumn = column(base, appendage, root, u - delta, sense);
      const after: IColumn = column(base, appendage, root, u + delta, sense);
      rows.forEach((row: number[], r: number): void => {
        const i: number = 3 + r;
        const knot = (j: number): number => Math.min(1, Math.max(0, (j - 3) * h));
        const xi: number = (knot(i + 1) + knot(i + 2) + knot(i + 3)) / 3;
        const e1: V = unit(
          add(blend(after, xi, 0), scale(blend(before, xi, 0), -1)),
        );
        const normal: V = unit(cross(e1, blend(c, xi, 1)));
        const e3: V = cross(e1, normal);
        const M: number = row.length / 3;
        const ab: [number, number, number, number] =
          AutoMovieHumanSplineCurve.evaluate(row.slice(0, 2 * M), M, u);
        const cc: number = AutoMovieHumanSplineCurve.evaluate(
          [...row.slice(2 * M), ...row.slice(2 * M)],
          M,
          u,
        )[0];
        out[i] = add(
          blend(c, xi, 0),
          scale(e1, ab[0]),
          scale(normal, ab[1]),
          scale(e3, cc),
        );
      });
    }
    return out;
  }

  /** Point of a strip column at w from its control rows. */
  export function point(rows: readonly V[], w: number): V {
    const n: number = rows.length;
    const spans: number = n - 3;
    const x: number = Math.min(1, Math.max(0, w)) * spans;
    const span: number = Math.min(spans - 1, Math.floor(x));
    const knot = (j: number): number =>
      Math.min(spans, Math.max(0, j - 3));

    // The basis functions of the span by the triangular recurrence
    // (Piegl and Tiller, The NURBS Book, A2.2) on the clamped uniform
    // knots in knot units; the span `knot(s) <= x < knot(s + 1)` is s.
    const s: number = span + 3;
    const N: number[] = [1, 0, 0, 0];
    const left: number[] = [0, 0, 0, 0];
    const right: number[] = [0, 0, 0, 0];
    for (let j: number = 1; j <= 3; j++) {
      left[j] = x - knot(s + 1 - j);
      right[j] = knot(s + j) - x;
      let saved: number = 0;
      for (let r: number = 0; r < j; r++) {
        const temp: number = N[r]! / (right[r + 1]! + left[j - r]!);
        N[r] = saved + right[r + 1]! * temp;
        saved = left[j - r]! * temp;
      }
      N[j] = saved;
    }
    let out: V = [0, 0, 0];
    N.forEach((weight: number, r: number): void => {
      out = add(out, scale(rows[span + r]!, weight));
    });
    return out;
  }

  /**
   * First and second derivatives of a chain along the chart direction
   * `(dt, ds)` (phase, station) at a chart point, by arc length: from its
   * jet where the chain carries one, otherwise from differences of its
   * points over about {@link H} mm.
   */
  export function across(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    t: number,
    dt: number,
    ds: number,
  ): [V, V] {
    if (AutoMovieHumanLoftJet.carries(chain)) {
      const j: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.at(chain, clamp(chain, s), t);
      return arcLength(
        add(scale(j.s, ds), scale(j.t, dt)),
        add(scale(j.ss, ds * ds), scale(j.st, 2 * ds * dt), scale(j.tt, dt * dt)),
      );
    }
    const probe: V = add(surface(chain, s + ds * 1e-4, t + dt * 1e-4), scale(surface(chain, s, t), -1));
    const step: number = H / (Math.hypot(...probe) / 1e-4 || 1);
    const q = (e: number): V => surface(chain, s + ds * step * e, t + dt * step * e);
    const m: V = q(-1);
    const c: V = q(0);
    const p: V = q(1);
    return arcLength(
      scale(add(p, scale(m, -1)), 1 / (2 * H)),
      scale(add(p, scale(c, -2), m), 1 / (H * H)),
    );
  }

  /** Surface point of a chain at a chart point, the station clamped into the chain. */
  export function surface(chain: IAutoMovieHumanLoftChain, s: number, t: number): V {
    return AutoMovieHumanLoftChain.ring(chain, clamp(chain, s), [t])[0]!;
  }

  /**
   * The column at ring phase u: the appendage's end point and outward
   * station derivatives, the root loop's base point and its derivatives
   * across the loop away from the hole, and the edge length.
   */
  function column(
    base: IAutoMovieHumanLoftChain,
    appendage: IAutoMovieHumanLoftChain,
    root: IAutoMovieHumanBodyCalibration.IAppendage,
    u: number,
    sense: number,
  ): IColumn {
    const end: number =
      root.end === "bottom"
        ? appendage.layers[0]!.y
        : appendage.layers[appendage.layers.length - 1]!.y;
    const outward: number = root.end === "bottom" ? -1 : 1;
    const A: V = surface(appendage, end, u);
    const [a1, a2] = station(appendage, end, u, outward);
    const [s, remainder, ds, dr] = AutoMovieHumanSplineCurve.evaluate(root.root, root.root.length / 2, u);
    // A loop winding round the base's cap pole turns its phase once.
    const winding: number = root.winding ?? 0;
    const t: number = remainder + winding * u;
    const dt: number = dr + winding;
    const C: V = surface(base, s, t);

    // Chart direction across the loop, away from its inside: the tangent
    // (dt, ds) in (phase, station) turned clockwise, (ds, -dt).
    const [c1, c2] = across(base, s, t, sense * ds, -sense * dt);
    return { A, a1, a2, C, c1, c2, l: root.reach * Math.hypot(...add(C, scale(A, -1))) };
  }

  /**
   * Quintic Hermite blend of a column's edges at w (`order` 0) or its w
   * derivative (`order` 1): weights of the start point, start tangent,
   * start second derivative, end second derivative, end tangent, end point.
   */
  function blend(c: IColumn, w: number, order: 0 | 1): V {
    const w2: number = w * w;
    const w3: number = w2 * w;
    const w4: number = w3 * w;
    const h: number[] =
      order === 0
        ? [
            1 - 10 * w3 + 15 * w4 - 6 * w4 * w,
            w - 6 * w3 + 8 * w4 - 3 * w4 * w,
            0.5 * w2 - 1.5 * w3 + 1.5 * w4 - 0.5 * w4 * w,
            0.5 * w3 - w4 + 0.5 * w4 * w,
            -4 * w3 + 7 * w4 - 3 * w4 * w,
            10 * w3 - 15 * w4 + 6 * w4 * w,
          ]
        : [
            -30 * w2 + 60 * w3 - 30 * w4,
            1 - 18 * w2 + 32 * w3 - 15 * w4,
            w - 4.5 * w2 + 6 * w3 - 2.5 * w4,
            1.5 * w2 - 4 * w3 + 2.5 * w4,
            -12 * w2 + 28 * w3 - 15 * w4,
            30 * w2 - 60 * w3 + 30 * w4,
          ];
    return add(
      scale(c.A, h[0]!),
      scale(c.a1, h[1]! * c.l),
      scale(c.a2, h[2]! * c.l * c.l),
      scale(c.c2, h[3]! * c.l * c.l),
      scale(c.c1, h[4]! * c.l),
      scale(c.C, h[5]!),
    );
  }

  /**
   * First and second derivatives of a chain at its end along its station,
   * outward and by arc length: from its jet where it carries one, otherwise
   * from one-sided differences into the chain.
   */
  function station(
    chain: IAutoMovieHumanLoftChain,
    end: number,
    u: number,
    outward: number,
  ): [V, V] {
    if (AutoMovieHumanLoftJet.carries(chain)) {
      const j: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.at(chain, end, u);
      return arcLength(scale(j.s, outward), j.ss);
    }
    const p0: V = surface(chain, end, u);
    const p1: V = surface(chain, end - outward * H, u);
    const p2: V = surface(chain, end - 2 * outward * H, u);
    return arcLength(
      scale(add(scale(p0, 3), scale(p1, -4), p2), 1 / (2 * H)),
      scale(add(p0, scale(p1, -2), p2), 1 / (H * H)),
    );
  }

  /**
   * Derivatives of a curve reparameterized by arc length: the unit tangent
   * and the curvature vector, the second derivative's part across the
   * tangent.
   */
  function arcLength(d1: V, d2: V): [V, V] {
    const speed: number = Math.hypot(...d1) || 1;
    const T: V = scale(d1, 1 / speed);
    const along: number = (d2[0] * T[0] + d2[1] * T[1] + d2[2] * T[2]) / speed;
    return [T, scale(add(d2, scale(T, -along * speed)), 1 / (speed * speed))];
  }

  /** Station step of the difference derivatives, mm. */
  const H: number = 0.05;
}

/** A world vector, mm. */
type V = [number, number, number];

/** A station clamped into a chain's range. */
function clamp(chain: IAutoMovieHumanLoftChain, s: number): number {
  return Math.min(chain.layers[chain.layers.length - 1]!.y, Math.max(chain.layers[0]!.y, s));
}

/** Sum of vectors. */
function add(...vs: V[]): V {
  const out: V = [0, 0, 0];
  for (const v of vs) for (let k: number = 0; k < 3; k++) out[k] += v[k]!;
  return out;
}

/** Vector times a scalar. */
function scale(v: V, k: number): V {
  return [v[0] * k, v[1] * k, v[2] * k];
}

/** Cross product. */
function cross(a: V, b: V): V {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Unit vector, or zero for a zero vector. */
function unit(v: V): V {
  const l: number = Math.hypot(v[0], v[1], v[2]);
  return l > 0 ? scale(v, 1 / l) : [0, 0, 0];
}
