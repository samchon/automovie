import { AutoMovieStationHermite } from "@automovie/engine";
import type { IAutoMovieHumanSeam } from "./IAutoMovieHumanSeam";

/**
 * A transfinite patch closing a junction where more than two pieces meet (a
 * web, the axilla, the groin, a digit root): four published boundary
 * ribbons, one per side, and the Hermite boolean sum of them.
 *
 * On the unit chart `(u, v)` the bottom side is `v = 0`, the right `u = 1`,
 * the top `v = 1` and the left `u = 0`; each side runs with increasing `u` or
 * `v` and is a ribbon (rule J4) whose `across` derivative points into the
 * patch. With `H_k` the Hermite bases of order r (cubic for G1, quintic for
 * G2) and `F_k` a side's k-th cross derivative,
 *
 * ```text
 * P = sum_k H_k(v) F^bottom/top_k(u) + sum_k H_k(u) F^left/right_k(v) - P12
 * ```
 *
 * (Coons 1967, Gordon 1969), where `P12` is the tensor of the corner data
 * `d^i_u d^j_v P` for `i, j <= r`. Each corner entry has two candidates: the
 * horizontal side's along-derivative of its cross field and the vertical
 * side's. The owners' published mixed derivatives (rule J5) make the
 * candidates agree, and the patch is then the polynomial Coons patch. Where
 * they disagree (an incompatible twist) each entry is the Gregory blend
 * `T = V + (H - V) b^p / (a^p + b^p)`, `p = r + 1`, `a` and `b` the distances
 * from the corner in u and v: on the vertical side T is H and on the
 * horizontal side V, and its first r derivatives across either side vanish
 * there, so every side's position and cross derivatives up to order r are
 * reproduced exactly and the patch meets each neighbour with the
 * continuity its ribbon carries. The corner itself is then a removable
 * singularity of the second derivatives (Gregory 1974).
 *
 * A side's jet supplies its point, its along derivatives, its cross
 * derivatives and their mixed derivative; the along-derivatives of the
 * second cross derivative and the second along-derivative of the first,
 * needed only for a G2 patch's corner entries and its own second
 * derivatives, are read by five-point stencils of the published jet over
 * 1e-3 of the side. They shape the interior only: the boundary
 * reproduction above uses the same numbers on both sides of the boolean sum.
 */
export namespace AutoMovieHumanSeamPatch {
  /** A side of the patch: a ribbon's jet at chart parameter w in [0, 1], across into the patch. */
  export type Side = (w: number) => IAutoMovieHumanSeam.ISurfaceJet;

  /** A patch ready to evaluate. */
  export interface IPatch {
    /** Name in errors. */
    name: string;

    /** Hermite order: 1 for G1 sides, 2 when any side declares G2. */
    order: 1 | 2;

    /** Sides in the order bottom, right, top, left. */
    sides: [Side, Side, Side, Side];

    /** The four corners at (0, 0), (1, 0), (0, 1), (1, 1). */
    corners: ICorner[];
  }

  /** One corner's data and how well its two sides agree there. */
  export interface ICorner {
    /** Distance between the two sides' corner points, mm. */
    gap: number;

    /** Largest disagreement of a first-order entry (the sides' tangents and cross derivatives), mm. */
    first: number;

    /** Disagreement of the mixed derivative (the twist the owners publish), mm. */
    twist: number;

    /** Largest disagreement of any entry; above rounding, the corner is Gregory-blended. */
    mismatch: number;

    /** Horizontal side's entries `H[i][j] = d^i_u d^j_v P`. */
    horizontal: number[][][];

    /** Vertical side's entries, same layout. */
    vertical: number[][][];
  }

  /** A patch point with its partial derivatives in chart units. */
  export interface IJet {
    /** Point, mm. */
    p: number[];

    /** First u derivative. */
    u: number[];

    /** First v derivative. */
    v: number[];

    /** Second u derivative. */
    uu: number[];

    /** Mixed derivative. */
    uv: number[];

    /** Second v derivative. */
    vv: number[];
  }

