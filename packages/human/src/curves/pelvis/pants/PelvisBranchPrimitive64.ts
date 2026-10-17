import {
  AutoMovieBernstein64 as B,
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine";

import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisCompatibleBranch64 as Roof } from "./PelvisCompatibleBranch64";

/** Actual high-degree transport and smooth world-guide chart pullback.
 * Display sampling never becomes a new generating curve. Vector fields are
 * not emitted as positions. Mixed polynomial Y has its own exact authority.
 *
 * @author Samchon
 */
export namespace PelvisBranchPrimitive64 {
  /** Publish the complete polynomial controls and their actual degree. */
  export function polynomial(c: B.Poly): C.Piece {
    return { primitive: "polynomialBezier", degree: c.length - 1, controls: c };
  }
  /** Publish all six bilateral arch pieces; semantic courses use their owned polynomial authority and other courses retain hybrid Y. */
  export function arch(roof: Roof, q: number, semantic: boolean): C.Piece[] {
    const pieces: C.Piece[] = [];
    for (const [side, half, reverse] of [
      ["left", 2, true],
      ["left", 1, true],
      ["left", 0, true],
      ["right", 0, false],
      ["right", 1, false],
      ["right", 2, false],
    ] as const) {
      const chart: ReturnType<Roof["base"]["coordinates"]> =
        roof.base.coordinates(side, q, 0);
      const prior: B.Poly = B.gridValue(
        roof.base.grids[side][chart.i]![half]!,
        chart.t,
      );
      if (semantic) {
        pieces.push(polynomial(reverse ? [...prior].reverse() : prior));
        continue;
      }
      const n: B.Poly = B.gridValue(roof.grids[side][chart.i]![half]!, chart.t);
      const weights: number[] = B.elevateScalar(
        roof.denominators[side][chart.i]![half]!,
        n.length - 1,
      );
      const y: number[] = prior.map((p: V.V): number => p[1]);
      pieces.push({
        primitive: "rationalXZPolynomialYBezier",
        degree: n.length - 1,
        homogeneousNumerator: reverse ? [...n].reverse() : n,
        weights: reverse ? [...weights].reverse() : weights,
        polynomialYControls: reverse ? [...y].reverse() : y,
      });
    }
    return pieces;
  }
  /** Restrict the actual field at constant lambda, retaining polynomial Y and each longitudinal q interval. */
  export function fixedGuide(
    roof: Roof,
    side: P.Side,
    lambda: number,
  ): C.Piece[] {
    const half: number = Math.min(Math.floor(3 * lambda), 2),
      u: number = 3 * lambda - half;
    return roof.grids[side].map((cells: B.Grid[], i: number): C.Piece => {
      const q: number = B.scalar(roof.denominators[side][i]![half]!, u);
      const controls: B.Poly = cells[half]!.map(
        (row: B.Poly): V.V => V.scale(B.value(row, u), 1 / q),
      );
      const y: number[] = B.elevateScalar(
        roof.base.grids[side][i]![half]!.map(
          (row: B.Poly): number => B.value(row, u)[1],
        ),
        controls.length - 1,
      );
      controls.forEach((p: V.V, k: number): void => {
        p[1] = y[k]!;
      });
      return {
        ...polynomial(controls),
        qInterval: roof.base.intervals[side][i]!,
      };
    });
  }
  /** Form a nonnegative integer power by Bernstein products, retaining the actual degree. */
  function power(c: readonly number[], exponent: number): number[] {
    let out: number[] = [1];
    for (let i: number = 0; i < exponent; i++) out = B.product(out, c);
    return out;
  }
  /** Substitute the rational path pn/pq into a coefficient grid without fitting sampled points. */
  function compose(grid: B.Grid, pn: number[], pq: number[]): B.Poly {
    const degree: number = grid[0]!.length - 1;
    let out: B.Poly = [[0, 0, 0]];
    for (let j: number = 0; j <= degree; j++) {
      const factor: number[] = B.product(
        power(pn, j),
        power(B.addS(pq, pn, -1), degree - j),
      ).map((v: number): number => v * B.choose(degree, j));
      out = B.add(
        out,
        B.productV(
          factor,
          grid.map((row: B.Poly): V.V => row[j]!),
        ),
      );
    }
    return out;
  }
  /** Apply the same homogeneous composition to one scalar coordinate. */
  function composeScalar(c: number[], pn: number[], pq: number[]): number[] {
    return compose([c.map((v: number): V.V => [v, 0, 0])], pn, pq).map(
      (v: V.V): number => v[0],
    );
  }
  /** Compose a world-guide path with the actual gluing pullback. Both incident chart slopes share the world-metric tangent change; positive rational path weights keep it inside the owned middle third without a fitted world curve. */
  export function worldGuide(roof: Roof, side: P.Side): C.Piece[] {
    return roof.base.intervals[side].map(
      ([a, b]: [number, number], i: number): C.Piece => {
        const slopeAt: (q: number, outgoing: boolean) => number = (
          q: number,
          outgoing: boolean,
        ): number => {
          const gluing: (typeof roof.gluing)[number] | undefined =
            roof.gluing.find(
              (g: (typeof roof.gluing)[number]): boolean =>
                g.side === side && g.q === q,
            );
          if (!gluing) return 0;
          const alpha: number = B.evaluateS(gluing.alpha, 0.5),
            beta: number = B.evaluateS(gluing.beta, 0.5);
          // Fs+ = alpha*Fs- + beta*Fl. The minimizer of the two incident
          // world-vector changes has s- = alpha*beta/(1+alpha^2) and
          // s+ = -beta/(1+alpha^2), hence s+ = alpha*s- - beta.
          // The old path assigned the entire change to the outgoing side.
          return (outgoing ? -beta : alpha * beta) / (1 + alpha * alpha);
        };
        const startSlope: number = slopeAt(a, true),
          endSlope: number = slopeAt(b, false);
        const startHandle: number = (startSlope * (b - a)) / 3,
          endHandle: number = (endSlope * (b - a)) / 3;
        // Lambda one half belongs to the middle third [1/3,2/3]. Its
        // half-width is a chart-domain quantity, not a flesh-gap parameter.
        // These weights preserve both exact endpoint slopes and keep every
        // quotient control strictly inside that domain for finite slopes.
        const chartHalfWidth: number = 1 / 6;
        const pq: number[] = [
          1,
          1 + Math.abs(startHandle) / chartHalfWidth,
          1 + Math.abs(endHandle) / chartHalfWidth,
          1,
        ];
        const pn: number[] = [
          0.5,
          0.5 * pq[1]! + startHandle,
          0.5 * pq[2]! - endHandle,
          0.5,
        ];
        const un: number[] = B.addS(
            pn.map((v: number): number => 3 * v),
            pq,
            -1,
          ),
          uq: number[] = pq;
        const grid: B.Grid = roof.grids[side][i]![1]!,
          q: number[] = roof.denominators[side][i]![1]!;
        const degree: number = grid[0]!.length - 1;
        const rn: B.Poly = compose(grid, un, uq),
          rq: number[] = B.product(
            composeScalar(q, un, uq),
            power(uq, degree - (q.length - 1)),
          );
        const yGrid: B.Grid = roof.base.grids[side][i]![1]!.map(
          (row: B.Poly): B.Poly => row.map((p: V.V): V.V => [p[1], 0, 0]),
        );
        const yn: number[] = compose(yGrid, un, uq).map(
            (p: V.V): number => p[0],
          ),
          yq: number[] = power(uq, yGrid[0]!.length - 1);
        const xzn: B.Poly = B.productV(yq, rn),
          ny: number[] = B.product(rq, yn),
          commonQ: number[] = B.product(rq, yq);
        const commonDegree: number = Math.max(xzn.length, ny.length) - 1,
          n: B.Poly = B.elevate(xzn, commonDegree),
          y: number[] = B.elevateScalar(ny, commonDegree),
          weights: number[] = B.elevateScalar(commonQ, commonDegree);
        n.forEach((p: V.V, k: number): void => {
          p[1] = y[k]!;
        });
        if (weights.some((w: number): boolean => !(w > 0)))
          throw new Error(
            "The actual composed world-guide denominator is not control-positive",
          );
        return {
          primitive: "rationalBezier",
          degree: commonDegree,
          homogeneousNumerator: n,
          weights,
          qInterval: [a, b],
        };
      },
    );
  }
}
