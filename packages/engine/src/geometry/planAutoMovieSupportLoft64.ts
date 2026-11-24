import type {
  IAutoMovieConvexSupportLoft,
  IAutoMovieCreateSupportSectionQuery,
  IAutoMoviePlanSupportLoft64,
  IAutoMovieSupportLoftPlan64,
} from "@automovie/interface";

import { determinantAutoMovieMatrix3 } from "../math/determinantAutoMovieMatrix3";
import { createAutoMovieSupportSectionQuery } from "./createAutoMovieSupportSectionQuery";
import { AutoMovieBernsteinAlgebra64 as B } from "./curve/AutoMovieBernsteinAlgebra64";
import { rootsAutoMovieCubicBernstein64 } from "./curve/rootsAutoMovieCubicBernstein64";

/**
 * Plan continuous plane-pair boundary curves and feasible incidence events.
 * Three support planes meet when a scalar cubic slack vanishes. Isolated roots
 * use the existing normalized binary64 cubic solver; they are numerical
 * construction events, not certified intervals. The determinant owner's
 * exact-sign fallback distinguishes continuous zero incidence from a small
 * nonzero coefficient without replacing either by a geometric tolerance. Near
 * event phases can share one phase only when all their plane equations hold
 * there within the same relative arithmetic bound; otherwise they refuse.
 */
export function planAutoMovieSupportLoft64(
  input: IAutoMoviePlanSupportLoft64.IInput,
): IAutoMovieSupportLoftPlan64 {
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
  const query: IAutoMovieCreateSupportSectionQuery.IResult =
    createAutoMovieSupportSectionQuery({
      normals,
      minimumDirectionSine: input.minimumDirectionSine,
    });
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
      query(field.offsets.map((q: number[]): number => B.scalar(q, phase)));
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
        span.curves.set(`${i}:${j}`, { pair: [i, j], determinant, x, z });
      }
    const excluded: Set<string> = new Set();
    for (const [key, curve] of span.curves) {
      const i: number = curve.pair[0],
        j: number = curve.pair[1];
      for (let k: number = 0; k < normals.length; k++) {
        if (k === i || k === j) continue;
        let separated: boolean = true;
        for (let q: number = 0; q < 4; q++) {
          const slack: number =
            normals[k][0] * curve.x[q] +
            normals[k][1] * curve.z[q] -
            field.offsets[k][q];
          const allowance: number =
            (512 *
              Number.EPSILON *
              Math.max(scale, Math.abs(curve.x[q]), Math.abs(curve.z[q]))) /
            curve.determinant ** 2;
          if (!(slack > allowance)) {
            separated = false;
            break;
          }
        }
        if (!separated) continue;
        // Positive Bernstein slack controls exclude the whole cubic interval,
        // not merely its ends. Exact determinant signs confirm the original
        // field, independently of the rounded pair-curve coefficient screen.
        for (let q: number = 0; q < 4; q++)
          if (
            !(
              -Math.sign(curve.determinant) *
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
                ]) >
              0
            )
          ) {
            separated = false;
            break;
          }
        if (separated) {
          excluded.add(key);
          break;
        }
      }
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
          return triple.includes(k)
            ? Math.abs(slack) <= epsilon
            : slack <= epsilon;
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
          if (keys.some((key: string): boolean => excluded.has(key))) continue;
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
      // Endpoints were admitted before planning. Each interior event is the
      // start of exactly one interval and still needs its own admission: an
      // isolated weak pair may be feasible only at that event station.
      if (before !== 0) {
        try {
          query(
            field.offsets.map((q: number[]): number => B.scalar(q, before)),
          );
        } catch (failure: unknown) {
          if (
            failure instanceof Error &&
            failure.message.startsWith("unsupported-support-section:")
          )
            throw new Error(
              "unsupported-support-collapse: event section has no finite positive area",
            );
          throw failure;
        }
      }
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
      const section: ReturnType<typeof query> = query(
        field.offsets.map((q: number[]): number => B.scalar(q, middle)),
      );
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
      if (cells > input.maxCells)
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
