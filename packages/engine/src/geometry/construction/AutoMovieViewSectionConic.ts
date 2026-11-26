import type {
  IAutoMovieConicHermite,
  IAutoMoviePolarSector,
  IAutoMovieSource,
  IAutoMovieViewConic,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieViewConic } from "./AutoMovieViewConic";

/**
 * Prepares, measures and diagnoses the actual conic/G2 source without replacing
 * it.
 */
export namespace AutoMovieViewSectionConic {
  /** Prepare shared guides and the retained native quadrature partition. */
  export function prepare(
    box: IAutoMovieViewSection.IBox,
    shoulders: IAutoMovieViewSection.ISection["shoulders"],
  ): IAutoMovieSource {
    const e: IAutoMovieViewSection.ISection["shoulders"] = box.extents;
    const kappa: IAutoMovieViewSection.ISection["shoulders"] =
      AutoMovieViewConic.curvatures(
        AutoMovieConicFieldJet.NUMBER,
        box.extents,
        shoulders,
      );
    const guides: IAutoMovieViewSection.ISection["guides"] = [0, 1, 2, 3].map(
      (g: number): IAutoMoviePolarSector.IGuide => ({
        angle: g * (Math.PI / 2),
        value: e[g]!,
        slope: 0,
        curvature: e[g]! - kappa[g]! * e[g]! * e[g]!,
      }),
    ) as IAutoMovieViewSection.ISection["guides"];
    const conics: IAutoMovieViewConic.ICurve = AutoMovieViewConic.create(
      e,
      shoulders,
      kappa,
    );
    return { box, shoulders: [...shoulders], guides, conics, girth: 0 };
  }

  /**
   * Actual native-piece arclength after a fixed diagonal map, in the same
   * length unit.
   *
   * AxisScale is dimensionless, finite and nonzero; reflection has the same
   * norm. Source extents, controls, weights, native supports and partitions
   * remain unchanged. Only derivative/control differences enter the mapped
   * norm. tolerance is a positive native estimated target, default1e-7;
   * unresolved work/depth or nonfinite arithmetic remains NaN.
   */
  export function length(
    section: Pick<IAutoMovieViewSection.ISection, "conics">,
    axisScale: readonly [number, number] = [1, 1],
    tolerance: number = 1e-7,
  ): number {
    if (section.conics.failure !== null) return NaN;
    if (
      axisScale.length !== 2 ||
      !axisScale.every((value: number): boolean => value !== 0) ||
      !(tolerance > 0)
    )
      return NaN;
    const scale: readonly [number, number] = [
      Math.abs(axisScale[0]),
      Math.abs(axisScale[1]),
    ];
    const domains: IDomain[] = [];
    let total: number = 0;
    for (const [q, arc] of section.conics.quarters.entries()) {
      // These coefficients scale the existing velocity only; no source preparation reads them.
      const derivativeLengths: readonly [number, number] = [
        arc.extents[0] * scale[q % 2]!,
        arc.extents[1] * scale[(q + 1) % 2]!,
      ];
      if (!derivativeLengths.every((value: number): boolean => value > 0))
        return NaN;
      for (const [end, patch] of [arc.start, arc.end].entries())
        if (patch !== null) {
          const measured: number = endLength(patch, tolerance / 16, [
            scale[(q + end) % 2]!,
            scale[(q + end + 1) % 2]!,
          ]);
          total += measured;
        }

      // The quadrature node's absolute rounding near t=1 becomes a relative
      // O(epsilon*w) error in 1-t on a w-weight boundary layer. Reflect before
      // forming nodes, retaining each end's native distance directly instead.
      for (const reverse of [false, true]) {
        const lo: number = (reverse ? arc.end : arc.start)?.native ?? 0;
        const parameters: number[] = arc.parameters
          .map((t: number): number => (reverse ? 1 - t : t))
          .filter((t: number): boolean => t > lo && t < 0.5);
        domains.push({
          anchors: [
            lo,
            ...parameters.sort((a: number, b: number): number => a - b),
            0.5,
          ],
          speed: (t: number): number =>
            AutoMovieConicArc.speed(
              derivativeLengths[reverse ? 1 : 0],
              derivativeLengths[reverse ? 0 : 1],
              arc.shoulder,
              t,
            ),
        });
      }
    }
    let visits: number = 0;
    for (const domain of domains)
      for (let i: number = 1; i < domain.anchors.length; i++) {
        const a: number = domain.anchors[i - 1]!;
        const b: number = domain.anchors[i]!;
        if (!(b > a)) return NaN;
        const pending: IPanel[] = [
          {
            a,
            b,
            coarse: panel(domain.speed, a, b),
            tolerance:
              tolerance / 2 / (domains.length * (domain.anchors.length - 1)),
            depth: 0,
          },
        ];
        while (pending.length > 0) {
          if (++visits > 8192) return NaN;
          const current: IPanel = pending.pop()!;
          const middle: number = (current.a + current.b) / 2;
          const left: number = panel(domain.speed, current.a, middle);
          const right: number = panel(domain.speed, middle, current.b);
          const fine: number = left + right;
          const floor: number =
            64 *
            Number.EPSILON *
            (Math.abs(current.coarse) + Math.abs(left) + Math.abs(right));
          if (
            Math.abs(fine - current.coarse) <=
            Math.max(current.tolerance, floor)
          )
            total += fine;
          else {
            if (
              current.depth >= 24 ||
              middle === current.a ||
              middle === current.b
            )
              return NaN;
            pending.push(
              {
                a: middle,
                b: current.b,
                coarse: right,
                tolerance: current.tolerance / 2,
                depth: current.depth + 1,
              },
              {
                a: current.a,
                b: middle,
                coarse: left,
                tolerance: current.tolerance / 2,
                depth: current.depth + 1,
              },
            );
          }
        }
      }
    return total > 0 ? total : NaN;
  }

