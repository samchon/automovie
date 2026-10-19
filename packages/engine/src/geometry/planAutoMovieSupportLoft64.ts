import type { IAutoMovieConvexSupportLoft } from "@automovie/interface";

import { determinantAutoMovieMatrix3 } from "../math/determinantAutoMovieMatrix3";
import type { IAutoMovieSupportLoftPlan64 } from "./IAutoMovieSupportLoftPlan64";
import { AutoMovieBernsteinAlgebra64 as B } from "./curve/AutoMovieBernsteinAlgebra64";
import { rootsAutoMovieCubicBernstein64 } from "./curve/rootsAutoMovieCubicBernstein64";
import { evaluateAutoMovieSupportSection } from "./evaluateAutoMovieSupportSection";

/**
 * Plan continuous plane-pair boundary curves and feasible incidence events.
 * Three support planes meet when a scalar cubic slack vanishes. Isolated roots
 * use the existing normalized binary64 cubic solver; they are numerical
 * construction events, not certified intervals. The determinant owner's
 * exact-sign fallback distinguishes continuous zero incidence from a small
 * nonzero coefficient without replacing either by a geometric tolerance.
 * Near event phases can share one phase only when all their plane equations
 * hold there within the same relative arithmetic bound; otherwise they refuse.
 *
 * @evidence contracts/common.md#principled-implementation Linear intersection maps offset Bernstein coefficients to cubic boundary curves. Feasible triple-plane roots partition changes of active constraints; a section query fixes each open interval's incidence. The second-derivative bound h squared times sup(norm(r''))/8 bounds linear interpolation of every face endpoint curve and hence its ruled face.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine planner owns continuous algebra and work budgets, while its caller admits the saved fields and the emitter owns mesh/normal/physical identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No row sampling determines events, fixed polygon correspondence hides changing constraints, determinant is replaced or coordinate weld supplies incidence. Numerically unresolved continua or close events refuse.
 * @evidence contracts/common.md#meaningful-documentation States cubic event derivation, normalized solver limitations, exact/uncertain continua, phase merging qualification, metre curvature bound and budget refusal before output allocation.
 * @evidence contracts/performance.md#efficient-algorithms For P bounded planes, S spans and E events, pair coefficients cost O(S P squared), cubic triples/feasibility O(S P to the fourth), and interval incidence O((S+E) P cubed). Retention is O(S P cubed + (S+E) P), including continuous/event triple incidences. maxPlanes bounds those raw triple populations, maxEvents bounds stations, and maxCells bounds planned strips before mesh allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each pair's four X/Z coefficients serves all triple queries and output intervals; interval incidence and curvature bounds are planned once for the emitter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local O(S P cubed + (S+E) P) curve/triple/interval records transfer to one synchronous emitter; budget refusal returns no partial mesh or retained resource.
 */
