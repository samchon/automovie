import { AutoMovieLoftRelief, AutoMovieLoftSectionNative, type IAutoMovieLoftRelief } from "@automovie/engine";

import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";

/**
 * S00's composed horizontal section at a world height, read from its source
 * before lofting: the wall's native conic section on its four outline
 * extents with its shoulder (`AutoMovieLoftSectionNative`, the same field the
 * engine's view loft evaluates), plus every relief (breasts, buttocks) moved
 * along its own axis, exactly as the engine's chain point composes them
 * (`AutoMovieLoftPoint`). The chart is the engine's level one: phase 0 at
 * +X (anterior), pi / 2 at +Z (right), about the axis point.
 *
 * The girth check is the ISO 8559-1 taut tape: the perimeter of the convex
 * hull of the composed section, which bridges the intermammary and
 * intergluteal valleys. Its derivative with respect to one wall input (the
 * common shoulder, or the anterior extent) is analytic: the engine's native
 * field differentiates the wall point by that input when it is passed as the
 * field's station jet `[value, 1, 0]`, and the hull perimeter's derivative is
 * `sum_i (e_(i-1,i) - e_(i,i+1)) . dp_i` over the hull's vertices `p_i`, `e`
 * the unit edge directions (the hull's vertex set is locally constant).
 */
export namespace AutoMovieHumanTrunkComposedSection {
  /** A scalar outline as knots in its own parameter, with the parameter map from a world height. */
  export interface IScalar {
    /** Knot parameters, strictly increasing. */
    q: number[];

    /** Knot jets in that parameter. */
    jets: AutoMovieHumanFairOutline.IJet[];

    /** Parameter of a world height. */
    at(y: number): number;
  }

  /** The source a section reads: four scalar outlines and the reliefs. */
  export interface ISource {
    /** Anterior extent (+X of the axis), signed, mm. */
    anterior: IScalar;

    /** Posterior extent (-X), signed (negative), mm. */
    posterior: IScalar;

    /** Lateral half extent (+-Z), mm. */
    lateral: IScalar;

    /** Conic shoulder. */
    shoulder: IScalar;

    /** Each quarter's departure from the shoulder (the engine's `IShoulder.departures`, quarter order +u+v, +v-u, -u-v, -v+u); absent means none. */
    departures?: [IScalar, IScalar, IScalar, IScalar];

    /** Reliefs composed over the wall. */
    reliefs: IAutoMovieLoftRelief[];

    /** World X of the section's axis point at a height (the level course's offset); absent means the axis stands at X = 0. The outlines are signed offsets from it. */
    axis?: (y: number) => number;
  }

  /** The wall's inputs at a height: extents along +u, +v, -u, -v and the common shoulder, with optional trial replacements. */
  export interface IInputs {
    /** Extents, mm, positive. */
    extents: [number, number, number, number];

    /** Common shoulder. */
    shoulder: number;

    /** Each quarter's departure from the common shoulder; absent means none. */
    departures?: [number, number, number, number];
  }

  /** Phases of the girth readings. */
  export const PHASES: number = 720;

  /** A girth solve's stop on the residual, mm: a thousandth of the 0.1 mm a tape is read to (ISO 8559-1 reports girths in whole millimetres). */
  export const GIRTH_TOLERANCE: number = 1e-4;

  /** Value of a scalar outline at a world height. */
  export function read(scalar: IScalar, y: number): number {
    return AutoMovieHumanFairOutline.evaluate(scalar.q, scalar.jets, scalar.at(y))[0];
  }

  /** The wall inputs at a height from the outlines. */
  export function inputs(source: ISource, y: number): IInputs {
    const lat: number = read(source.lateral, y);
    const d: [IScalar, IScalar, IScalar, IScalar] | undefined = source.departures;
    return {
      extents: [read(source.anterior, y), lat, -read(source.posterior, y), lat],
      shoulder: read(source.shoulder, y),
      ...(d === undefined ? {} : { departures: [read(d[0], y), read(d[1], y), read(d[2], y), read(d[3], y)] as [number, number, number, number] }),
    };
  }

  /** Each quarter's shoulder: the common one plus its departure. */
  export function shoulders(wall: IInputs): [number, number, number, number] {
    const d: [number, number, number, number] = wall.departures ?? [0, 0, 0, 0];
    return [wall.shoulder + d[0], wall.shoulder + d[1], wall.shoulder + d[2], wall.shoulder + d[3]];
  }

