import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine";

import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisBernstein64 as SpatialJet } from "./PelvisBernstein64";
import { PelvisBranchCorrespondence64 as Correspondence } from "./PelvisBranchCorrespondence64";

/** V17 rational common first variation with independently owned polynomial Y.
 * This is a curve/jet owner; coefficient grids are construction algebra and
 * are never rendered as surfaces. Global injectivity remains unproved.
 *
 * @author Samchon
 */
export class PelvisCompatibleBranch64 {
  /** Homogeneous XZ construction numerators; their Y coefficients are not the independent Y authority. */
  public readonly grids: Record<P.Side, B.Grid[][]> = { left: [], right: [] };

  /** Positive cross-course Bernstein denominator controls for each q interval and third. */
  public readonly denominators: Record<P.Side, number[][][]> = {
    left: [],
    right: [],
  };

  /** Oriented rational alpha/beta transitions and their observed endpoint first/mixed residuals. */
  public readonly gluing: {
    /** Bilateral owner of this chart and gluing record. */
    side: P.Side;

    /** Longitudinal semantic chart station, not a world height. */
    q: number;

    /** Positive rational normal-scale gluing coefficient in the shared cross parameter. */
    alpha: B.RecordS;

    /** Rational tangential gluing coefficient in the shared cross parameter. */
    beta: B.RecordS;

    /** Observed endpoint first-field gluing residual, in millimetres. */
    entryFirstResidualMm: number;

    /** Observed endpoint mixed-field gluing residual, in millimetres. */
    entryMixedResidualMm: number;
  }[] = [];