export function planAutoMovieSupportLoft64(input: {
  loft: IAutoMovieConvexSupportLoft;
  minimumDirectionSine: number;
  tolerance: number;
  maxEvents: number;
  maxCells: number;
}): IAutoMovieSupportLoftPlan64 {
  const normals: IAutoMovieSupportLoftPlan64["normals"] = input.loft.planes.map(
    (plane: IAutoMovieConvexSupportLoft["planes"][number]): [number, number] =>
      plane.normal,
  );
  const plan: IAutoMovieSupportLoftPlan64 = {
    normals,
    spans: [],
    events: 0,
    tolerance: input.tolerance,
  };
  let cells: number = 0;
  for (const field of input.loft.spans) {
    const span: IAutoMovieSupportLoftPlan64["spans"][number] = {
      field,
      curves: new Map(),
      stations: [
        { phase: 0, triples: [] },
        { phase: 1, triples: [] },
      ],
      continuities: [],
      intervals: [],
    };
    const scale: number = Math.max(...field.offsets.flat().map(Math.abs));
    for (const phase of [0, 1])
      evaluateAutoMovieSupportSection({
        normals,
        offsets: field.offsets.map((q: number[]): number => B.scalar(q, phase)),
        minimumDirectionSine: input.minimumDirectionSine,
      });
    for (let i: number = 0; i < normals.length; i++)
      for (let j: number = i + 1; j < normals.length; j++) {
        const a: readonly [number, number] = normals[i];
        const b: readonly [number, number] = normals[j];
        const determinant: number = determinantAutoMovieMatrix3([
          a[0],
          a[1],
          0,
          b[0],
          b[1],
          0,
          0,
          0,
          1,
        ]);
        if (Math.abs(determinant) < input.minimumDirectionSine) continue;
        const x: number[] = [],
          z: number[] = [];
        for (let q: number = 0; q < 4; q++) {
          x.push(
            (field.offsets[i][q] * b[1] - a[1] * field.offsets[j][q]) /
              determinant,
          );
          z.push(
            (a[0] * field.offsets[j][q] - field.offsets[i][q] * b[0]) /
              determinant,
          );
        }
        if (![...x, ...z].every(Number.isFinite))
          throw new Error(
            "nonfinite-support-curve: plane intersection overflow",
          );
        span.curves.set(`${i}:${j}`, { pair: [i, j], x, z });
      }
    const feasible: (
      pair: string,
      phase: number,
      triple: readonly number[],
    ) => boolean = (
      pair: string,
      phase: number,
      triple: readonly number[],
    ): boolean => {
      const curve: NonNullable<ReturnType<typeof span.curves.get>> =
        span.curves.get(pair)!;
      const x: number = B.scalar(curve.x, phase),
        z: number = B.scalar(curve.z, phase);
      const epsilon: number =
        512 * Number.EPSILON * Math.max(scale, Math.abs(x), Math.abs(z));
      return normals.every(
        (normal: readonly [number, number], k: number): boolean => {
          const slack: number =
            normal[0] * x + normal[1] * z - B.scalar(field.offsets[k], phase);
          return (
            Number.isFinite(slack) &&
            (triple.includes(k) ? Math.abs(slack) <= epsilon : slack <= epsilon)
          );
        },
      );
    };
    const events: {
      phase: number;
      triple: [number, number, number];
      pair: string;
    }[] = [];
    for (let i: number = 0; i < normals.length; i++)
      for (let j: number = i + 1; j < normals.length; j++)
        for (let k: number = j + 1; k < normals.length; k++) {
          const keys: string[] = [`${i}:${j}`, `${i}:${k}`, `${j}:${k}`];
          const pair: string | undefined = keys.find((key: string): boolean =>
            span.curves.has(key),
          );
          if (pair === undefined) continue;
          const slack: number[] = [0, 1, 2, 3].map((q: number): number =>
            determinantAutoMovieMatrix3([
              normals[i][0],
              normals[i][1],
              field.offsets[i][q],
              normals[j][0],
              normals[j][1],
              field.offsets[j][q],
              normals[k][0],
              normals[k][1],
              field.offsets[k][q],
            ]),
          );
          const magnitude: number = Math.max(...slack.map(Math.abs));
          if (magnitude === 0) {
            span.continuities.push([i, j, k]);
            continue;
          }
          for (const phase of rootsAutoMovieCubicBernstein64(
            slack.map((value: number): number => value / magnitude),
          ))
            if (feasible(pair, phase, [i, j, k]))
              events.push({ phase, triple: [i, j, k], pair });
        }
    events.sort(
      (a: (typeof events)[number], b: (typeof events)[number]): number =>
        a.phase - b.phase,
    );
    for (const event of events) {
      const station: (typeof span.stations)[number] | undefined =
        span.stations.find(
          (candidate: (typeof span.stations)[number]): boolean =>
            Math.abs(candidate.phase - event.phase) < 1e-10,
        );
      if (station) {
        if (!feasible(event.pair, station.phase, event.triple))
          throw new Error(
            "unresolved-support-events: distinct close events cannot share a chart station",
          );
        station.triples.push(event.triple);
      } else {
        if (++plan.events > input.maxEvents)
          throw new Error(
            "support-event-budget-exhausted: no geometry emitted",
          );
        span.stations.push({ phase: event.phase, triples: [event.triple] });
      }
    }
    span.stations.sort(
      (
        a: (typeof span.stations)[number],
        b: (typeof span.stations)[number],
      ): number => a.phase - b.phase,
    );
    for (
      let interval: number = 1;
      interval < span.stations.length;
      interval++
    ) {
      const before: number = span.stations[interval - 1].phase;
      const after: number = span.stations[interval].phase;
      const middle: number = before + (after - before) / 2;
      const physicalBefore: number =
        field.interval[0] + before * (field.interval[1] - field.interval[0]);
      const physicalMiddle: number =
        field.interval[0] + middle * (field.interval[1] - field.interval[0]);
      const physicalAfter: number =
        field.interval[0] + after * (field.interval[1] - field.interval[0]);
      if (
        !(
          before < middle &&
          middle < after &&
          physicalBefore < physicalMiddle &&
          physicalMiddle < physicalAfter
        )
      )
        throw new Error(
          "unresolved-support-events: interval midpoint is unrepresentable",
        );
      const section: ReturnType<typeof evaluateAutoMovieSupportSection> =
        evaluateAutoMovieSupportSection({
          normals,
          offsets: field.offsets.map((q: number[]): number =>
            B.scalar(q, middle),
          ),
          minimumDirectionSine: input.minimumDirectionSine,
        });
      const pairs: string[] = section.map(
        (vertex: (typeof section)[number]): string => vertex.pair.join(":"),
      );
      const faces: number[] = section.map(
        (vertex: (typeof section)[number], i: number): number => {
          const next: (typeof section)[number] =
            section[(i + 1) % section.length];
          const face: number | undefined = vertex.tight.find(
            (p: number): boolean => next.tight.includes(p),
          );
          if (face === undefined)
            throw new Error(
              "unsupported-support-incidence: polygon neighbours have no shared plane",
            );
          return face;
        },
      );
      let acceleration: number = 0;
      for (const key of pairs) {
        const curve: NonNullable<ReturnType<typeof span.curves.get>> =
          span.curves.get(key)!;
        for (let end: number = 0; end < 2; end++)
          acceleration = Math.max(
            acceleration,
            6 *
              Math.hypot(
                curve.x[end + 2] - 2 * curve.x[end + 1] + curve.x[end],
                curve.z[end + 2] - 2 * curve.z[end + 1] + curve.z[end],
              ),
          );
      }
      const segments: number = Math.max(
        1,
        Math.ceil(
          (after - before) * Math.sqrt(acceleration / (8 * input.tolerance)),
        ),
      );
      cells += pairs.length * segments;
      if (!Number.isSafeInteger(cells) || cells > input.maxCells)
        throw new Error("support-cell-budget-exhausted: no geometry emitted");
      span.intervals.push({
        before: interval - 1,
        after: interval,
        pairs,
        faces,
        segments,
      });
    }
    plan.spans.push(span);
  }
  return plan;
}
