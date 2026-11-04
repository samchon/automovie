import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieStationHermite } from "@automovie/engine";
import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/**
 * The shared mathematics of the trunk's section pieces: the quadrant rule the
 * guides stand on, the jets of a guide on it, the sector arc between two
 * guides and the reflection of the canonical left side.
 *
 * A section's left half runs from the front midline (phase 0) round the
 * body's left (+z) to the back midline (phase pi). In normalised quadrant
 * coordinates `zeta = z / width` and `xi = (x - middle) / depth`, the front
 * and the back quadrant each lie on `zeta^n + xi^n = 1`. The guides stand on
 * that curve at fixed lateral shares and own its point, tangent and
 * curvature there; at the midlines and at the widest point, where a quadrant
 * with n > 2 has no curvature, a guide takes the osculating parabola's
 * through its next guide instead, so no guide flattens into a stripe. A
 * sector between two guides is the quintic Hermite of their two jets, so it
 * meets both with their curvature (G2). Section vectors are `[x, z]` in
 * calibration millimetres.
 */
export namespace AutoMovieHumanTrunkQuadrant {
  /** One horizontal section's measures, canonical left half. */
  export type ISection = IAutoMovieHumanTrunkSection;

  /** A side of the section. */
  export type Side = "front" | "back";

  /** Control points of the trunk's sections. */
  export const ORDER: number = 256;

  /**
   * The normalised quadrant `xi(zeta) = (1 - zeta^n)^(1/n)` with its first
   * and second derivatives in zeta.
   *
   * @param zeta Lateral share of the half width, clamped just inside [0, 1).
   * @param n Squareness.
   * @returns `[xi, d xi / d zeta, d2 xi / d zeta2]`.
   */
  export function quadrant(zeta: number, n: number): [number, number, number] {
    const z: number = Math.min(1 - 1e-9, Math.max(0, zeta));
    const u: number = 1 - z ** n;
    const xi: number = u ** (1 / n);
    const d1: number = -(z ** (n - 1)) * u ** (1 / n - 1);
    const d2: number = -(n - 1) * z ** (n - 2) * u ** (1 / n - 2);

    return [xi, d1, d2];
  }

  /**
   * Depth of a side from the widest point.
   *
   * @param s The section.
   * @param side The quadrant.
   * @returns The depth, mm.
   */
  export function depth(s: ISection, side: Side): number {
    return side === "front" ? s.front - s.middle : s.middle - s.back;
  }

  /**
   * Squareness of a side.
   *
   * @param s The section.
   * @param side The quadrant.
   * @returns The exponent n.
   */
  export function square(s: ISection, side: Side): number {
    return side === "front" ? s.squareFront : s.squareBack;
  }

  /**
   * The base point of a side at a lateral share, before the displacements.
   *
   * @param s The section.
   * @param side The quadrant.
   * @param zeta Lateral share of the half width.
   * @returns The point `[x, z]`, mm.
   */
  export function base(s: ISection, side: Side, zeta: number): [number, number] {
    const xi: number = quadrant(zeta, square(s, side))[0];
    const sign: number = side === "front" ? 1 : -1;

    return [s.middle + sign * depth(s, side) * xi, s.width * zeta];
  }

  /**
   * The displacement of a side at a lateral place with its z derivatives.
   *
   * @param s The section.
   * @param side The quadrant.
   * @param z Lateral place, mm.
   * @returns `[f, f_z, f_zz]`, mm.
   */
  export function fold(s: ISection, side: Side, z: number): [number, number, number] {
    return side === "front" ? s.foldFront(z) : s.foldBack(z);
  }

  /**
   * The jet of a guide standing on a side's quadrant at an interior lateral
   * share, by arclength, in the direction of rising phase (front: z rising;
   * back: z falling).
   *
   * @param s The section.
   * @param side The quadrant.
   * @param zeta Lateral share of the guide.
   * @param folded Whether the displacement is added.
   * @returns The jet `(point, tangent, curvature vector)`.
   */
  export function onQuadrant(
    s: ISection,
    side: Side,
    zeta: number,
    folded: boolean = true,
  ): IAutoMovieHumanSeam.IArcJet {
    const [xi, x1, x2]: [number, number, number] = quadrant(zeta, square(s, side));
    const d: number = depth(s, side);
    const sign: number = side === "front" ? 1 : -1;
    const z: number = s.width * zeta;
    const [f0, f1, f2]: [number, number, number] = folded ? fold(s, side, z) : [0, 0, 0];

    // With x(z) = middle + sign (d xi(z / w) - fold(z)), its derivatives in z
    // follow by the chain rule; the front runs with z rising and the back
    // against it, which changes the sign of the first derivative only.
    const point: number[] = [s.middle + sign * (d * xi - f0), z];
    const dx: number = sign * ((d * x1) / s.width - f1);
    const ddx: number = sign * ((d * x2) / (s.width * s.width) - f2);
    const run: number = side === "front" ? 1 : -1;

    return AutoMovieHumanSeam.publish(point, [run * dx, run], [ddx, 0]);
  }

