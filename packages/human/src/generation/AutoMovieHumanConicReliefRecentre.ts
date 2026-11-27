import { AutoMovieLoftRelief } from "@automovie/engine";
import type { IAutoMovieLoftRelief, IAutoMovieViewAxis } from "@automovie/interface";

/**
 * A family's relief nets re-expressed in the chart of a family re-centred on another origin line (`AutoMovieHumanConicRecentre`): the
 * same skin, each net written over a window of the new chart.
 *
 * What a net is to the chart (`IAutoMovieLoftRelief`, `AutoMovieLoftReliefCompose.point`): the skin at a chart address `(s, t)` is the
 * wall's point there moved by `h_k(s, t) e_k(t)` for every net `k`, all read at the one address. `e_k` is a fixed world axis, or with
 * `turn` the direction `cos(t - c) axis + sin(t - c) turn` about the window's middle `c`, which turns with the chart's phase. So the
 * origin enters a net three ways: its window is a rectangle of the chart, its heights are a tensor spline over that rectangle, and a
 * turning direction is a function of the chart's own angle.
 *
 * The re-expression, net by net in the stored order, each on the nets before it:
 * - the direction field keeps its law as a function of the chart's angle, `e'_k(t') = E_k(t')` with `E_k(t) = cos(t - c) axis +
 *   sin(t - c) turn`: a net cast square to its chart stays square to the new chart (a radial net is radial about the new origin), and a
 *   fixed axis is kept;
 * - a fixed axis moves the same skin point by the same vector, so its height at a new address is the stored height at the stored
 *   address of the same point of the skin before it (`carried`);
 * - a direction that changed cannot move the same point to the same place: the new height is the distance from the new figure's point
 *   before this net, along the new direction, to the stored skin with this net (`cast`), the same surface under another
 *   correspondence of its points. Within a section plane this is one unknown, the stored phase; where a direction leaves the section
 *   plane the stored station is unknown as well (`skew`);
 * - the window is the range of the new chart's angle that the stored window's two edges take on the skin before the net, over its
 *   stations, widened to the stored precision; a window that goes once round stays whole;
 * - the heights are the least squares of the net on that window against those targets, same rows and columns, on a grid of a few
 *   samples per span. Each target is taken from the new figure as fitted so far, so what one net leaves is carried to the next and
 *   does not accumulate.
 *
 * Not exact, and measured by the caller: a tensor spline in the stored chart is not one in the new chart, because the phase map depends
 * on the station and the radius; and a row of the window where no target exists (past the family's stations, or where the stored
 * section does not hold the new origin, as under a cap's pole) is left to the net's own fairness.
 */
export namespace AutoMovieHumanConicReliefRecentre {
  /** A world vector, mm or unit. */
  export type V3 = [number, number, number];

  /**
   * A wall without its reliefs, as a chart the conversion can read.
   *
   * @evidence contracts/development/design.md#principled-representation The course whose frames chart the wall and the wall's world point at a chart address are the two things a relief is composed on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members; the caller supplies the engine's own loft or a closed form.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No section model is assumed: a cap, a roll and an origin line are whatever `point` reads.
   * @evidence contracts/development/common.md#meaningful-documentation Members state frames and units.
   */
  export interface ISkin {
    /** The course the wall is charted about: at a station, the chart's origin and its `u` and `v`. */
    axis: IAutoMovieViewAxis.IAxis;

    /** The bare wall's world point at a station, mm, and a phase, radians, of that chart. */
    point: (station: number, phase: number) => V3;

    /** The open range of stations `point` is defined on, mm. */
    stations: [number, number];
  }

  /**
   * What a conversion reads.
   *
   * @evidence contracts/development/design.md#principled-representation The stored wall with its nets is the skin to keep; the made wall is the chart to write it in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two walls, the stored nets, the sampling and two hooks for the stored precision.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The made wall need not be the stored wall: where a cap is laid again the nets carry the difference, as targets, not as an assumption.
   * @evidence contracts/development/common.md#meaningful-documentation Members state order and defaults.
   */
  export interface IProps {
    /** The stored wall, about the stored origin. */
    stored: ISkin;

    /** The wall the converted nets stand on, about the new origin, on the same section planes. */
    made: ISkin;

    /** The stored nets, in the order they are composed. */
    reliefs: readonly IAutoMovieLoftRelief[];

