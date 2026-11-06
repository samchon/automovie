import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import type { AutoMovieViewSection } from "./AutoMovieViewSection";

/** Prepared source and measured length, before inspection-only observations. */
type Source = Pick<
  AutoMovieViewSection.ISection,
  "box" | "shoulders" | "guides" | "conics" | "girth"
>;

/**
 * Prepares, measures and diagnoses the actual conic/G2 source without replacing it.
 *
 * @evidence contracts/common.md#principled-implementation Measures short convex rational ends by chord/control-polygon enclosures and the unchanged quadratic interiors by native quadrature; finite measurement is part of range admission.
 * @evidence contracts/common.md#clear-and-simple-design Native arclength and source diagnostics share one measurement owner, while ViewSection owns input/fullness solving.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coarse quadrature fallback, sampled replacement curve or changed convexity threshold is accepted.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes geometric end enclosures with floating arithmetic from the interior quadrature's estimated error; neither is called an interval certificate.
 * @evidence contracts/performance.md#efficient-algorithms Interior quadrature and each of at most eight end enclosures visit at most 8192 panels; fault reads at most 97 polar observations per quarter, 388 in total.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared native partitions and admitted end records serve every measurement without another source construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scratch domains/panels are invocation-owned and bounded; no global source cache is retained.
 */
export namespace AutoMovieViewSectionConic {
  /**
   * Prepare shared guides and the retained native quadrature partition.
   *
   * @evidence contracts/common.md#principled-implementation Uses the existing NUMBER shared-curvature policy and four-quarter factory in the original operand/order sequence.
   * @evidence contracts/common.md#clear-and-simple-design A measured-source record lets internal length/fault readers omit unused public inspection observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Native partitions, source failures and original support/shoulder values remain unchanged; no incomplete public section is returned.
   * @evidence contracts/common.md#meaningful-documentation Girth zero is unevaluated, guides use mm/angular orders, and ViewSection attaches public knots/fullness/diagonals.
   * @evidence contracts/performance.md#efficient-algorithms Fixed quarter work plus the original 60 interior native-turn parameters at 60 bisections each; no inspection radius queries occur here.
   * @evidence contracts/performance.md#reuse-equivalent-work The same source serves length, all 388 candidate fault readings and final observation decoration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned fixed source/guide/native-partition records escape; no cache is retained.
   */
  export function prepare(
    box: AutoMovieViewSection.IBox,
    shoulders: AutoMovieViewSection.ISection["shoulders"],
  ): Source {
    const e: AutoMovieViewSection.ISection["shoulders"] = box.extents;
    const kappa: AutoMovieViewSection.ISection["shoulders"] =
      AutoMovieViewConic.curvatures(
        AutoMovieConicFieldJet.NUMBER,
        box.extents,
        shoulders,
      );
    const guides: AutoMovieViewSection.ISection["guides"] = [0, 1, 2, 3].map(
      (g: number): AutoMoviePolarSector.IGuide => ({
        angle: g * (Math.PI / 2),
        value: e[g]!,
        slope: 0,
        curvature: e[g]! - kappa[g]! * e[g]! * e[g]!,
      }),
    ) as AutoMovieViewSection.ISection["guides"];
    const conics: AutoMovieViewConic.ICurve = AutoMovieViewConic.create(
      e,
      shoulders,
      kappa,
    );
    return { box, shoulders: [...shoulders], guides, conics, girth: 0 };
  }

  /**
   * Actual native-piece arclength in the section's length unit.
   *
   * @evidence contracts/common.md#principled-implementation Integrates each quadratic half in its nearest-end native chart, using the retained turn partition without subtracting a near-one quadrature abscissa. Each convex cubic end is enclosed by its chord and control-polygon lengths; positive homogeneous subdivision tightens that enclosure independently of weight-induced speed spikes.
   * @evidence contracts/common.md#clear-and-simple-design Native quadrature and geometric end enclosures return one length or NaN for the identical composed source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved enclosure, nonfinite speed or exhausted bound returns NaN; a chord alone never substitutes for an unresolved arclength.
   * @evidence contracts/common.md#meaningful-documentation Half the 1e-7 length budget belongs to all eight possible ends and half to quadratic quadrature; 64epsilon floors account for floating arithmetic, without an interval-certificate claim.
   * @evidence contracts/performance.md#efficient-algorithms At most8192 interior panel visits and8192 per present end, each to depth24; ordinary flat ends close their enclosure without subdivision.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses prepared controls/native partitions; child quadrature panels reuse their coarse integrals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Eight local quadratic-half domains and bounded invocation-owned subdivision stacks die on return or failure.
   */
  export function length(
    section: Pick<AutoMovieViewSection.ISection, "conics">,
  ): number {
    if (section.conics.failure !== null) return NaN;
    const domains: IDomain[] = [];
    let total: number = 0;
    for (const arc of section.conics.quarters) {
      for (const patch of [arc.start, arc.end])
        if (patch !== null) {
          const measured: number = endLength(patch, 5e-8 / 8);
          if (!Number.isFinite(measured)) return NaN;
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
              arc.extents[reverse ? 1 : 0],
              arc.extents[reverse ? 0 : 1],
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
            tolerance: 5e-8 / (domains.length * (domain.anchors.length - 1)),
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
          if (![current.coarse, left, right, fine].every(Number.isFinite))
            return NaN;
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
    return total;
  }

  /**
   * Actual finite-source, curvature or support diagnostic, otherwise null.
   *
   * @evidence contracts/common.md#principled-implementation Source preparation proves the positive regular convex pieces; unchanged polar observations additionally expose floating arithmetic, girth or support failures.
   * @evidence contracts/common.md#clear-and-simple-design One nullable string names the first broken premise.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps the existing1e-12 relative convexity and1e-6 support thresholds; observations do not stand in for the rational construction proof.
   * @evidence contracts/common.md#meaningful-documentation Bare sections have unevaluated zero girth; nonfinite computed girth and nonfinite jets are refused explicitly.
   * @evidence contracts/performance.md#efficient-algorithms At most388 prepared-source polar readings and constant storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the section's prepared source without rebuilding its quarters.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one string or null and retains no input.
   */
  export function fault(
    section: Pick<AutoMovieViewSection.ISection, "conics" | "box" | "girth">,
  ): string | null {
    if (section.conics.failure !== null) return section.conics.failure;
    if (!Number.isFinite(section.girth))
      return "the actual native arclength has no admitted finite quadrature";
    const e: readonly number[] = section.box.extents;
    for (let q: number = 0; q < 4; q++)
      for (let k: number = 0; k <= 96; k++) {
        const start: number = (q * Math.PI) / 2;
        const phi: number = start + (k * Math.PI) / 192;
        const [r, first, second]: AutoMoviePolarSector.Jet =
          AutoMovieViewConic.radius(section.conics, phi);
        if (![r, first, second].every(Number.isFinite) || !(r > 0))
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

  /** An invocation-owned pending native panel with its already computed integral. */
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

  /** One convex rational subarc's normalized homogeneous controls and error share. */
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
    patch: AutoMovieConicHermite.IPatch,
    tolerance: number,
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
          patch.deficit * (point[0] / point[2]),
          patch.height * (point[1] / point[2]),
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
      if (![lower, upper].every(Number.isFinite)) return NaN;
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