  /**
   * The jet at a midline: the point at zeta 0, the tangent across the
   * midline and the curvature of the parabola through the next guide, the
   * displacement's curvature added.
   *
   * @param s The section.
   * @param side The quadrant.
   * @param next Lateral share of the next guide.
   * @param folded Whether the displacement is added.
   * @returns The jet.
   */
  export function onMidline(
    s: ISection,
    side: Side,
    next: number,
    folded: boolean = true,
  ): IAutoMovieHumanSeam.IArcJet {
    const d: number = depth(s, side);
    const xiNext: number = quadrant(next, square(s, side))[0];
    const sign: number = side === "front" ? 1 : -1;
    const [f0, , f2]: [number, number, number] = folded ? fold(s, side, 0) : [0, 0, 0];

    // Through the next guide the midline's own parabola is
    // x = middle + sign d (1 - c zeta^2 / 2) with c = 2 (1 - xi) / zeta^2,
    // whose curvature is d c / w^2; the displacement's second derivative adds.
    const c: number = (2 * (1 - xiNext)) / (next * next);
    const kappa: number = (d * c) / (s.width * s.width) + f2;

    return {
      point: [s.middle + sign * (d - f0), 0],
      tangent: side === "front" ? [0, 1] : [0, -1],
      curvature: [-sign * kappa, 0],
    };
  }

  /**
   * The jet at the widest point: the tangent runs toward the back, and the
   * curvature is the mean of the two quadrants' parabolas through the guides
   * either side of it, each in world terms, so both flank sectors share it.
   *
   * @param s The section.
   * @param before Lateral share of the guide in front of the widest point.
   * @param after Lateral share of the guide behind it.
   * @returns The jet.
   */
  export function onWidest(s: ISection, before: number, after: number): IAutoMovieHumanSeam.IArcJet {
    const parabola = (side: Side, share: number): number => {
      const d: number = depth(s, side);
      const xi: number = quadrant(share, square(s, side))[0];

      // Near the widest point zeta = 1 - c xi^2 / 2, so z = w - w c xi^2 / 2
      // and the curvature is w c / d^2.
      const c: number = (2 * (1 - share)) / (xi * xi);

      return (s.width * c) / (d * d);
    };
    const kappa: number = (parabola("front", before) + parabola("back", after)) / 2;

    return { point: [s.middle, s.width], tangent: [-1, 0], curvature: [0, -kappa] };
  }

  /**
   * Arclength of a side's base quadrant between two lateral shares, as a
   * polyline of 128 chords crowded toward the widest point, where the
   * quadrant's slope in zeta runs to infinity.
   *
   * @param s The section.
   * @param side The quadrant.
   * @param from Lateral share at one end.
   * @param to Lateral share at the other.
   * @returns The length, mm.
   */
  export function arclength(s: ISection, side: Side, from: number, to: number): number {
    const lo: number = Math.min(from, to);
    const hi: number = Math.max(from, to);
    const count: number = 128;
    let sum: number = 0;
    let last: [number, number] = base(s, side, lo);

    for (let i: number = 1; i <= count; i++) {
      const u: number = i / count;
      const p: [number, number] = base(s, side, lo + (hi - lo) * (1 - (1 - u) ** 2));
      sum += Math.hypot(p[0] - last[0], p[1] - last[1]);
      last = p;
    }
    return sum;
  }

  /**
   * Phase of a knot.
   *
   * @param knot Knot index of the 256-control section.
   * @returns The phase, radians.
   */
  export function phase(knot: number): number {
    return (2 * Math.PI * knot) / ORDER;
  }