  /** Actual geometry and measured-girth diagnostic, otherwise null. */
  export function fault(
    section: Pick<IAutoMovieViewSection.ISection, "conics" | "box" | "girth">,
  ): string | null {
    if (section.conics.failure !== null) return section.conics.failure;

    if (!Number.isFinite(section.girth) || !(section.girth > 0))
      return "the actual native arclength has no admitted finite quadrature";
    return geometryFault(section);
  }

  /** Actual geometry diagnostic for source-only or measured sections. */
  export function geometryFault(
    section: Pick<IAutoMovieViewSection.ISection, "conics" | "box">,
  ): string | null {
    if (section.conics.failure !== null) return section.conics.failure;
    const e: readonly number[] = section.box.extents;
    for (let q: number = 0; q < 4; q++)
      for (let k: number = 0; k <= 96; k++) {
        const start: number = (q * Math.PI) / 2;
        const phi: number = start + (k * Math.PI) / 192;
        const [r, first, second]: IAutoMoviePolarSector.Jet =
          AutoMovieViewConic.radius(section.conics, phi);
        if (
          !Number.isFinite(r) ||
          !Number.isFinite(first) ||
          !Number.isFinite(second) ||
          !(r > 0)
        )
          return `nonfinite/nonpositive radius jet ${[r, first, second]} at angle ${phi}`;
        const turn: number = r * r + 2 * first * first - r * second;
        if (!Number.isFinite(turn) || turn < -1e-12 * r * r)
          return `concave or unrepresentable at angle ${phi} (curvature numerator ${turn})`;
        const along: number = r * Math.cos(phi - start);
        const across: number = r * Math.sin(phi - start);
        if (along > e[q]! * (1 + 1e-6) || across > e[(q + 1) % 4]! * (1 + 1e-6))
          return `past a source support at angle ${phi}`;
      }
    return null;
  }

  /** One native rational piece's monotone quadrature partition and actual speed. */
  interface IDomain {
    /** Strictly increasing native parameters. */
    anchors: number[];

    /** Actual derivative norm in source length units. */
    speed: (t: number) => number;
  }

  /**
   * An invocation-owned pending native panel with its already computed
   * integral.
   */
  interface IPanel {
    /** Native interval's first parameter. */
    a: number;

    /** Native interval's last parameter. */
    b: number;

    /** Already evaluated coarse integral, source length units. */
    coarse: number;

    /** This panel's share of the estimated error target, same unit. */
    tolerance: number;

    /** Existing subdivision depth. */
    depth: number;
  }

  /**
   * One convex rational subarc's normalized homogeneous controls and error
   * share.
   */
  interface IEndPanel {
    /** Deficit/height coordinates times positive weight, then weight. */
    controls: readonly (readonly [number, number, number])[];

