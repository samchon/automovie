import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";

import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import type { generatePelvisOwnedFamily } from "../family/generatePelvisOwnedFamily";
import { PelvisBranchTrim64 as T } from "./PelvisBranchTrim64";

/** The V17 shared median and paired trim ownership, generated from named input.
 * Old native form acceptance is not transferred to a new public specimen.
 *
 * @author Samchon
 */
export class PelvisBranchMedian64 {
  /** Four polynomial median spans in the native construction chart, in millimetres. */
  public readonly median: B.Poly[];

  /** The five named posterior-to-anterior median supports, not sampled display points. */
  public readonly points: B.Poly;

  /** Named median Z coordinates that define paired trim correspondence. */
  public readonly depths: Record<string, number>;

  /** Common lower paired chart height in construction millimetres. */
  public readonly near: number;

  /** Merged body-floor height in construction millimetres. */
  public readonly floor: number;

  /** Positive floor-minus-near height used by the common roof chart. */
  public readonly height: number;

  /** Physical Y scale at median endpoints; it is independent of the lower paired chart length. */
  public readonly endpointHeightScale: number;

  /** Unique fixed-depth paired roots and their moving-height derivatives by side. */
  public readonly roots: Record<P.Side, Record<string, T.Root>>;

  /** Generate median Hermite spans and both paired trim roots from the same owned family; invalid or ambiguous domains reject. */
  public constructor(
    /** Actual merged/paired generator whose controls and physical derivatives own the boundary. */
    public readonly owned: ReturnType<typeof generatePelvisOwnedFamily>,
    /** Named physical stations and roof relations in the same construction chart. */
    public readonly parameters: P.Input,
  ) {
    this.floor = owned.merged.ys[0]!;
    this.near = owned.paired.left.ys.at(-1)!;
    this.height = this.floor - this.near;
    if (!(this.height > 0) || owned.paired.right.ys.at(-1) !== this.near)
      throw new Error("One positive common roof height domain is required");
    const floor: M.Span[] = owned.merged.controls(this.floor),
      jet: M.Span[] = owned.merged.controls(this.floor, true);
    const back: M.V = floor[14]![0],
      front: M.V = floor[6]![0];
    const r: Record<string, number | string> = parameters.roof!;
    this.endpointHeightScale = Number(r.medianEndHeightScale_mm ?? this.height);
    if (!(this.endpointHeightScale > 0))
      throw new Error("Positive median physical endpoint scale required");
    const ratio: number = Number(r.sagDepthRatio),
      drop: number = Number(r.sagDropFromBodyFloor_mm);
    if (!(ratio > 0 && ratio < 1 && drop > 0 && front[2] > back[2]))
      throw new Error("Ordered median physical dimensions required");
    const zs: number[] = [0, ratio / 2, ratio, (1 + ratio) / 2, 1].map(
      (t: number): number => back[2] + t * (front[2] - back[2]),
    );
    const factors: number[] = [
      0,
      Number(r.posteriorShoulderDropRatio),
      1,
      Number(r.anteriorShoulderDropRatio),
      0,
    ];
    this.points = zs.map(
      (z: number, i: number): M.V => [
        back[0],
        this.floor - drop * factors[i]!,
        z,
      ],
    );
    const derivatives: M.V[] = M.fieldSlopes(
      [0, 1, 2, 3, 4],
      this.points.map((p: M.V): M.V[] => [p]),
    ).map((p: M.V[]): M.V => p[0]!);
    derivatives[0] = M.scale(jet[14]![0], -this.endpointHeightScale);
    derivatives[4] = M.scale(jet[6]![0], this.endpointHeightScale);
    this.median = this.points
      .slice(0, -1)
      .map(
        (p: M.V, i: number): M.Span =>
          M.hermite(
            p,
            this.points[i + 1]!,
            derivatives[i]!,
            derivatives[i + 1]!,
            1,
          ),
      );
    this.depths = {
      posteriorFloor: zs[0]!,
      posteriorShoulder: zs[1]!,
      lowPoint: zs[2]!,
      anteriorShoulder: zs[3]!,
      anteriorFloor: zs[4]!,
    };
    this.roots = {} as PelvisBranchMedian64["roots"];
    for (const side of ["left", "right"] as const)
      this.roots[side] = Object.fromEntries(
        ["posteriorShoulder", "lowPoint", "anteriorShoulder"].map(
          (key: string): [string, T.Root] => [
            key,
            T.fixedDepth(owned.paired[side], this.near, this.depths[key]!),
          ],
        ),
      );
  }
  /** Find one increasing median depth root between the supplied original span indices. */
  public medianRoot(z: number, start: number, end: number): number {
    const found: number[] = [];
    for (let i: number = start; i < end; i++) {
      const root: ReturnType<typeof T.monotoneRoot> = T.monotoneRoot(
        this.median[i]!,
        z,
        2,
      );
      if (root) found.push(i + root.t);
    }
    const distinct: number[] = [...new Set(found)];
    if (distinct.length !== 1) throw new Error("No unique median depth branch");
    return distinct[0]!;
  }
  /** Restrict a single median span to an already partitioned q interval. */
  public medianPiece(a: number, b: number): B.Poly {
    const i: number = Math.floor((a + b) / 2);
    return B.restrict(this.median[i]!, a - i, b - i);
  }
}