    /** Target samples per span of a net, each way; absent, 4. */
    samples?: number;

    /** Applied to a net's new window and directions before it is fitted: the place to round them to the precision they are stored at. */
    lay?: (net: IAutoMovieLoftRelief, stored: IAutoMovieLoftRelief) => IAutoMovieLoftRelief;

    /** Applied to a fitted net before the next net reads it: the place to round its heights to the precision they are stored at. */
    store?: (net: IAutoMovieLoftRelief, stored: IAutoMovieLoftRelief) => IAutoMovieLoftRelief;
  }

  /**
   * One converted net with how it was converted.
   *
   * @evidence contracts/development/design.md#principled-representation The net as the engine reads it, beside the facts a caller needs to judge it: its law, what it could not observe and what its spline left.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unobserved rows are counted, never filled silently.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface INet {
    /** The converted net, on the made wall's chart. */
    relief: IAutoMovieLoftRelief;

    /** How its targets were read (the namespace's text). */
    mode: "carried" | "cast" | "skew";

    /** Sampled rows that gave targets, and those that gave none. */
    rows: INetRows;

    /** The targets less the fitted net at the fit's own samples, mm. */
    residual: INetResidual;
  }

  /** The residual object of {@link INet}. */
  export type INetResidual = { mean: number; max: number };

  /** The rows object of {@link INet}. */
  export type INetRows = { observed: number; unobserved: number; first: number; last: number };

  /**
   * A stored net's window and directions in the made chart, its heights zero: the window is the range of the made chart's angle that
   * the stored window's edges take on the stored skin before the net, over the sampled stations, widened outward to four decimals
   * (about its stored middle when the edges stay mirror images about it, so a net stored as its own mirror image keeps its form); a
   * window that goes once round is kept; a turning direction keeps its law in the chart's angle, turned to the new middle.
   *
   * @param props The conversion's inputs.
   * @param index The net's place in the stored order.
   * @evidence contracts/development/implementation.md#principled-implementation A window's edge is a line of zero height, so it lies on the skin before the net, and its new chart angle is that point's polar angle about the new origin; `cos(t - c) a + sin(t - c) b` equals `cos(t - c') a' + sin(t - c') b'` for `(a', b')` the pair turned by `c' - c`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the window's stations for both edges, then the middle and the pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A window with no station on the wall, a station map, and a whole turn whose edge does not map to itself are refused; an edge is never clipped inward.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the sampled stations times the nets before.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One net's two edges coordinate no shared work beyond the pass they share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh net of zero heights.
   */
  export function lay(props: IProps, index: number): IAutoMovieLoftRelief {
    const net: IAutoMovieLoftRelief = props.reliefs[index]!;
    if (net.shift !== undefined) throw new Error("relief recentre: " + net.name + " carries a station map, which is not re-expressed");
    const stations: number[] = rows(props, net).stations;
    if (stations.length === 0) throw new Error("relief recentre: " + net.name + " has no station on the wall");
    const whole: boolean = net.phases.end - net.phases.start >= 2 * Math.PI - 1e-9;
    let [low, high]: [number, number] = [Infinity, -Infinity];
    for (const s of stations)
      [net.phases.start, net.phases.end].forEach((edge: number, side: number): void => {
        const mapped: number = angle(props.made.axis, s, composed(props.stored, props.reliefs, index, s, edge));
        const near: number = mapped + 2 * Math.PI * Math.round((edge - mapped) / (2 * Math.PI));
        if (whole && Math.abs(near - edge) > 1e-6) throw new Error("relief recentre: " + net.name + " goes once round and its edge moves in the new chart");
        if (side === 0) low = Math.min(low, near);
        else high = Math.max(high, near);
      });
    const scale: number = 10 ** WINDOW_DECIMALS;
    const stored: number = (net.phases.start + net.phases.end) / 2;
    let phases: [number, number];
    // How far the window's middle, the phase a turning direction is laid about, moves: nothing where the middle is kept.
    let turned: number = 0;
    if (whole) phases = [net.phases.start, net.phases.end];
    else if (Math.abs((low + high) / 2 - stored) < 1 / scale) {
      const half: number = Math.ceil(Math.max(stored - low, high - stored) * scale - 1e-9) / scale;
      phases = [stored - half, stored + half];
    } else {
      phases = [Math.floor(low * scale + 1e-9) / scale, Math.ceil(high * scale - 1e-9) / scale];
      turned = (phases[0] + phases[1]) / 2 - stored;
    }
    const [c, s]: [number, number] = [Math.cos(turned), Math.sin(turned)];
    const [a, b]: [readonly number[], readonly number[] | undefined] = [net.axis, net.turn];
    return {
      name: net.name,
      stations: { start: net.stations.start, end: net.stations.end },
      phases: { start: phases[0], end: phases[1] },
      axis: b === undefined || turned === 0 ? [net.axis[0], net.axis[1], net.axis[2]] : mix([c * a[0]!, c * a[1]!, c * a[2]!], s, b),
      ...(b === undefined ? {} : { turn: turned === 0 ? ([b[0]!, b[1]!, b[2]!] as V3) : mix([c * b[0]!, c * b[1]!, c * b[2]!], -s, a) }),
      rows: net.rows,
      columns: net.columns,
      heights: new Array<number>(net.rows * net.columns).fill(0),
    };
  }

  /**
   * Every stored net re-expressed on the made wall, in the stored order (the namespace's text).
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each target is the one height that puts the new figure's point on the stored skin (or, for a kept axis, the stored height of the same skin point); the net is the least squares of a tensor spline on a tensor grid, which separates into one solve per direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Per net: lay the window, read the targets row by row, solve along the phases and along the stations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A row without a target is left out and counted; a kept axis on skin that left its section plane is refused; no height is clamped and no residual hidden.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the samples times the nets before, with two dense solves of at most a net's columns.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A net's two normal matrices are factored once and serve every row and column; each target reads the nets already converted.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One target grid lives per net; the result holds the nets alone.
   */
  export function convert(props: IProps): INet[] {
    const samples: number = props.samples ?? 4;
    if (!(Number.isInteger(samples) && samples >= 2)) throw new Error("relief recentre: at least two samples per span are needed");
    const out: INet[] = [];
    const made: IAutoMovieLoftRelief[] = [];
    props.reliefs.forEach((stored: IAutoMovieLoftRelief, index: number): void => {
      const laid: IAutoMovieLoftRelief = props.lay === undefined ? lay(props, index) : props.lay(lay(props, index), stored);
      const kept: boolean =
        stored.turn === undefined && laid.turn === undefined && laid.axis.every((x: number, c: number): boolean => x === stored.axis[c]);
      const sampled: { stations: number[]; parameters: number[]; skipped: number } = rows(props, laid);
      const columns: number = samples * (laid.columns - 3);
      const width: number = laid.phases.end - laid.phases.start;
      const phases: number[] = Array.from({ length: columns }, (_: unknown, j: number): number => laid.phases.start + (width * (j + 0.5)) / columns);
      let mode: INet["mode"] = kept ? "carried" : "cast";
      const targets: number[][] = [];
      const observed: number[] = [];
      let unobserved: number = sampled.skipped;
      sampled.stations.forEach((s: number, i: number): void => {
        const frame = props.stored.axis.at(s);
        const normal: V3 = unit(cross(frame.u, frame.v));
        const flat: boolean = planar(props.reliefs, index, s, normal);
        const row: number[] = [];
        for (const t of phases) {
          const q: V3 = composed(props.made, made, index, s, t);
          const start: number = angle(props.stored.axis, s, q);
          let height: number | null = null;
          if (kept) {
            // The stored address of the same skin point: the nearest point of the stored skin before this net, in the section plane.
            if (!flat) throw new Error("relief recentre: " + stored.name + " keeps its axis on skin that left its section plane at station " + s);
            const offset = (tau: number): number => {
              const [p0, p1]: V3[] = [composed(props.stored, props.reliefs, index, s, tau - 1e-6), composed(props.stored, props.reliefs, index, s, tau + 1e-6)];
              return dot(sub(composed(props.stored, props.reliefs, index, s, tau), q), unit(sub(p1!, p0!)));
            };
            const tau: number | null = root(offset, start, 1e-5);
            if (tau !== null) height = AutoMovieLoftRelief.height(stored, s, tau)[0];
          } else {
            const e: V3 = AutoMovieLoftRelief.direction(laid, t)[0];
            if (flat && Math.abs(dot(e, normal)) <= PLANAR && Math.abs(dot(stored.axis, normal)) <= PLANAR && (stored.turn === undefined || Math.abs(dot(stored.turn, normal)) <= PLANAR)) {
              // Within the section plane: the stored phase at which the stored skin with this net crosses the line through `q` along `e`.
              const across: V3 = unit(cross(normal, e));
              const tau: number | null = root((x: number): number => dot(sub(composed(props.stored, props.reliefs, index + 1, s, x), q), across), start, 1e-6);
              if (tau !== null) height = dot(sub(composed(props.stored, props.reliefs, index + 1, s, tau), q), e);
            } else {
              mode = "skew";
              height = skew(props, index, s, start, q, e);
            }
          }
          if (height === null) break;
          row.push(height);
        }
        if (row.length === columns) {
          targets.push(row);
          observed.push(i);
        } else ++unobserved;
      });
      if (observed.length === 0) throw new Error("relief recentre: " + stored.name + " has no observed row");

      // The least squares, one direction at a time: along the phases for every observed row, then along the stations for every column.
      const across = design(phases.map((_: number, j: number): number => ((j + 0.5) / columns) * (laid.columns - 3)), laid.columns);
      const along = design(observed.map((i: number): number => sampled.parameters[i]!), laid.rows);
      const [freeRows, freeColumns]: [number, number] = [laid.rows - 6, laid.columns - 6];
      const reduced: number[][] = targets.map((row: number[]): number[] =>
        across.solve(Array.from({ length: freeColumns }, (_: unknown, b: number): number => across.matrix.reduce((sum: number, weight: number[], j: number): number => sum + weight[b]! * row[j]!, 0))),
      );
      const heights: number[] = new Array<number>(laid.rows * laid.columns).fill(0);
      for (let b: number = 0; b < freeColumns; ++b) {
        const column: number[] = along.solve(
          Array.from({ length: freeRows }, (_: unknown, a: number): number => along.matrix.reduce((sum: number, weight: number[], i: number): number => sum + weight[a]! * reduced[i]![b]!, 0)),
        );
        for (let a: number = 0; a < freeRows; ++a) heights[(a + 3) * laid.columns + b + 3] = column[a]!;
      }
      const fitted: IAutoMovieLoftRelief = { ...laid, heights };
      const finished: IAutoMovieLoftRelief = props.store === undefined ? fitted : props.store(fitted, stored);
      let [sum, worst]: [number, number] = [0, 0];
      observed.forEach((i: number, r: number): void =>
        phases.forEach((t: number, j: number): void => {
          const d: number = Math.abs(targets[r]![j]! - AutoMovieLoftRelief.height(finished, sampled.stations[i]!, t)[0]);
          sum += d;
          worst = Math.max(worst, d);
        }),
      );
      made.push(finished);
      out.push({
        relief: finished,
        mode,
        rows: { observed: observed.length, unobserved, first: sampled.stations[observed[0]!]!, last: sampled.stations[observed.at(-1)!]! },
        residual: { mean: sum / (observed.length * columns), max: worst },
      });
    });
    return out;
  }

  /*
   * Decimals a window's edge is stored at, radians.
   */
  const WINDOW_DECIMALS: number = 4;

  /*
   * Largest share of a direction along the course for it to count as lying in the section plane.
   */
  const PLANAR: number = 1e-9;
  /*
   * Weight of the second-difference fairness beside the data, relative to the data's own scale: it decides only what no sample sees.
   */
  const FAIR: number = 1e-9;
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: readonly number[], b: readonly number[]): V3 => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const mix = (a: readonly number[], k: number, b: readonly number[]): V3 => [a[0]! + k * b[0]!, a[1]! + k * b[1]!, a[2]! + k * b[2]!];

  const sub = (a: readonly number[], b: readonly number[]): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];

  const unit = (a: readonly number[]): V3 => {
    const n: number = Math.hypot(a[0]!, a[1]!, a[2]!);
    return [a[0]! / n, a[1]! / n, a[2]! / n];
  };

  /*
   * A wall's point with the first `count` nets composed on it, as `AutoMovieLoftReliefCompose.point` composes them.
   */
  function composed(skin: ISkin, nets: readonly IAutoMovieLoftRelief[], count: number, station: number, phase: number): V3 {
    const p: V3 = skin.point(station, phase);
    for (let k: number = 0; k < count; ++k) {
      const h: number = AutoMovieLoftRelief.height(nets[k]!, station, phase)[0];
      if (h === 0) continue;
      const e: readonly number[] = AutoMovieLoftRelief.direction(nets[k]!, phase)[0];
      for (let c: number = 0; c < 3; ++c) p[c]! += h * e[c]!;
    }
    return p;
  }

  /*
   * The chart angle of a world point about a course's origin at a station, radians.
   */
  function angle(axis: IAutoMovieViewAxis.IAxis, station: number, p: readonly number[]): number {
    const frame = axis.at(station);
    const d: V3 = sub(p, frame.origin);
    return Math.atan2(dot(d, frame.v), dot(d, frame.u));
  }

  /*
   * Whether every net of the first `count` whose window holds the station moves its points within the section plane.
   */
  function planar(nets: readonly IAutoMovieLoftRelief[], count: number, station: number, normal: readonly number[]): boolean {
    for (let k: number = 0; k < count; ++k) {
      const net: IAutoMovieLoftRelief = nets[k]!;
      if (station <= net.stations.start || station >= net.stations.end) continue;
      if (Math.abs(dot(net.axis, normal)) > PLANAR || (net.turn !== undefined && Math.abs(dot(net.turn, normal)) > PLANAR)) return false;
    }
    return true;
  }

  /*
   * A root of `f` by Newton's method on a central difference, from `start`; null when it does not settle.
   *
   * The functions solved here are a smooth skin's offset from a line, read in millimetres over a phase in radians, so a step of 1e-6 rad
   * differences them well above rounding and an offset under 1e-9 mm is the root.
   */
  function root(f: (x: number) => number, start: number, step: number): number | null {
    let x: number = start;
    for (let i: number = 0; i < 40; ++i) {
      const y: number = f(x);
      if (!Number.isFinite(y)) return null;
      if (Math.abs(y) < 1e-9) return x;
      const slope: number = (f(x + step) - f(x - step)) / (2 * step);
      if (!Number.isFinite(slope) || slope === 0) return null;
      // A step is held to a quarter radian: the offset is monotone only near the root.
      x -= Math.max(-0.25, Math.min(0.25, y / slope));
    }
    return null;
  }

  /*
   * The four weights of a clamped-free uniform cubic B-spline at a parameter of `[0, count - 3]` and the first control they apply to:
   * `AutoMovieLoftRelief`'s own basis, which this module needs as a design matrix and the engine keeps private.
   */
  function weights(x: number, count: number): [number, number[]] {
    const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
    const f: number = x - i;
    return [i, [(1 - f) ** 3 / 6, (3 * f ** 3 - 6 * f ** 2 + 4) / 6, (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6, f ** 3 / 6]];
  }

  /*
   * The inverse of a net's normal matrix along one direction: `B^T B` over its free controls (all but the three outer rings) for samples
   * at the given parameters, with the second-difference fairness added, as a dense solve of a symmetric positive definite system.
   * Returns: The design matrix, samples by free controls, and a solver of `(B^T B + fairness) x = b`.
   */
  function design(parameters: readonly number[], count: number): { matrix: number[][]; solve: (b: number[]) => number[] } {
    const free: number = count - 6;
    const matrix: number[][] = parameters.map((x: number): number[] => {
      const row: number[] = new Array<number>(free).fill(0);
      const [first, w]: [number, number[]] = weights(x, count);
      for (let a: number = 0; a < 4; ++a) {
        const control: number = first + a - 3;
        if (control >= 0 && control < free) row[control] = w[a]!;
      }
      return row;
    });
    const normal: number[][] = Array.from({ length: free }, (): number[] => new Array<number>(free).fill(0));
    for (const row of matrix) for (let i: number = 0; i < free; ++i) if (row[i] !== 0) for (let j: number = 0; j < free; ++j) normal[i]![j]! += row[i]! * row[j]!;
    let trace: number = 0;
    for (let i: number = 0; i < free; ++i) trace += normal[i]![i]!;
    const fair: number = FAIR * Math.max(trace / free, 1e-12);
    // The zero rings stand beside the free controls, so the second difference runs over them too: controls -1 and `free` are zero.
    for (let i: number = -1; i <= free; ++i) {
      const stencil: [number, number][] = [[i - 1, 1], [i, -2], [i + 1, 1]];
      for (const [p, wp] of stencil) for (const [q, wq] of stencil) if (p >= 0 && p < free && q >= 0 && q < free) normal[p]![q]! += fair * wp * wq;
    }
    // Cholesky, `normal = L L^T`.
    const lower: number[][] = Array.from({ length: free }, (): number[] => new Array<number>(free).fill(0));
    for (let i: number = 0; i < free; ++i)
      for (let j: number = 0; j <= i; ++j) {
        let sum: number = normal[i]![j]!;
        for (let k: number = 0; k < j; ++k) sum -= lower[i]![k]! * lower[j]![k]!;
        if (i === j) {
          if (!(sum > 0)) throw new Error("relief recentre: a net's normal matrix is not positive definite");
          lower[i]![i] = Math.sqrt(sum);
        } else lower[i]![j] = sum / lower[j]![j]!;
      }
    const solve = (b: number[]): number[] => {
      const y: number[] = new Array<number>(free);
      for (let i: number = 0; i < free; ++i) {
        let sum: number = b[i]!;
        for (let k: number = 0; k < i; ++k) sum -= lower[i]![k]! * y[k]!;
        y[i] = sum / lower[i]![i]!;
      }
      const x: number[] = new Array<number>(free);
      for (let i: number = free - 1; i >= 0; --i) {
        let sum: number = y[i]!;
        for (let k: number = i + 1; k < free; ++k) sum -= lower[k]![i]! * x[k]!;
        x[i] = sum / lower[i]![i]!;
      }
      return x;
    };
    return { matrix, solve };
  }

  /*
   * The stations a net's targets are sampled at: `samples` per span, at the spans' interior, kept where both walls stand.
   */
  function rows(props: IProps, net: IAutoMovieLoftRelief): { stations: number[]; parameters: number[]; skipped: number } {
    const count: number = (props.samples ?? 4) * (net.rows - 3);
    const [from, to]: [number, number] = [Math.max(props.stored.stations[0], props.made.stations[0]), Math.min(props.stored.stations[1], props.made.stations[1])];
    const [stations, parameters]: [number[], number[]] = [[], []];
    for (let i: number = 0; i < count; ++i) {
      const share: number = (i + 0.5) / count;
      const s: number = net.stations.start + (net.stations.end - net.stations.start) * share;
      if (s <= from || s >= to) continue;
      stations.push(s);
      parameters.push(share * (net.rows - 3));
    }
    return { stations, parameters, skipped: count - stations.length };
  }

  /*
   * The height along `e` from `q` to the stored skin with net `index`, where the stored point's station is unknown too: Newton's method on
   * the stored address `(station, phase)` for the two components of the offset square to `e`, from the address of `q`'s own station and
   * stored chart angle; null when it does not settle or leaves the wall.
   */
  function skew(props: IProps, index: number, station: number, phase: number, q: V3, e: V3): number | null {
    const helper: V3 = Math.abs(e[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const p1: V3 = unit(cross(e, helper));
    const p2: V3 = cross(e, p1);
    const [from, to]: [number, number] = props.stored.stations;
    const offset = (s: number, t: number): [number, number, V3] => {
      const d: V3 = sub(composed(props.stored, props.reliefs, index + 1, s, t), q);
      return [dot(d, p1), dot(d, p2), d];
    };
    let [s, t]: [number, number] = [station, phase];
    for (let i: number = 0; i < 40; ++i) {
      if (s <= from || s >= to) return null;
      const [f1, f2, d]: [number, number, V3] = offset(s, t);
      if (Math.hypot(f1, f2) < 1e-9) return dot(d, e);
      const [hs, ht]: [number, number] = [Math.min(1e-3, (s - from) / 2, (to - s) / 2), 1e-6];
      const [a, b, c, g]: [number, number, V3][] = [offset(s + hs, t), offset(s - hs, t), offset(s, t + ht), offset(s, t - ht)];
      const [j11, j21]: [number, number] = [(a![0] - b![0]) / (2 * hs), (a![1] - b![1]) / (2 * hs)];
      const [j12, j22]: [number, number] = [(c![0] - g![0]) / (2 * ht), (c![1] - g![1]) / (2 * ht)];
      const det: number = j11 * j22 - j12 * j21;
      if (!Number.isFinite(det) || det === 0) return null;
      s -= Math.max(-5, Math.min(5, (f1 * j22 - f2 * j12) / det));
      t -= Math.max(-0.25, Math.min(0.25, (f2 * j11 - f1 * j21) / det));
    }
    return null;
  }
}