  /**
   * A side from an owner's published seam jet (J4): the stretch `[from, to]`
   * of the owner's seam parameter maps to the side's chart `w`, and the
   * ribbon leaves the owner along `alpha D1 + beta c'`, in chart units.
   *
   * @param owner The owner's jet along its seam, `across` pointing into the patch.
   * @param from Seam parameter at w = 0.
   * @param to Seam parameter at w = 1; below `from` runs the seam backward.
   * @param alpha Share of the owner's cross derivative, positive.
   * @param beta Share of the seam's tangent, per unit of the owner's seam parameter.
   */
  export function side(
    owner: (a: number) => IAutoMovieHumanSeam.ISurfaceJet,
    from: number,
    to: number,
    alpha: number,
    beta: number,
  ): Side {
    if (!(alpha > 0)) throw new Error(`A patch side needs a positive cross share, not ${alpha}`);
    const d: number = to - from;
    return (w: number): IAutoMovieHumanSeam.ISurfaceJet => {
      const j: IAutoMovieHumanSeam.ISurfaceJet = owner(from + w * d);
      const mix = (x: number, a: readonly number[], y: number, b: readonly number[]): number[] =>
        a.map((v: number, k: number): number => x * v + y * b[k]!);
      return {
        point: [...j.point],
        along: j.along.map((v: number): number => d * v),
        alongSecond: j.alongSecond.map((v: number): number => d * d * v),
        across: mix(alpha, j.across, beta, j.along),
        acrossSecond: j.acrossSecond.map(
          (v: number, k: number): number =>
            alpha * alpha * v + 2 * alpha * beta * j.twist[k]! + beta * beta * j.alongSecond[k]!,
        ),
        twist: mix(d * alpha, j.twist, d * beta, j.alongSecond),
      };
    };
  }

  /**
   * A patch over four sides, each declaring its continuity with the
   * neighbour that owns it. Refused: sides whose corner points miss each
   * other by more than a billionth of the patch, or a G0 side, which a
   * patch has no cross derivative to honour with.
   *
   * @param name Name in errors.
   * @param sides Bottom, right, top, left.
   * @param continuity Each side's declared continuity, in the same order.
   */
  export function create(
    name: string,
    sides: [Side, Side, Side, Side],
    continuity: [IAutoMovieHumanSeam.Continuity, IAutoMovieHumanSeam.Continuity, IAutoMovieHumanSeam.Continuity, IAutoMovieHumanSeam.Continuity],
  ): IPatch {
    if (continuity.includes("G0"))
      throw new Error(`Patch ${name} has a G0 side; a shared ring needs no patch`);
    const order: 1 | 2 = continuity.includes("G2") ? 2 : 1;
    const corner = (x: 0 | 1, y: 0 | 1): ICorner => {
      const H: number[][][] = fields(sides[y === 0 ? 0 : 2], x, y === 0 ? 1 : -1, order);
      const V: number[][][] = fields(sides[x === 0 ? 3 : 1], y, x === 0 ? 1 : -1, order);

      // H[j][i] is the horizontal side's field j differentiated i times
      // along u; V[i][j] the vertical side's field i differentiated j times
      // along v. Both as entries [i][j] of d^i_u d^j_v P.
      const horizontal: number[][][] = range(order).map((i: number): number[][] => range(order).map((j: number): number[] => H[j]![i]!));
      const vertical: number[][][] = range(order).map((i: number): number[][] => range(order).map((j: number): number[] => V[i]![j]!));
      const miss = (i: number, j: number): number => distance(horizontal[i]![j]!, vertical[i]![j]!);
      let mismatch: number = 0;
      for (const i of range(order)) for (const j of range(order)) if (i + j > 0) mismatch = Math.max(mismatch, miss(i, j));
      return { gap: miss(0, 0), first: Math.max(miss(1, 0), miss(0, 1)), twist: miss(1, 1), mismatch, horizontal, vertical };
    };
    const corners: ICorner[] = [corner(0, 0), corner(1, 0), corner(0, 1), corner(1, 1)];
    const size: number = Math.max(
      ...corners.map((c: ICorner): number => Math.hypot(...c.horizontal[0]![0]!)),
      ...[0, 1, 2, 3].map((k: number): number => distance(corners[k]!.horizontal[0]![0]!, corners[(k + 1) % 4]!.horizontal[0]![0]!)),
    );
    corners.forEach((c: ICorner, k: number): void => {
      if (c.gap > 1e-9 * size) throw new Error(`Patch ${name}: sides miss each other by ${c.gap} mm at corner ${k}`);
    });
    return { name, order, sides, corners };
  }