  /** Construct one rational first-variation field from the common correspondence and the actual gluing equations. */
  public constructor(
    /** Common semantic courses, full boundary jets and independently polynomial height. */
    public readonly base: Correspondence,
  ) {
    for (const side of ["left", "right"] as const) {
      const old: B.Grid[][] = base.grids[side],
        intervals: [number, number][] = base.intervals[side];
      const rows: number[] = [
        intervals[0]![0],
        ...intervals.map((p: [number, number]): number => p[1]),
      ];
      const courses: B.Poly[][] = [
        old[0]!.map((g: B.Grid): B.Poly => g[0]!),
        ...old.map((cells: B.Grid[]): B.Poly[] =>
          cells.map((g: B.Grid): B.Poly => g[3]!),
        ),
      ];
      const medianD: V.V[] = courses.map(
        (course: B.Poly[]): V.V => V.scale(B.tangent(course[0]!)[0]!, 3),
      );
      const medianMixed: V.V[] = V.fieldSlopes(
        rows,
        medianD.map((p: V.V): V.V[] => [p]),
      ).map((p: V.V[]): V.V => p[0]!);
      const incoming: Map<number, B.RecordV[]> = new Map(),
        outgoing: Map<number, B.RecordV[]> = new Map();
      const polynomial: (p: B.Poly) => B.RecordV = (p: B.Poly): B.RecordV => ({
        numerator: p,
        denominator: [1],
      });
      incoming.set(
        rows.length - 1,
        old
          .at(-1)!
          .map(
            (g: B.Grid): B.RecordV =>
              polynomial(
                B.scale(
                  B.add(g[3]!, g[2]!, -1),
                  -3 / (intervals.at(-1)![1] - intervals.at(-1)![0]),
                ),
              ),
          ),
      );
      outgoing.set(
        0,
        old[0]!.map(
          (g: B.Grid): B.RecordV =>
            polynomial(
              B.scale(
                B.add(g[1]!, g[0]!, -1),
                3 / (intervals[0]![1] - intervals[0]![0]),
              ),
            ),
        ),
      );
      for (let index: number = 1; index < rows.length - 1; index++) {
        const q: number = rows[index]!,
          previous: B.Grid[] = old[index - 1]!,
          next: B.Grid[] = old[index]!;
        const pl: number = intervals[index - 1]![1] - intervals[index - 1]![0],
          nl: number = intervals[index]![1] - intervals[index]![0];
        if (q === base.sweepQ) {
          incoming.set(
            index,
            previous.map(
              (g: B.Grid): B.RecordV =>
                polynomial(B.scale(B.add(g[3]!, g[2]!, -1), -3 / pl)),
            ),
          );
          outgoing.set(
            index,
            next.map(
              (g: B.Grid): B.RecordV =>
                polynomial(B.scale(B.add(g[1]!, g[0]!, -1), 3 / nl)),
            ),
          );
          continue;
        }
        const c: B.Poly = base.coarseCourses[side][index]!;
        const tc: B.Poly = B.tangent(c),
          te: V.V = tc.at(-1)!,
          tpe: V.V = B.tangent(tc).at(-1)!;
        const leftLast: B.Grid = previous.at(-1)!,
          rightLast: B.Grid = next.at(-1)!;
        const le: V.V = V.scale(
            V.sub(leftLast[3]!.at(-1)!, leftLast[2]!.at(-1)!),
            -3 / pl,
          ),
          re: V.V = V.scale(
            V.sub(rightLast[1]!.at(-1)!, rightLast[0]!.at(-1)!),
            3 / nl,
          );
        let lpe: V.V = V.scale(
          B.tangent(B.add(leftLast[3]!, leftLast[2]!, -1)).at(-1)!,
          -9 / pl,
        );
        let rpe: V.V = V.scale(
          B.tangent(B.add(rightLast[1]!, rightLast[0]!, -1)).at(-1)!,
          9 / nl,
        );
        const mi: number = Math.min(Math.floor(q), 3),
          mt: number = q - mi;
        const rm: V.V = B.value(B.tangent(base.owner.median[mi]!), mt),
          lm: V.V = V.scale(rm, -1),
          lpm: V.V = V.scale(medianMixed[index]!, -1);
        let alpha: B.RecordS;
        if (q === 1 || q === 3) alpha = B.positiveScalar(1, 1, 0, 0);
        else {
          const dot: (a: V.V, b: V.V) => number = (a: V.V, b: V.V): number =>
            a.reduce(
              (s: number, x: number, k: number): number => s + x * b[k]!,
              0,
            );
          const ratio: number = dot(V.scale(le, -1), re) / dot(le, le),
            derivative: number =
              -dot(le, V.add(rpe, V.scale(lpe, ratio))) / dot(le, le);
          alpha = B.positiveScalar(1, ratio, 0, derivative);
        }
        const ly: number[] = [lm[1], lm[1], le[1] - lpe[1] / 3, le[1]],
          ry: number[] = [rm[1], rm[1], re[1] - rpe[1] / 3, re[1]];
        const heightNum: number[] = B.addS(
          B.product(alpha.denominator, ry),
          B.product(alpha.numerator, ly),
        );
        const linearY: number[] = [2 * tc[1]![1], tc[2]![1]];
        let beta: B.RecordS;
        if (q === 2) {
          if (
            ly.some((x: number): boolean => x !== 0) ||
            ry.some((x: number): boolean => x !== 0)
          )
            throw new Error(
              "The declared low median has a nonzero first-height field",
            );
          beta = { numerator: [0], denominator: [1] };
        } else {
          if (
            tc[0]![1] !== 0 ||
            Math.max(...linearY) >= 0 ||
            heightNum[0] !== 0
          )
            throw new Error(
              "The height gluing chart needs a different actual 3D chart: " +
                JSON.stringify({ side, q, tc, linearY, heightNum }),
            );
          const n: number = heightNum.length - 1;
          beta = {
            numerator: heightNum
              .slice(1)
              .map((v: number, i: number): number => (-n * v) / (i + 1)),
            denominator: B.product(
              alpha.denominator,
              linearY.map((v: number): number => -v),
            ),
          };
        }
        const ae: number = B.evaluateS(alpha, 1),
          ape: number = B.evaluateS(alpha, 1, true),
          be: number = B.evaluateS(beta, 1),
          bpe: number = B.evaluateS(beta, 1, true);
        if (q === 1)
          lpe = V.scale(
            V.sub(
              V.add(
                V.add(V.scale(le, -ape), V.scale(te, bpe)),
                V.scale(tpe, be),
              ),
              rpe,
            ),
            1 / ae,
          );
        else if (q === 3)
          rpe = V.add(
            V.add(
              V.add(V.scale(le, -ape), V.scale(lpe, -ae)),
              V.scale(te, bpe),
            ),
            V.scale(tpe, be),
          );
        const firstResidual: number = Math.max(
          ...V.sub(V.add(V.scale(le, -ae), V.scale(te, be)), re).map(Math.abs),
        );
        const mixedResidual: number = Math.max(
          ...V.sub(
            V.add(
              V.add(
                V.add(V.scale(le, -ape), V.scale(lpe, -ae)),
                V.scale(te, bpe),
              ),
              V.scale(tpe, be),
            ),
            rpe,
          ).map(Math.abs),
        );
        const left: B.RecordV = SpatialJet.boundedSpatialJet(lm, le, lpm, lpe);
        const term0: B.Poly = B.productV(
          B.product(alpha.numerator, beta.denominator),
          left.numerator,
        );
        const term1: B.Poly = B.productV(
          B.product(beta.numerator, alpha.denominator),
          B.productV(left.denominator, tc),
        );
        const right: B.RecordV = {
          numerator: B.add(B.scale(term0, -1), term1),
          denominator: B.product(
            B.product(alpha.denominator, beta.denominator),
            left.denominator,
          ),
        };
        incoming.set(index, B.thirdsR(left));
        outgoing.set(index, B.thirdsR(right));
        this.gluing.push({
          side,
          q,
          alpha,
          beta,
          entryFirstResidualMm: firstResidual,
          entryMixedResidualMm: mixedResidual,
        });
      }
      for (let i: number = 0; i < intervals.length; i++) {
        const cells: B.Grid[] = [],
          denominators: number[][] = [],
          length: number = intervals[i]![1] - intervals[i]![0];
        for (let half: number = 0; half < 3; half++) {
          const d0: B.RecordV = outgoing.get(i)![half]!,
            d1: B.RecordV = incoming.get(i + 1)![half]!;
          const q: number[] = B.product(d0.denominator, d1.denominator);
          const c0: B.Poly = B.productV(q, courses[i]![half]!),
            c1: B.Poly = B.productV(q, courses[i + 1]![half]!);
          const j0: B.Poly = B.productV(d1.denominator, d0.numerator),
            j1: B.Poly = B.scale(B.productV(d0.denominator, d1.numerator), -1);
          cells.push(B.hermite(c0, c1, j0, j1, length));
          denominators.push(q);
        }
        this.grids[side].push(cells);
        this.denominators[side].push(denominators);
      }
    }
  }
  /** Evaluate a position or requested q/lambda first variation on the same owned chart. */
  public evaluate(
    side: P.Side,
    q: number,
    lambda: number,
    dq: boolean = false,
    dlambda: boolean = false,
  ): V.V {
    const chart: ReturnType<Correspondence["coordinates"]> =
      this.base.coordinates(side, q, lambda);
    return this.evaluateCell(
      side,
      chart.i,
      chart.t,
      lambda,
      dq ? 1 : 0,
      dlambda,
    );
  }
  /** Evaluate one interval with physical q scaling and independently polynomial Y, including requested mixed derivatives. */
  public evaluateCell(
    side: P.Side,
    index: number,
    t: number,
    lambda: number,
    dq: number = 0,
    dlambda: boolean = false,
  ): V.V {
    const [a, b]: [number, number] = this.base.intervals[side][index]!,
      half: number = Math.min(Math.floor(3 * lambda), 2),
      u: number = 3 * lambda - half;
    let grid: B.Grid = this.grids[side][index]![half]!;
    for (let i: number = 0; i < dq; i++)
      grid = B.gridTangent(grid, 1 / (b - a));
    const numerator: B.Poly = B.gridValue(grid, t),
      denominator: number[] = this.denominators[side][index]![half]!;
    const result: V.V = B.evaluateR({ numerator, denominator }, u, dlambda);
    if (dlambda) for (let k: number = 0; k < 3; k++) result[k] *= 3;
    let height: B.Grid = this.base.grids[side][index]![half]!;
    for (let i: number = 0; i < dq; i++)
      height = B.gridTangent(height, 1 / (b - a));
    let y: number[] = B.gridValue(height, t).map((p: V.V): number => p[1]);
    if (dlambda) y = B.dScalar(y, 3);
    result[1] = B.scalar(y, u);
    return result;
  }
  /** Add the shared quartic corner coefficient basis needed by fixed-height entry compatibility; this changes no endpoint position. */
  public addCornerBasis(): {
    /** Bilateral owner of this chart and gluing record. */
    side: P.Side;

    /** Longitudinal interval owning the corner correction. */
    index: number;

    /** Longitudinal semantic chart station, not a world height. */
    q: number;

    /** Shared quartic correction vector in construction millimetres. */
    delta: V.V;
  }[] {
    const records: {
      /** Bilateral owner of this chart and gluing record. */
      side: P.Side;

      /** Longitudinal interval owning the corner correction. */
      index: number;

      /** Longitudinal semantic chart station, not a world height. */
      q: number;

      /** Shared quartic correction vector in construction millimetres. */
      delta: V.V;
    }[] = [];
    const dot: (a: V.V, b: V.V) => number = (a: V.V, b: V.V): number =>
      a.reduce(
        (sum: number, x: number, i: number): number => sum + x * b[i]!,
        0,
      );
    for (const side of ["left", "right"] as const)
      for (const q of [1, 3]) {
        const index: number = this.base.intervals[side].findIndex(
            (p: [number, number]): boolean =>
              q === 1 ? p[1] === q : p[0] === q,
          ),
          t: number = q === 1 ? 1 : 0;
        const rq: V.V = this.evaluateCell(side, index, t, 1, 1),
          rl: V.V = this.evaluateCell(side, index, t, 1, 0, true),
          rql: V.V = this.evaluateCell(side, index, t, 1, 1, true),
          rqq: V.V = this.evaluateCell(side, index, t, 1, 2);
        const ys: number = rq[1],
          k: number = rl[1];
        if (ys === 0 || k === 0)
          throw new Error("A shoulder inverse-height chart is singular");
        const target: V.V = V.sub(
          V.scale(rql, ys / k),
          V.scale(rq, rql[1] / k - rqq[1] / ys),
        );
        target[1] = rqq[1];
        const w: V.V = V.sub(rl, V.scale(rq, k / ys)),
          norm: number = Math.hypot(...w);
        if (!(norm > 0))
          throw new Error(
            "A shared entry level tangent is singular: " +
              JSON.stringify({ side, q, rq, rl, w, norm }),
          );
        const unit: V.V = V.scale(w, 1 / norm),
          full: V.V = V.sub(target, rqq),
          delta: V.V = V.sub(full, V.scale(unit, dot(full, unit)));
        delta[1] = 0;
        records.push({ side, index, q, delta });
      }
    for (const record of records) {
      const { side, index, delta }: typeof record = record,
        [a, b]: [number, number] = this.base.intervals[side][index]!;
      const basis: number[] = [0, 0, (b - a) ** 2 / 12, 0, 0],
        weights: number[][] = B.thirdsS([0, 0, 1]);
      for (let half: number = 0; half < 3; half++) {
        const old: B.Grid = this.grids[side][index]![half]!,
          q: number[] = this.denominators[side][index]![half]!;
        const cross: B.Poly = B.product(q, weights[half]!).map(
          (w: number): V.V => V.scale(delta, w),
        );
        const degree: number = Math.max(old[0]!.length, cross.length) - 1;
        const elevated: B.Grid = old[0]!.map(
          (_: V.V, ci: number): B.Poly =>
            B.elevate(
              old.map((row: B.Poly): V.V => row[ci]!),
              4,
            ),
        );
        const qElevated: B.Grid = Array.from(
          { length: 5 },
          (_: unknown, qi: number): B.Poly =>
            B.elevate(
              elevated.map((column: B.Poly): V.V => column[qi]!),
              degree,
            ),
        );
        this.grids[side][index]![half] = qElevated.map(
          (row: B.Poly, k: number): B.Poly =>
            B.add(row, B.elevate(cross, degree), basis[k]!),
        );
      }
    }
    return records;
  }
}