    /** Absolute midpoint-enclosure error share, source length units. */
    tolerance: number;

    /** Homogeneous bisection depth. */
    depth: number;
  }

  /**
   * Enclose a convex rational end between chord and control-polygon lengths.
   * Closing the convex arc by its chord gives a convex body inside the closed
   * control polygon; monotonicity of convex perimeter proves the upper bound.
   * Positive rational de Casteljau subdivision retains those premises. This
   * uses the geometric subdivision principle of Gravesen's rational-curve
   * length work (1997), not the polynomial-only estimator's degree formula.
   */
  function endLength(
    patch: IAutoMovieConicHermite.IPatch,
    tolerance: number,
    axisScale: readonly [number, number] = [1, 1],
  ): number {
    const scale: number = Math.max(...patch.weights);
    const controls: [number, number, number][] = patch.points.map(
      (
        point: readonly [number, number],
        i: number,
      ): [number, number, number] => {
        const weight: number = patch.weights[i]! / scale;
        return [point[0] * weight, point[1] * weight, weight];
      },
    );
    const pending: IEndPanel[] = [{ controls, tolerance, depth: 0 }];
    let total: number = 0;
    let visits: number = 0;
    while (pending.length > 0) {
      if (++visits > 8192) return NaN;
      const current: IEndPanel = pending.pop()!;
      const points: [number, number][] = current.controls.map(
        (point: readonly [number, number, number]): [number, number] => [
          patch.deficit * axisScale[0] * (point[0] / point[2]),
          patch.height * axisScale[1] * (point[1] / point[2]),
        ],
      );
      const lower: number = Math.hypot(
        points[3]![0] - points[0]![0],
        points[3]![1] - points[0]![1],
      );
      let upper: number = 0;
      for (let i: number = 1; i < 4; i++)
        upper += Math.hypot(
          points[i]![0] - points[i - 1]![0],
          points[i]![1] - points[i - 1]![1],
        );
      const floor: number = 64 * Number.EPSILON * (upper + lower);
      if (upper - lower <= Math.max(2 * current.tolerance, floor)) {
        total += (lower + upper) / 2;
        continue;
      }
      if (current.depth >= 24) return NaN;
      const rows: (readonly (readonly [number, number, number])[])[] = [
        current.controls,
      ];
      for (let order: number = 1; order < 4; order++) {
        const previous: readonly (readonly [number, number, number])[] =
          rows[order - 1]!;
        rows.push(
          previous
            .slice(1)
            .map(
              (
                point: readonly [number, number, number],
                i: number,
              ): [number, number, number] => [
                (previous[i]![0] + point[0]) / 2,
                (previous[i]![1] + point[1]) / 2,
                (previous[i]![2] + point[2]) / 2,
              ],
            ),
        );
      }
      const left: (readonly [number, number, number])[] = rows.map(
        (
          row: readonly (readonly [number, number, number])[],
        ): readonly [number, number, number] => row[0]!,
      );
      const right: (readonly [number, number, number])[] = rows
        .map(
          (
            row: readonly (readonly [number, number, number])[],
          ): readonly [number, number, number] => row[row.length - 1]!,
        )
        .reverse();
      pending.push(
        {
          controls: right,
          tolerance: current.tolerance / 2,
          depth: current.depth + 1,
        },
        {
          controls: left,
          tolerance: current.tolerance / 2,
          depth: current.depth + 1,
        },
      );
    }
    return total;
  }

  /** One eight-point Gauss-Legendre panel of actual native speed. */
  function panel(speed: (t: number) => number, a: number, b: number): number {
    const half: number = (b - a) / 2;
    const middle: number = (a + b) / 2;
    let sum: number = 0;
    for (let i: number = 0; i < NODES.length; i++)
      sum += WEIGHTS[i]! * speed(middle + NODES[i]! * half);
    return half * sum;
  }
}

/** Eight-point Gauss-Legendre abscissas, Abramowitz and Stegun table 25.4. */
const NODES: readonly number[] = [
  -0.9602898564975363, -0.7966664774136267, -0.525532409916329,
  -0.1834346424956498, 0.1834346424956498, 0.525532409916329,
  0.7966664774136267, 0.9602898564975363,
];

/** Positive weights corresponding to NODES. */
const WEIGHTS: readonly number[] = [
  0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.362683783378362,
  0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763,
];