  /**
   * The patch's point and partial derivatives at a chart point.
   *
   * @param patch Patch from {@link create}.
   * @param u Chart parameter in [0, 1].
   * @param v Chart parameter in [0, 1].
   */
  export function evaluate(patch: IPatch, u: number, v: number): IJet {
    const r: 1 | 2 = patch.order;
    const quintic: boolean = r === 2;
    const bu: number[][] = [0, 1, 2].map((o: number): number[] => AutoMovieStationHermite.weights(u, 1, o as 0 | 1 | 2, quintic));
    const bv: number[][] = [0, 1, 2].map((o: number): number[] => AutoMovieStationHermite.weights(v, 1, o as 0 | 1 | 2, quintic));

    // Hermite basis of derivative order k at end e (0 or 1), differentiated o times.
    const basis = (b: number[][], e: number, k: number, o: number): number => b[o]![e === 0 ? k : 5 - k]!;
    const horizontal: number[][][][] = [fields(patch.sides[0], u, 1, r), fields(patch.sides[2], u, -1, r)];
    const vertical: number[][][][] = [fields(patch.sides[3], v, 1, r), fields(patch.sides[1], v, -1, r)];
    const orders: [number, number][] = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2]];
    const dim: number = horizontal[0]![0]![0]!.length;
    const out: number[][] = orders.map((): number[] => new Array<number>(dim).fill(0));
    const add = (slot: number, w: number, x: readonly number[]): void => {
      for (let k: number = 0; k < dim; k++) out[slot]![k]! += w * x[k]!;
    };

    orders.forEach(([m, n]: [number, number], slot: number): void => {
      for (const e of [0, 1])
        for (const k of range(r)) {
          // Ruled parts: the sides' fields blended across the other chart direction.
          add(slot, basis(bv, e, k, n), horizontal[e]![k]![m]!);
          add(slot, basis(bu, e, k, m), vertical[e]![k]![n]!);
        }
    });

    // The corner tensor, each entry Gregory-blended between its two sides.
    const p: number = r + 1;
    patch.corners.forEach((c: ICorner, index: number): void => {
      const x: number = index % 2;
      const y: number = index >> 1;
      const a: number = x === 0 ? u : 1 - u;
      const b: number = y === 0 ? v : 1 - v;
      const au: number = x === 0 ? 1 : -1;
      const bvSign: number = y === 0 ? 1 : -1;
      const phi: number[] = blend(a, b, p);
      for (let i: number = 0; i <= r; i++)
        for (let j: number = 0; j <= r; j++) {
          const H: number[] = c.horizontal[i]![j]!;
          const V: number[] = c.vertical[i]![j]!;
          const a0: number = basis(bu, x, i, 0);
          const a1: number = basis(bu, x, i, 1);
          const a2: number = basis(bu, x, i, 2);
          const b0: number = basis(bv, y, j, 0);
          const b1: number = basis(bv, y, j, 1);
          const b2: number = basis(bv, y, j, 2);

          // The blended entry T and its derivatives, one coordinate at a
          // time, each product formed as the Hermite weight times the entry.
          for (let k: number = 0; k < dim; k++) {
            const delta: number = H[k]! - V[k]!;
            const T: number = V[k]! + delta * phi[0]!;
            const Tu: number = delta * phi[1]! * au;
            const Tv: number = delta * phi[2]! * bvSign;
            const Tuu: number = delta * phi[3]!;
            const Tuv: number = delta * phi[4]! * au * bvSign;
            const Tvv: number = delta * phi[5]!;
            out[0]![k]! += -a0 * b0 * T;
            out[1]![k]! += -a0 * b0 * Tu;
            out[1]![k]! += -a1 * b0 * T;
            out[2]![k]! += -a0 * b0 * Tv;
            out[2]![k]! += -a0 * b1 * T;
            out[3]![k]! += -a0 * b0 * Tuu;
            out[3]![k]! += -2 * a1 * b0 * Tu;
            out[3]![k]! += -a2 * b0 * T;
            out[4]![k]! += -a0 * b0 * Tuv;
            out[4]![k]! += -a0 * b1 * Tu;
            out[4]![k]! += -a1 * b0 * Tv;
            out[4]![k]! += -a1 * b1 * T;
            out[5]![k]! += -a0 * b0 * Tvv;
            out[5]![k]! += -2 * a0 * b1 * Tv;
            out[5]![k]! += -a0 * b2 * T;
          }
        }
    });
    return { p: out[0]!, u: out[1]!, v: out[2]!, uu: out[3]!, uv: out[4]!, vv: out[5]! };
  }
}