  /** The wall's radius at a height and phase about the axis point. */
  export function radius(source: ISource, y: number, phi: number, wall: IInputs = inputs(source, y)): number {
    const r: number = AutoMovieLoftSectionNative.radial({ extents: wall.extents, shoulders: shoulders(wall) })(phi)[0];
    return r;
  }

  /** The reliefs' summed displacement `[dx, dz]` at a height for `n` uniform phases (fixed while only the wall changes). */
  export function offsets(source: ISource, y: number, n: number = PHASES): [number, number][] {
    const out: [number, number][] = [];
    for (let k: number = 0; k < n; ++k) {
      const phi: number = (2 * Math.PI * k) / n;
      let dx: number = 0;
      let dz: number = 0;
      for (const relief of source.reliefs) {
        const h: number = AutoMovieLoftRelief.height(relief, y, phi)[0];
        dx += h * relief.axis[0];
        dz += h * relief.axis[2];
      }
      out.push([dx, dz]);
    }
    return out;
  }

  /** The reliefs' summed displacement `[dx, dz]` at one height and phase. */
  export function displacement(source: ISource, y: number, phi: number): [number, number] {
    let dx: number = 0;
    let dz: number = 0;
    for (const relief of source.reliefs) {
      const h: number = AutoMovieLoftRelief.height(relief, y, phi)[0];
      dx += h * relief.axis[0];
      dz += h * relief.axis[2];
    }
    return [dx, dz];
  }

  /** Composed world points `[x, z]` at `n` uniform phases. */
  export function ring(source: ISource, y: number, n: number = PHASES, wall: IInputs = inputs(source, y), relief: [number, number][] = offsets(source, y, n)): [number, number][] {
    const origin: number = source.axis === undefined ? 0 : source.axis(y);
    const point: (phi: number) => [number, number] = AutoMovieLoftSectionNative.point({ extents: wall.extents, shoulders: shoulders(wall) });
    const out: [number, number][] = [];
    for (let k: number = 0; k < n; ++k) {
      const p: [number, number] = point((2 * Math.PI * k) / n);
      out.push([origin + p[0] + relief[k]![0], p[1] + relief[k]![1]]);
    }
    return out;
  }

  /** The taut-tape girth of the composed section at a height. */
  export function girth(source: ISource, y: number, wall: IInputs = inputs(source, y)): number {
    return hull(ring(source, y, PHASES, wall))[0];
  }

  /**
   * The girth and its analytic derivative with respect to one wall input,
   * with the reliefs' displacement given (`offsets`): `knob` 0..3 an extent,
   * 4 the common shoulder.
   */
  export function girthJet(wall: IInputs, relief: [number, number][], knob: 0 | 1 | 2 | 3 | 4): [number, number] {
    const extents: [number, number, number][] = wall.extents.map((e: number, k: number): [number, number, number] => [e, k === knob ? 1 : 0, 0]);
    const quarter: (s: number) => [number, number, number] = (s: number): [number, number, number] => [s, knob === 4 ? 1 : 0, 0];
    const [s0, s1, s2, s3] = shoulders(wall);
    const field: (phi: number) => { p: [number, number]; s: [number, number] } = AutoMovieLoftSectionNative.jet({ extents, shoulders: [quarter(s0), quarter(s1), quarter(s2), quarter(s3)] });
    const points: [number, number][] = [];
    const moves: [number, number][] = [];
    for (let k: number = 0; k < relief.length; ++k) {
      const j: { p: [number, number]; s: [number, number] } = field((2 * Math.PI * k) / relief.length);
      points.push([j.p[0] + relief[k]![0], j.p[1] + relief[k]![1]]);
      moves.push(j.s);
    }
    const [length, chain] = hull(points);
    let d: number = 0;
    for (let i: number = 0; i < chain.length; ++i) {
      const a: [number, number] = points[chain[(i + chain.length - 1) % chain.length]!]!;
      const p: [number, number] = points[chain[i]!]!;
      const b: [number, number] = points[chain[(i + 1) % chain.length]!]!;
      const ein: [number, number] = unit([p[0] - a[0], p[1] - a[1]]);
      const eout: [number, number] = unit([b[0] - p[0], b[1] - p[1]]);
      const m: [number, number] = moves[chain[i]!]!;
      d += (ein[0] - eout[0]) * m[0] + (ein[1] - eout[1]) * m[1];
    }
    return [length, d];
  }

