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
 * @param column The same join's reader; each column reads its two neighbours once.
 * @param period Original curve-parameter turn, radians.
 * @param curve Original borrowed curve; its names identify curve provenance and its point count sets the neighbour step. Join's diagnostic producer already owns the requested source names.
 * @param shares Original fold-share count, a positive finite integer.
 * @param keep Original part kept side, included only in a failed observation.
 * @param mode Original rail mode, included only in a failed observation.
 * @returns Null when every original comparison is positive; otherwise its first
 * failure with already evaluated vectors and actual source/rail addresses.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Retains the original two neighbouring columns, after/before point reads, centre first derivative, cross product and strict consecutive dot > 0 predicate at each share. The failed predicate distinguishes negative, zero and nonfinite dot without adding a finite admission; positive Infinity therefore still passes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One observation owner returns a closed rails/unfolded-blend failure to Join's existing diagnostic path. Failed-only local encoders describe the already read vectors and rail preimages, without another source model.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no threshold, share, ordering or geometry and performs no diagnostic source/rail/kept query. A zero dot is not asserted to be a reversal or a zero vector, and NaN/Infinity remain explicit strings rather than JSON null.
 * @evidence contracts/development/common.md#meaningful-documentation Gives input ownership, radian neighbour spacing and the exact sampled predicate. Along is an unscaled world point difference in mm, first is mm per unit blend share, their normal is an unnormalized cross product and its norm/dot retain those product units.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C columns and S shares, retains the existing 2C column calls and 3C(S+1) blend reads with O(CS) fixed-vector arithmetic. Only a failure computes two norms and serializes three fixed-size rail records plus the two compared observations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The exact first vector feeds both cross and failed context; the original dot is read once. Three previous-share vector references avoid rebuilding a prior blend or allocating successful observation snapshots.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows columns/readers for this synchronous call and retains only the preceding normal/along/first within each column. A returned failure owns one string; no source object, callback, snapshot history or external handle is retained.
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
  const { sub, cross, dot, norm }: Pick<
    typeof AutoMovieSolidVector,
    "sub" | "cross" | "dot" | "norm"
  > = AutoMovieSolidVector;
  const step: number = period / (16 * curve.points.length);
  for (const c of columns) {
    const before: IAutoMovieSolidJoin.IColumn | null = column(c.rail.curve.t - step);
    const after: IAutoMovieSolidJoin.IColumn | null = column(c.rail.curve.t + step);
    if (before === null || after === null)
      return { contract: "rails", detail: `no rail beside t ${c.rail.curve.t}` };
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

          /** Preserve every finite value and name nonfinite values before JSON serialization. */
          const scalar: (value: number) => number | string = (value: number): number | string =>
            Number.isFinite(value) ? value : String(value);

          /** Encode only this failed observation's three already evaluated components. */
          const vector: (value: Readonly<Vec3>) => (number | string)[] = (value: Readonly<Vec3>): (number | string)[] =>
            value.map(scalar);

          /** Identify actual kept-rail addresses without reevaluating either surface. */
          const rail: (value: IAutoMovieSolidRail.IRail) => object = (value: IAutoMovieSolidRail.IRail): object => ({
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

          /** A normal and its exact operands keep finite components separate from a finite norm. */
          const observation: (share: number, alongVector: Vec3, firstVector: Vec3, normal: Vec3) => object = (
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
            !Number.isFinite(alignment) ? "nonfinite-dot" : alignment < 0 ? "negative-dot" : "zero-dot";
          const reason: string = classification === "negative-dot"
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
            parameter: { kind: curve.parameter.kind, keep, mode, count: curve.points.length, shares, step },
            rails: { before: rail(before.rail), current: rail(c.rail), after: rail(after.rail) },
            previous: observation((k - 1) / shares, previousAlong!, previousFirst!, previous),
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
