import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
} from "@automovie/interface";

import { AutoMovieSolidBlend } from "../../AutoMovieSolidBlend";
import { AutoMovieSolidVector } from "../../AutoMovieSolidVector";

/**
 * Observe the join's original consecutive-normal dot predicate at its sampled
 * columns, preserving the rail/blend reads and their evaluation order.
 *
 * @param columns Already admitted columns, in their original traversal order.
 * @param column The same join's reader; each column reads its two neighbours
 *   once.
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
    const before: IAutoMovieSolidJoin.IColumn | null = column(
      c.rail.curve.t - step,
    );
    const after: IAutoMovieSolidJoin.IColumn | null = column(
      c.rail.curve.t + step,
    );
    if (before === null || after === null)
      return {
        contract: "rails",
        detail: `no rail beside t ${c.rail.curve.t}`,
      };
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
           * Encode only this failed observation's three already evaluated
           * components.
           */
          const vector: (value: Readonly<Vec3>) => number[] = (
            value: Readonly<Vec3>,
          ): number[] => [...value];

          /**
           * Identify actual kept-rail addresses without reevaluating either
           * surface.
           */
          const rail: (value: IAutoMovieSolidRail.IRail) => object = (
            value: IAutoMovieSolidRail.IRail,
          ): object => ({
            contact: {
              t: value.curve.t,
              part: [value.curve.s, value.curve.phi],
              hostFace: value.curve.face,
              host: [value.curve.y, value.curve.theta],
              point: vector(value.curve.point),
            },
            part: {
              address: [value.s, value.phi],
              point: vector(value.partPoint),
              across: value.partAcross.slice(),
              side: value.sigma,
            },
            host: {
              face: value.hostFace,
              address: value.host.slice(),
              point: vector(value.hostPoint),
              across: value.across.slice(),
            },
          });

          /** A normal with its exact operands and norm. */
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
              norm: length,
            };
          };
          const classification: "negative-dot" | "zero-dot" =
            alignment < 0 ? "negative-dot" : "zero-dot";
          const reason: string =
            classification === "negative-dot"
              ? "reverses"
              : "has zero consecutive-normal dot";
          const detail: string = JSON.stringify({
            predicate: "dot(previous.normal,current.normal)>0",
            classification,
            dot: alignment,
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

/** World vectors retain the source reader's millimetre units. */
type Vec3 = AutoMovieVector3Tuple;

/** Only the original neighbouring-rail or sampled-normal premise can fail here. */
type IFailure = {
  contract: "rails" | "unfolded blend";
  detail: string;
};