  /**
   * The jet of a sector at a phase: the quintic Hermite between its two
   * guides' jets over the phases `[t0, t1]`, each end leaving at its guide's
   * speed, plus a displacement along x given as a function of z, per radian.
   *
   * @param a Guide at `t0`, its jet without the displacement.
   * @param b Guide at `t1`, likewise.
   * @param t0 Phase of the first guide.
   * @param t1 Phase of the second guide.
   * @param speeds Each end's speed, mm per radian of phase.
   * @param t Phase, radians, between `t0` and `t1`.
   * @param shift Displacement along x by z, `[f, f_z, f_zz]`, already signed for the side; null for none.
   * @returns `[point, first derivative, second derivative]` in `[x, z]`.
   */
  export function sector(
    a: IAutoMovieHumanSeam.IArcJet,
    b: IAutoMovieHumanSeam.IArcJet,
    t0: number,
    t1: number,
    speeds: readonly [number, number],
    t: number,
    shift: ((z: number) => [number, number, number]) | null,
  ): [number[], number[], number[]] {
    const H: number = t1 - t0;
    const [pa, va, aa]: [number[], number[], number[]] = AutoMovieHumanSeam.adopt(a, speeds[0] * H);
    const [pb, vb, ab]: [number[], number[], number[]] = AutoMovieHumanSeam.adopt(b, speeds[1] * H);
    const u: number = (t - t0) / H;

    // The station rule's quintic weights over a unit interval, ordered
    // [f_a, f'_a, f''_a, f''_b, f'_b, f_b].
    const value = (order: 0 | 1 | 2): number[] => {
      const w: number[] = AutoMovieStationHermite.weights(u, 1, order, true);

      return [0, 1].map(
        (k: number): number =>
          w[0]! * pa[k]! + w[1]! * va[k]! + w[2]! * aa[k]! + w[3]! * ab[k]! + w[4]! * vb[k]! + w[5]! * pb[k]!,
      );
    };
    const p: number[] = value(0);
    const d1: number[] = value(1).map((v: number): number => v / H);
    const d2: number[] = value(2).map((v: number): number => v / (H * H));
    if (shift === null) return [p, d1, d2];

    // x + f(z(t)) by the chain rule through z(t).
    const [f0, f1, f2]: [number, number, number] = shift(p[1]!);

    return [
      [p[0]! + f0, p[1]!],
      [d1[0]! + f1 * d1[1]!, d1[1]!],
      [d2[0]! + f2 * d1[1]! * d1[1]! + f1 * d2[1]!, d2[1]!],
    ];
  }

  /**
   * The sector of the canonical left side between two guides as a function
   * of phase, the displacement carried along when the sector lies where it
   * acts.
   *
   * @param s The section's measures.
   * @param side The quadrant the sector lies on.
   * @param a Jet of the guide at the sector's start, without the displacement.
   * @param b Jet of the guide at its end, without the displacement.
   * @param knots Knots of the two guides.
   * @param speeds Speeds of the two guides, mm per radian.
   * @param folded Whether the displacement acts on the sector.
   * @returns The sector's jet at a phase.
   */
  export function between(
    s: ISection,
    side: Side,
    a: IAutoMovieHumanSeam.IArcJet,
    b: IAutoMovieHumanSeam.IArcJet,
    knots: readonly [number, number],
    speeds: readonly [number, number],
    folded: boolean,
  ): (t: number) => [number[], number[], number[]] {
    // The front stands back and the back forward by the displacement.
    const sign: number = side === "front" ? -1 : 1;
    const shift: ((z: number) => [number, number, number]) | null = folded
      ? (z: number): [number, number, number] => {
          const f: [number, number, number] = fold(s, side, z);
          return [sign * f[0], sign * f[1], sign * f[2]];
        }
      : null;

    return (t: number): [number[], number[], number[]] =>
      sector(a, b, phase(knots[0]), phase(knots[1]), speeds, t, shift);
  }

  /**
   * A section jet of the canonical left side reflected onto the right (rule
   * J6): z negated and the direction of travel reversed, so the right half
   * keeps the ring's outward orientation.
   *
   * @param jet A left guide's jet.
   * @returns The right guide's jet.
   */
  export function reflect(jet: IAutoMovieHumanSeam.IArcJet): IAutoMovieHumanSeam.IArcJet {
    const mirrored: IAutoMovieHumanSeam.ISurfaceJet = AutoMovieHumanSeam.reflect(
      {
        point: jet.point,
        along: jet.tangent,
        alongSecond: jet.curvature,
        across: [0, 0],
        acrossSecond: [0, 0],
        twist: [0, 0],
      },
      1,
    );

    return { point: mirrored.point, tangent: mirrored.along, curvature: mirrored.alongSecond };
  }
}