/**
 * A side's fields `F[k][m]`: its k-th cross derivative into the patch
 * (signed into increasing chart u or v by `sign`), differentiated m times
 * along the side, for k up to the order and m up to 2.
 */
function fields(side: AutoMovieHumanSeamPatch.Side, w: number, sign: number, order: 1 | 2): number[][][] {
  const j: IAutoMovieHumanSeam.ISurfaceJet = side(w);
  const signed = (x: readonly number[]): number[] => x.map((v: number): number => sign * v);
  const out: number[][][] = [
    [[...j.point], [...j.along], [...j.alongSecond]],
    [signed(j.across), signed(j.twist), signed(along(side, w, 1, (s: IAutoMovieHumanSeam.ISurfaceJet): number[] => s.twist))],
  ];
  if (order === 2)
    out.push([
      [...j.acrossSecond],
      along(side, w, 1, (s: IAutoMovieHumanSeam.ISurfaceJet): number[] => s.acrossSecond),
      along(side, w, 2, (s: IAutoMovieHumanSeam.ISurfaceJet): number[] => s.acrossSecond),
    ]);
  return out;
}

/**
 * Along-derivative of order 1 or 2 of one of a side's fields by five-point
 * stencils over a step of 1e-3: central inside, one-sided within two steps
 * of an end, so a side is never read past its chart.
 */
function along(
  side: AutoMovieHumanSeamPatch.Side,
  w: number,
  order: 1 | 2,
  pick: (j: IAutoMovieHumanSeam.ISurfaceJet) => number[],
): number[] {
  const h: number = 1e-3;
  const central: boolean = w - 2 * h >= 0 && w + 2 * h <= 1;
  const sign: number = central ? 0 : w < 0.5 ? 1 : -1;
  const offsets: number[] = central ? [-2, -1, 0, 1, 2] : [0, 1, 2, 3, 4].map((k: number): number => sign * k);
  const weights: number[] = central
    ? order === 1 ? [1, -8, 0, 8, -1].map((c: number): number => c / (12 * h)) : [-1, 16, -30, 16, -1].map((c: number): number => c / (12 * h * h))
    : order === 1
      ? [-25, 48, -36, 16, -3].map((c: number): number => (sign * c) / (12 * h))
      : [35, -104, 114, -56, 11].map((c: number): number => c / (12 * h * h));
  const values: number[][] = offsets.map((k: number): number[] => pick(side(w + k * h)));
  return values[0]!.map((_: number, c: number): number =>
    values.reduce((s: number, x: number[], k: number): number => s + weights[k]! * x[c]!, 0),
  );
}

/**
 * The Gregory weight `phi = b^p / (a^p + b^p)` with its derivatives
 * `[phi, phi_a, phi_b, phi_aa, phi_ab, phi_bb]`; at the corner itself, where
 * it has no limit, a half and no slope (the Hermite products it multiplies
 * vanish there with their first r derivatives).
 */
function blend(a: number, b: number, p: number): number[] {
  const ap: number = a ** p;
  const bp: number = b ** p;
  const D: number = ap + bp;
  if (D === 0) return [0.5, 0, 0, 0, 0, 0];
  const D2: number = D * D;
  const D3: number = D2 * D;
  return [
    bp / D,
    (-p * a ** (p - 1) * bp) / D2,
    (p * b ** (p - 1) * ap) / D2,
    (-p * bp * a ** (p - 2) * ((p - 1) * D - 2 * p * ap)) / D3,
    (-p * p * a ** (p - 1) * b ** (p - 1) * (ap - bp)) / D3,
    (p * ap * b ** (p - 2) * ((p - 1) * D - 2 * p * bp)) / D3,
  ];
}

/** `[0, 1, ..., order]`. */
function range(order: number): number[] {
  return Array.from({ length: order + 1 }, (_: unknown, k: number): number => k);
}

/** Euclidean distance. */
function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(...a.map((v: number, k: number): number => v - b[k]!));
}
