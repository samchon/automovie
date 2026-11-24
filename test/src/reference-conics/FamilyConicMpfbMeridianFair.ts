import {
  AutoMovieConstructionPortField,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

import { FamilyConicFairing } from "./FamilyConicFairing";

type Jet = IAutoMovieSolidSurface.IJet;
type Basis = [value: number, first: number, second: number];
type Field = [point: Point, first: Point, second: Point];

/**
 * Fair measured meridian curves with fixed position, first and second jets at
 * both ends.
 */
export namespace FamilyConicMpfbMeridianFair {
  /** Prepare a longitudinal world curve at each common angular address. */
  export type Phase = (phase: number) => (along: number) => Jet;

  /** Fairing comparison at the original phase observations. */
  export interface IReport {
    /**
     * Observations whose turning-rate energy decreased with the constrained
     * correction.
     */
    accepted: number;
    /** Sum of discrete curve variation energy before the correction. */
    before: number;
    /** Sum of the same energy after admission against each observed chord. */
    after: number;
    /**
     * Largest combined coefficient magnitude, a millimetre bound at the
     * measured phase samples.
     */
    maximumShift: number;
  }

  /** Prepared curve reader and independently recomputable comparison evidence. */
  export interface IResult {
    /** Compatibility with the source chart's exact endpoint jets. */
    phase: Phase;
    /** Comparison on the same longitudinal observations. */
    report: IReport;
  }

  /** Compact convex averaging over the angular span of an observed source facet. */
  export function smooth(
    points: readonly Point[],
    width: number,
  ): readonly Point[] {
    if (!(Number.isFinite(width) && width >= 0 && width <= Math.PI))
      throw new Error(
        "A source facet's angular width must be between zero and pi radians",
      );
    if (width === 0) return points;
    const count: number = points.length;
    const step: number = (2 * Math.PI) / count;
    const radius: number = Math.ceil(width / step);
    // The same sextic as the longitudinal basis has a triple zero at the support boundary.
    const weights = Array.from({ length: 2 * radius + 1 }, (_, i) => {
      const offset: number = i - radius;
      return { offset, weight: bump(offset * step, 0, width)[0] };
    });
    const sum: number = weights.reduce(
      (total, { weight }): number => total + weight,
      0,
    );
    return points.map(
      (_, i): Point =>
        V.combine(
          weights.map(({ offset, weight }): [number, Point] => [
            weight / sum,
            points[(i + offset + count) % count]!,
          ]),
        ),
    );
  }

  /**
   * Minimize variation of each measured curve's curvature vector, linearized in
   * the local normal directions. The compact basis neither touches an endpoint
   * jet nor introduces a new anatomical guide. Limit the normal correction by
   * the observed adjacent-facet chord deviation, then admit only an improvement
   * in the discrete geometric fairness objective.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Variation uses a difference of geometric curvature vectors per local arc length, and exact compact basis derivatives hold the endpoint total2 jets fixed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One three-variable normal system per observed phase; the prepared periodic fields read without another fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Precomputes the shared compact basis at the observation grid and the angular coefficient fields once.
   * @see https://people.eecs.berkeley.edu/~sequin/PAPERS/SIGGR92_MVC_MVS.pdf
   */
  export function prepare(
    phase: Phase,
    lines: readonly { points: readonly Point[] }[],
    fairAngle: number = 0,
  ): IResult {
    // The four independent quarter observations of the parent reach support three interior controls.
    // ESTIMATE: sample each supported quarter at four substeps to observe its changing bend.
    const quarters: number = 4;
    const controls: Point = [1 / quarters, 2 / quarters, 3 / quarters];
    const stations: number[] = Array.from(
      { length: quarters ** 2 + 1 },
      (_, i): number => i / quarters ** 2,
    );
    const basisAt = (along: number): [Basis, Basis, Basis] =>
      controls.map((centre): Basis => bump(along, centre, 1 / quarters)) as [
        Basis,
        Basis,
        Basis,
      ];
    const weights: [Basis, Basis, Basis][] = stations.map(basisAt);
    const report: IReport = {
      accepted: 0,
      before: 0,
      after: 0,
      maximumShift: 0,
    };
    const measured = lines.map(({ points }, i) => {
      const read = phase((2 * Math.PI * i) / lines.length);
      const samples: Jet[] = stations.map(read);
      const directions: Point[] = controls.map((s): Point => {
        const { u, v }: Jet = read(s);
        const normal: Point | null = V.unit(V.cross(u, v));
        if (normal === null)
          throw new Error("Cannot fair a singular meridian observation");
        return normal;
      });
      const before: number = FamilyConicFairing.energy([
        { points: samples.map(({ p }): Point => p), closed: false },
      ]);
      report.before += before;
      const fit: Point = correction(samples, weights, directions);
      const cap: number = chordDeviation(points);
      const total: number =
        Math.abs(fit[0]) + Math.abs(fit[1]) + Math.abs(fit[2]);
      const bounded: Point = total > cap ? V.scale(fit, cap / total) : fit;
      const after: number = FamilyConicFairing.energy([
        {
          points: samples.map(
            ({ p }, j): Point =>
              V.add(
                p,
                V.combine(
                  directions.map((n, k): [number, Point] => [
                    bounded[k]! * weights[j]![k]![0],
                    n,
                  ]),
                ),
              ),
          ),
          closed: false,
        },
      ]);
      const admit: boolean = after < before;
      const shifts: Point[] = directions.map(
        (n, j): Point => V.scale(n, admit ? bounded[j]! : 0),
      );
      return { shifts, samples, before };
    });
    // Smooth the coefficient fields jointly on the observed angular support. A convex combination retains the corresponding average of the local chord-deviation bounds.
    const smoothed = controls.map((_, j) =>
      smooth(
        measured.map(({ shifts }): Point => shifts[j]!),
        fairAngle,
      ),
    );
    measured.forEach(({ samples, before }, i): void => {
      const own: Point[] = smoothed.map((field): Point => field[i]!);
      const points: Point[] = samples.map(
        ({ p }, j): Point =>
          V.add(
            p,
            V.combine(
              own.map((shift, k): [number, Point] => [
                weights[j]![k]![0],
                shift,
              ]),
            ),
          ),
      );
      const after: number = FamilyConicFairing.energy([
        { points, closed: false },
      ]);
      report.after += after;
      if (after < before) ++report.accepted;
      report.maximumShift = Math.max(
        report.maximumShift,
        own.reduce((sum, shift): number => sum + V.norm(shift), 0),
      );
    });
    if (!(report.after < report.before))
      return {
        phase,
        report: {
          accepted: 0,
          before: report.before,
          after: report.before,
          maximumShift: 0,
        },
      };
    const fields = smoothed.map((control) =>
      ([0, 1, 2] as const).map((k) =>
        AutoMovieConstructionPortField.periodic(
          control.map((value): number => value[k]),
        ),
      ),
    );
    return {
      report,
      phase: (phi: number) => {
        const read = phase(phi);
        const shifts: Field[] = fields.map((components): Field => {
          const lanes: Basis[] = components.map(
            (field): Basis => field.at(phi),
          );
          return ([0, 1, 2] as const).map(
            (i): Point => [lanes[0]![i], lanes[1]![i], lanes[2]![i]],
          ) as Field;
        });
        return (along: number): Jet => {
          const jet: Jet = read(along);
          if (along === 0 || along === 1) return jet;
          const weights = basisAt(along);
          const delta = (s: 0 | 1 | 2, a: 0 | 1 | 2): Point =>
            V.combine(
              shifts.map((shift, i): [number, Point] => [
                weights[i]![s],
                shift[a],
              ]),
            );
          return {
            p: V.add(jet.p, delta(0, 0)),
            u: V.add(jet.u, delta(1, 0)),
            v: V.add(jet.v, delta(0, 1)),
            uu: V.add(jet.uu, delta(2, 0)),
            uv: V.add(jet.uv, delta(1, 1)),
            vv: V.add(jet.vv, delta(0, 2)),
          };
        };
      },
    };
  }
}

/** A compact sextic with unit peak and a triple zero at each support endpoint. */
function bump(t: number, centre: number, half: number): Basis {
  const x: number = (t - centre) / half;
  if (Math.abs(x) >= 1) return [0, 0, 0];
  const h: number = 1 - x * x;
  return [
    h ** 3,
    (-6 * x * h * h) / half,
    (24 * x * x * h - 6 * h * h) / (half * half),
  ];
}

/** Largest physical sagitta observed between two consecutive source facets. */
function chordDeviation(points: readonly Point[]): number {
  return points.slice(1, -1).reduce((largest, p, i): number => {
    const from: Point = points[i]!;
    const chord: Point = V.sub(points[i + 2]!, from);
    const length: number = V.norm(chord);
    return length > 0
      ? Math.max(largest, V.norm(V.cross(V.sub(p, from), chord)) / length)
      : largest;
  }, 0);
}

/** Differentiate the physical curve curvature q/g−v(v·q)/g² in one mode. */
function bend(
  jet: Jet,
  delta: Point,
  first: number,
  second: number,
): { curve: Point; derivative: Point } {
  const { u: v, uu: q } = jet;
  const g: number = V.dot(v, v);
  const l: number = V.dot(v, q);
  const dv: Point = V.scale(delta, first);
  const dq: Point = V.scale(delta, second);
  const dg: number = 2 * V.dot(v, dv);
  const dl: number = V.dot(dv, q) + V.dot(v, dq);
  return {
    curve: V.combine([
      [1 / g, q],
      [-l / g ** 2, v],
    ]),
    derivative: V.combine([
      [1 / g, dq],
      [-dg / g ** 2, q],
      [-l / g ** 2, dv],
      [(2 * l * dg) / g ** 3 - dl / g ** 2, v],
    ]),
  };
}

/**
 * One linearized curvature-variation solve with no fitted weighting
 * coefficient.
 */
function correction(
  jets: readonly Jet[],
  weights: readonly (readonly Basis[])[],
  directions: readonly Point[],
): Point {
  const bends = jets.map((jet, i) =>
    directions.map((n, j) =>
      bend(jet, n, weights[i]![j]![1], weights[i]![j]![2]),
    ),
  );
  const matrix: [Point, Point, Point] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const target: Point = [0, 0, 0];
  for (let i: number = 1; i < jets.length; ++i) {
    const from = bends[i - 1]!,
      to = bends[i]!;
    const step: number = V.norm(V.sub(jets[i]!.p, jets[i - 1]!.p));
    if (!(step > 0))
      throw new Error("Two fairness observations coincide along a meridian");
    const error: Point = V.sub(to[0]!.curve, from[0]!.curve);
    const derivatives: Point[] = to.map(
      (d, j): Point => V.sub(d.derivative, from[j]!.derivative),
    );
    for (let j: number = 0; j < derivatives.length; ++j) {
      target[j] = target[j]! - V.dot(derivatives[j]!, error) / step;
      for (let k: number = 0; k < derivatives.length; ++k)
        matrix[j]![k] =
          matrix[j]![k]! + V.dot(derivatives[j]!, derivatives[k]!) / step;
    }
  }
  return V.solve3(matrix[0], matrix[1], matrix[2], target) ?? [0, 0, 0];
}
