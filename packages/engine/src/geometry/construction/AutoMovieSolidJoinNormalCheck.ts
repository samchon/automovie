import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
} from "@automovie/interface";

import { AutoMovieSolidBlend } from "./AutoMovieSolidBlend";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World vectors retain the source reader's millimetre units. */
type Vec3 = AutoMovieVector3Tuple;

/** Only the original neighbouring-rail or sampled-normal premise can fail here. */
type IFailure = {
  contract: "rails" | "unfolded blend";
  detail: string;
};

/**
 * Observe the join's original consecutive-normal dot predicate at its sampled
 * columns, preserving the rail/blend reads and their evaluation order.
 *
 * @param columns Already admitted columns, in their original traversal order.
 * @param column The same join's reader; each column reads its two neighbours
 *   once.
 * @param explain Why either neighbouring column could not be read.
 * @param period Original curve-parameter turn, radians.
 * @param curve Original borrowed curve; its names identify curve provenance and
 *   its point count sets the neighbour step. Join's diagnostic producer already
 *   owns the requested source names.
 * @param shares Original fold-share count, a positive finite integer.
 * @param keep Original part kept side, included only in a failed observation.
 * @param mode Original rail mode, included only in a failed observation.
 * @returns Null when every original comparison is positive; otherwise its first
 *   failure with already evaluated vectors and actual source/rail addresses.
 */
export function AutoMovieSolidJoinNormalCheck(
  columns: readonly IAutoMovieSolidJoin.IColumn[],
  column: IAutoMovieSolidJoin.IJoin["column"],
  explain: (t: number) => string,
  period: number,
  curve: IAutoMovieSolidIntersection.ICurve,
  shares: number,
  keep: IAutoMovieSolidRail.Keep,
  mode: IAutoMovieSolidRail.Mode,
): IFailure | null {
  const {
    sub,
    cross,
    dot,
    norm,
  }: Pick<typeof AutoMovieSolidVector, "sub" | "cross" | "dot" | "norm"> =
    AutoMovieSolidVector;
  const step: number = period / (16 * curve.points.length);
  for (const c of columns) {
    const low: number = c.rail.curve.t - step;
    const high: number = c.rail.curve.t + step;
    const before: IAutoMovieSolidJoin.IColumn | null = column(low);
    const after: IAutoMovieSolidJoin.IColumn | null = column(high);
    if (before === null || after === null) {
      const missing: number = before === null ? low : high;
      return {
        contract: "rails",
        detail: `no rail beside t ${c.rail.curve.t} at t ${missing}: ${explain(missing)}`,
      };
    }
    let previous: Vec3 | null = null;
    let previousAlong: Vec3 | null = null;
    let previousFirst: Vec3 | null = null;
    for (let k: number = 0; k <= shares; k++) {
      const w: number = k / shares;
      const along: Vec3 = sub(
        AutoMovieSolidBlend.jet(after.start, after.end, w).point,
        AutoMovieSolidBlend.jet(before.start, before.end, w).point,
      );
      const first: Vec3 = AutoMovieSolidBlend.jet(c.start, c.end, w).first;
      const n: Vec3 = cross(along, first);
      if (previous !== null) {
        const alignment: number = dot(previous, n);
        if (!(alignment > 0)) {
          /**
           * Preserve every finite value and name nonfinite values before JSON
           * serialization.
           */
          const scalar: (value: number) => number | string = (
            value: number,
          ): number | string =>
            Number.isFinite(value) ? value : String(value);

          /**
           * Encode only this failed observation's three already evaluated
           * components.
           */
          const vector: (value: Readonly<Vec3>) => (number | string)[] = (
            value: Readonly<Vec3>,
          ): (number | string)[] => value.map(scalar);

          /**
           * Identify actual kept-rail addresses without reevaluating either
           * surface.
           */
          const rail: (value: IAutoMovieSolidRail.IRail) => object = (
            value: IAutoMovieSolidRail.IRail,
          ): object => ({
            contact: {
              t: scalar(value.curve.t),
              part: [scalar(value.curve.s), scalar(value.curve.phi)],
              hostFace: value.curve.face,
              host: [scalar(value.curve.y), scalar(value.curve.theta)],
              point: vector(value.curve.point),
            },
            part: {
              address: [scalar(value.s), scalar(value.phi)],
              point: vector(value.partPoint),
              across: value.partAcross.map(scalar),
              side: scalar(value.sigma),
            },
            host: {
              face: value.hostFace,
              address: value.host.map(scalar),
              point: vector(value.hostPoint),
              across: value.across.map(scalar),
            },
          });

          /**
           * A normal and its exact operands keep finite components separate
           * from a finite norm.
           */
          const observation: (
            share: number,
            alongVector: Vec3,
            firstVector: Vec3,
            normal: Vec3,
          ) => object = (
            share: number,
            alongVector: Vec3,
            firstVector: Vec3,
            normal: Vec3,
          ): object => {
            const length: number = norm(normal);
            return {
              share,
              along: vector(alongVector),
              first: vector(firstVector),
              normal: vector(normal),
              norm: scalar(length),
              finite: {
                along: alongVector.every(Number.isFinite),
                first: firstVector.every(Number.isFinite),
                normal: normal.every(Number.isFinite),
                norm: Number.isFinite(length),
              },
            };
          };
          const classification: "negative-dot" | "zero-dot" | "nonfinite-dot" =
            !Number.isFinite(alignment)
              ? "nonfinite-dot"
              : alignment < 0
                ? "negative-dot"
                : "zero-dot";
          const reason: string =
            classification === "negative-dot"
              ? "reverses"
              : classification === "zero-dot"
                ? "has zero consecutive-normal dot"
                : "has a nonfinite consecutive-normal dot";
          const detail: string = JSON.stringify({
            predicate: "dot(previous.normal,current.normal)>0",
            classification,
            dot: scalar(alignment),
            finiteDot: Number.isFinite(alignment),
            curveSources: { part: curve.part, host: curve.host },
            parameter: {
              kind: curve.parameter.kind,
              keep,
              mode,
              count: curve.points.length,
              shares,
              step,
            },
            rails: {
              before: rail(before.rail),
              current: rail(c.rail),
              after: rail(after.rail),
            },
            previous: observation(
              (k - 1) / shares,
              previousAlong!,
              previousFirst!,
              previous,
            ),
            current: observation(w, along, first, n),
          });
          return {
            contract: "unfolded blend",
            detail: `the blend's normal ${reason} at t ${c.rail.curve.t}, share ${w}; normalCheck=${detail}`,
          };
        }
      }
      previous = n;
      previousAlong = along;
      previousFirst = first;
    }
  }
  return null;
}