  /**
   * Newton's method on the common shoulder at a height so the taut-tape
   * girth is `tape`, with the reliefs held and the analytic derivative
   * (`girthJet` knob 4), the shoulder kept in [0.02, 0.98]; a step that would
   * leave the wall's domain, or a perimeter without a positive derivative,
   * stops it with a note.
   */
  export function solveShoulder(source: ISource, y: number, tape: number, start: number, notes: string[]): number {
    const relief: [number, number][] = offsets(source, y);
    const base: IInputs = inputs(source, y);
    let u: number = start;
    for (let k: number = 0; k < 20; ++k) {
      const wall: IInputs = { ...base, shoulder: u };
      const quarters: number[] = shoulders(wall);
      if (!(wall.extents.every((e: number): boolean => e > 0) && quarters.every((s: number): boolean => s > 0 && s < 1))) {
        notes.push(`girth at ${y.toFixed(1)} mm: wall inputs leave their domain (extents ${wall.extents.map((e: number): string => e.toFixed(2)).join(", ")}, shoulders ${quarters.map((s: number): string => s.toFixed(4)).join(", ")}); Newton stopped`);
        break;
      }
      const [p, d]: [number, number] = girthJet(wall, relief, 4);
      if (!(Number.isFinite(p) && d > 0)) {
        notes.push(`girth at ${y.toFixed(1)} mm: perimeter ${p} with derivative ${d}; Newton stopped`);
        break;
      }
      if (Math.abs(p - tape) <= GIRTH_TOLERANCE) break;
      const next: number = Math.min(0.98, Math.max(0.02, u - (p - tape) / d));
      const step: number = Math.abs(next - u);
      u = next;
      if (step < 1e-10) break;
    }
    return u;
  }

  /**
   * Newton's method on the front extent (+u) at a height so the taut-tape
   * girth is `tape` (`girthJet` knob 0), the reliefs and the other inputs
   * held; returns the extent, at least 5 mm.
   */
  export function solveFront(source: ISource, y: number, tape: number, notes: string[]): number {
    const relief: [number, number][] = offsets(source, y);
    const base: IInputs = inputs(source, y);
    let u: number = base.extents[0];
    for (let k: number = 0; k < 20; ++k) {
      const wall: IInputs = { ...base, extents: [u, base.extents[1], base.extents[2], base.extents[3]] };
      const [p, d]: [number, number] = girthJet(wall, relief, 0);
      if (!(Number.isFinite(p) && d > 0)) {
        notes.push(`girth at ${y.toFixed(1)} mm: perimeter ${p} with derivative ${d} in the front extent; Newton stopped`);
        break;
      }
      const next: number = Math.max(5, u - (p - tape) / d);
      const step: number = Math.abs(next - u);
      u = next;
      if (step < 1e-9) break;
    }
    return u;
  }

  /** Perimeter of the convex hull of a closed point set (Andrew's monotone chain) and the hull's vertex indices in order. */
  export function hull(points: readonly [number, number][]): [number, number[]] {
    const order: number[] = points.map((_: [number, number], i: number): number => i).sort((i: number, j: number): number => points[i]![0] - points[j]![0] || points[i]![1] - points[j]![1]);
    const cross: (o: number, a: number, b: number) => number = (o: number, a: number, b: number): number =>
      (points[a]![0] - points[o]![0]) * (points[b]![1] - points[o]![1]) - (points[a]![1] - points[o]![1]) * (points[b]![0] - points[o]![0]);
    const lower: number[] = [];
    for (const q of order) {
      while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper: number[] = [];
    for (let i: number = order.length - 1; i >= 0; --i) {
      const q: number = order[i]!;
      while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
      upper.push(q);
    }
    const chain: number[] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    let length: number = 0;
    for (let i: number = 0; i < chain.length; ++i) {
      const a: [number, number] = points[chain[i]!]!;
      const b: [number, number] = points[chain[(i + 1) % chain.length]!]!;
      length += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return [length, chain];
  }
}

/** Unit vector of a nonzero planar vector. */
function unit(v: [number, number]): [number, number] {
  const n: number = Math.hypot(v[0], v[1]);
  return n > 0 ? [v[0] / n, v[1] / n] : [0, 0];
}
