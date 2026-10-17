import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine";

import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisBranchTrim64 as T } from "./PelvisBranchTrim64";
import { PelvisCompatibleBranch64 as Roof } from "./PelvisCompatibleBranch64";

/** The same roof entry C/full-J is consumed by actual level complements.
 * This ports V17's curve-only operator, including its inverse-height pullback.
 * It does not claim complete critical-loop connectivity or injectivity.
 *
 * @author Samchon
 */
export class PelvisBranchComplement64 {
  /** Per-side outer restrictions, common rails and endpoint tangent fields consumed by every level query. */
  public readonly sides: Record<
    P.Side,
    {
      /** Four outer near-section restrictions, in construction millimetres. */
      nearCurves: B.Poly[];

      /** Three common longitudinal cubic rails from near to merged floor. */
      rails: B.Poly[];

      /** Endpoint tangent-handle vectors on the near course, in millimetres. */
      nearVectors: Record<string, V.V>;

      /** Endpoint tangent-handle vectors on the merged floor, in millimetres. */
      floorVectors: Record<string, V.V>;

      /** Near/floor endpoint tangent directions with positive mutual inner product. */
      directions: Record<string, [V.V, V.V]>;
    }
  > = {} as typeof this.sides;

  /** Derive complementary near curves and floor rails from the same roof and merged/paired operators. */
  public constructor(
    /** Actual shared roof field whose moving entries own both complement endpoints. */
    public readonly roof: Roof,
  ) {
    const owner: Roof["base"]["owner"] = roof.base.owner;
    const floor: V.Span[] = owner.owned.merged.controls(owner.floor),
      fj: V.Span[] = owner.owned.merged.controls(owner.floor, true),
      widths: number[] = owner.owned.merged.widths;
    for (const side of ["left", "right"] as const) {
      const source: ReturnType<typeof T.loop> = T.loop(
          owner.owned.paired[side],
          owner.near,
        ),
        roots: Record<string, T.Root> = owner.roots[side];
      const near: B.Poly[] = [
        B.restrict(source.c[1]!, roots.anteriorShoulder!.r - 1, 1),
        source.c[2]!,
        source.c[3]!,
        B.restrict(source.c[0]!, 0, roots.posteriorShoulder!.r),
      ];
      const indices: number[] = side === "left" ? [2, 1, 0] : [9, 10, 11];
      const children: B.Poly[] = indices.map(
        (i: number): B.Poly =>
          side === "left" ? [...floor[i]!].reverse() : [...floor[i]!],
      );
      const total: number = indices.reduce(
          (s: number, i: number): number => s + widths[i]!,
          0,
        ),
        first: B.Poly = children[0]!,
        last: B.Poly = children.at(-1)!;
      const outer0: B.Poly = [
        first[0]!,
        V.add(
          first[0]!,
          V.scale(V.sub(first[1]!, first[0]!), total / widths[indices[0]!]!),
        ),
        V.add(
          last[3]!,
          V.scale(V.sub(last[2]!, last[3]!), total / widths[indices.at(-1)!]!),
        ),
        last[3]!,
      ];
      const outer1: B.Poly =
        side === "left" ? [...floor[15]!].reverse() : [...floor[12]!];
      const nodes: number[] = side === "left" ? [3, 0, 15] : [9, 12, 13],
        pairedNodes: number[] = [1, 0, 3];
      const f: typeof owner.owned.paired.left = owner.owned.paired[side];
      const rails: B.Poly[] = nodes.map(
        (n: number, i: number): V.Span =>
          V.hermite(
            f.points.at(-1)![pairedNodes[i]!]!,
            floor[n]![0],
            f.dp.at(-1)![pairedNodes[i]!]!,
            fj[n]![0],
            owner.height,
          ),
      );
      const nv: Record<string, V.V> = {
        Ain: V.sub(near[0]![3]!, near[0]![2]!),
        Aout: V.sub(near[1]![1]!, near[1]![0]!),
        Lin: V.sub(near[1]![3]!, near[1]![2]!),
        Lout: V.sub(near[2]![1]!, near[2]![0]!),
        Bin: V.sub(near[2]![3]!, near[2]![2]!),
        Bout: V.sub(near[3]![1]!, near[3]![0]!),
      };
      const fv: Record<string, V.V> = {
        Ain: [0, 0, 0],
        Aout: V.sub(outer0[1]!, outer0[0]!),
        Lin: V.sub(outer0[3]!, outer0[2]!),
        Lout: V.sub(outer1[1]!, outer1[0]!),
        Bin: V.sub(outer1[3]!, outer1[2]!),
        Bout: [0, 0, 0],
      };
      const directions: Record<string, [V.V, V.V]> = {};
      for (const [name, key] of [
        ["A", "Aout"],
        ["L", "Lout"],
        ["B", "Bin"],
      ] as const) {
        const a: V.V = V.scale(nv[key]!, 1 / Math.hypot(...nv[key]!)),
          b: V.V = V.scale(fv[key]!, 1 / Math.hypot(...fv[key]!));
        if (!(dot(a, b) > 0))
          throw new Error(
            "A common rail direction leaves the positive hemisphere",
          );
        directions[name] = [a, b];
      }
      this.sides[side] = {
        nearCurves: near,
        rails,
        nearVectors: nv,
        floorVectors: fv,
        directions,
      };
    }
  }
  /** Invert actual entry height and return P, full-height J and the level tangent/mixed field; singular inverses reject. */
  public entry(
    side: P.Side,
    branch: "anterior" | "posterior",
    height: number,
  ): {
    /** Actual shared entry position in construction millimetres. */
    point: V.V;

    /** Complete position derivative per physical height millimetre. */
    fullJ: V.V;

    /** Cross-entry tangent at fixed physical height in the actual chart scale. */
    levelTangent: V.V;

    /** Physical-height derivative of that fixed-height tangent. */
    levelTangentJ: V.V;

    /** Longitudinal median-chart coordinate in original semantic intervals. */
    q: number;

    /** Actual height derivatives used by the inverse-height chain rule. */
    chart: {
      /** First height derivative with respect to q. */
      ys: number;

      /** First height derivative with respect to lambda. */
      k: number;

      /** Second height derivative with respect to q. */
      yss: number;

      /** Mixed height derivative with respect to q and lambda. */
      ysl: number;
    };
  } {
    const owner: Roof["base"]["owner"] = this.roof.base.owner;
    if (!(height >= owner.near && height <= owner.floor))
      throw new Error("Outside actual complementary height domain");
    const intervals: [number, number][] = this.roof.base.intervals[side],
      candidates: {
        /** Owning longitudinal interval index. */
        index: number;

        /** Normalized parameter inside the selected longitudinal interval. */
        t: number;

        /** Longitudinal median-chart coordinate in original semantic intervals. */
        q: number;
      }[] = [];
    for (let i: number = 0; i < intervals.length; i++) {
      const [a, b]: [number, number] = intervals[i]!;
      if (!(branch === "posterior" ? i === 0 : a >= 3)) continue;
      const c: B.Poly = this.roof.base.grids[side][i]!.at(-1)!.map(
        (row: B.Poly): V.V => row.at(-1)!,
      );
      const sign: number = branch === "posterior" ? -1 : 1;
      const root: ReturnType<typeof T.monotoneRoot> = T.monotoneRoot(
        c.map((p: V.V): V.V => [p[0], sign * p[1], p[2]]),
        sign * height,
        1,
      );
      if (!root) continue;
      const q: number = a + (b - a) * root.t;
      if (
        candidates.some(
          (r: {
            /** Longitudinal median-chart coordinate in original semantic intervals. */
            q: number;
          }): boolean => r.q === q,
        )
      )
        continue;
      candidates.push({ index: i, t: root.t, q });
    }
    if (candidates.length !== 1)
      throw new Error(
        "The shared outer entry has no unique inverse-height root",
      );
    const { index, t, q }: (typeof candidates)[number] = candidates[0]!;
    const point: V.V = this.roof.evaluateCell(side, index, t, 1),
      fs: V.V = this.roof.evaluateCell(side, index, t, 1, 1),
      fl: V.V = this.roof.evaluateCell(side, index, t, 1, 0, true),
      fsl: V.V = this.roof.evaluateCell(side, index, t, 1, 1, true),
      fss: V.V = this.roof.evaluateCell(side, index, t, 1, 2);
    const ys: number = fs[1],
      k: number = fl[1];
    if (ys === 0)
      throw new Error(
        "Inverse height is singular; this does not assert loss of 3D rank",
      );
    const j: V.V = V.scale(fs, 1 / ys),
      w: V.V = V.sub(fl, V.scale(j, k));
    const wh: V.V = V.scale(
      V.sub(
        V.sub(fsl, V.scale(fs, fsl[1] / ys - (k * fss[1]) / ys ** 2)),
        V.scale(fss, k / ys),
      ),
      1 / ys,
    );
    return {
      point,
      fullJ: j,
      levelTangent: w,
      levelTangentJ: wh,
      q,
      chart: { ys, k, yss: fss[1], ysl: fsl[1] },
    };
  }
  /** Generate four horizontal exterior complement pieces and full-height jets within the owned near-to-floor domain. */
  public level(
    side: P.Side,
    height: number,
  ): {
    /** Four exterior cubic position-control arrays at this physical height. */
    controls: B.Poly[];

    /** Complete position derivative per physical height millimetre. */
    fullJ: B.Poly[];

    /** Exact anterior/posterior shared entry values used by both consumers. */
    entries: {
      /** Anterior shared entry, including its complete inverse-height field. */
      anterior: ReturnType<PelvisBranchComplement64["entry"]>;

      /** Posterior shared entry, including its complete inverse-height field. */
      posterior: ReturnType<PelvisBranchComplement64["entry"]>;
    };

    /** Endpoint cap indices that collapse only at the declared floor limit. */
    atFloorCollapsedPieces: number[];
  } {
    const owner: Roof["base"]["owner"] = this.roof.base.owner,
      data: typeof this.sides.left = this.sides[side];
    if (!(height >= owner.near && height <= owner.floor))
      throw new Error("No complementary level extrapolation");
    const t: number = (height - owner.near) / owner.height,
      h: number = t * t * (3 - 2 * t),
      dh: number = (6 * t * (1 - t)) / owner.height;
    const points: V.V[] = data.rails.map((c: B.Poly): V.V => B.value(c, t)),
      jets: V.V[] = data.rails.map(
        (c: B.Poly): V.V => B.value(B.tangent(c, 1 / owner.height), t),
      );
    const vectors: Record<string, V.V> = {},
      derivatives: Record<string, V.V> = {};
    for (const [key, near] of Object.entries(data.nearVectors)) {
      const [u, v]: [V.V, V.V] = data.directions[key[0]!]!,
        direction: V.V = V.mix(u, v, h),
        dj: V.V = V.scale(V.sub(v, u), dh);
      const l0: number = Math.hypot(...near),
        l1: number = Math.hypot(...data.floorVectors[key]!),
        length: number = l0 + h * (l1 - l0),
        lj: number = dh * (l1 - l0);
      vectors[key] = V.scale(direction, length);
      derivatives[key] = V.add(V.scale(direction, lj), V.scale(dj, length));
    }
    const front: ReturnType<PelvisBranchComplement64["entry"]> = this.entry(
        side,
        "anterior",
        height,
      ),
      back: ReturnType<PelvisBranchComplement64["entry"]> = this.entry(
        side,
        "posterior",
        height,
      );
    const cap: (
      branch: "anterior" | "posterior",
      entry: typeof front,
      rail: V.V,
      railJ: V.V,
      index: number,
    ) => {
      /** Cap endpoint tangent-handle vector in construction millimetres. */
      v: V.V;

      /** Derivative of the cap handle per physical height millimetre. */
      j: V.V;
    } = (
      branch: "anterior" | "posterior",
      entry: typeof front,
      rail: V.V,
      railJ: V.V,
      index: number,
    ): {
      /** Cap endpoint tangent-handle vector in construction millimetres. */
      v: V.V;

      /** Derivative of the cap handle per physical height millimetre. */
      j: V.V;
    } => {
      const chord: V.V = V.sub(rail, entry.point),
        cj: V.V = V.sub(railJ, entry.fullJ),
        near: B.Poly = data.nearCurves[index]!;
      const nearLength: number = Math.hypot(...V.sub(near[3]!, near[0]!));
      let length: number = Math.hypot(...chord),
        rate: number;
      if (height === owner.floor) {
        length = 0;
        rate = 0;
      } else {
        if (length === 0)
          throw new Error(
            "A finite exterior cap collapsed before its declared floor limit",
          );
        rate = dot(chord, cj) / length;
      }
      const w: V.V = entry.levelTangent,
        wh: V.V = entry.levelTangentJ,
        wn: number = Math.hypot(...w);
      if (!(wn > 0)) throw new Error("Zero actual shared entry level tangent");
      const direction: V.V = V.scale(w, 1 / wn),
        directionJ: V.V = V.scale(
          V.sub(wh, V.scale(direction, dot(direction, wh))),
          1 / wn,
        );
      const ratio: number =
        branch === "anterior"
          ? Math.hypot(...V.sub(near[1]!, near[0]!)) / nearLength
          : Math.hypot(...V.sub(near[3]!, near[2]!)) / nearLength;
      const sign: number = branch === "anterior" ? 1 : -1;
      const key: string = branch === "anterior" ? "Ain" : "Bout",
        [u, v]: [V.V, V.V] = data.directions[key[0]!]!;
      const rho: number = Math.hypot(...data.nearVectors[key]!) / nearLength,
        d: V.V = V.mix(u, v, h),
        dj: V.V = V.scale(V.sub(v, u), dh);
      vectors[key] = V.scale(d, rho * length);
      derivatives[key] = V.scale(
        V.add(V.scale(d, rate), V.scale(dj, length)),
        rho,
      );
      return {
        v: V.scale(direction, sign * ratio * length),
        j: V.scale(
          V.add(V.scale(direction, rate), V.scale(directionJ, length)),
          sign * ratio,
        ),
      };
    };
    const fc: ReturnType<typeof cap> = cap(
        "anterior",
        front,
        points[0]!,
        jets[0]!,
        0,
      ),
      bc: ReturnType<typeof cap> = cap(
        "posterior",
        back,
        points[2]!,
        jets[2]!,
        3,
      );
    const [a, l, b]: V.V[] = points,
      [ja, jl, jb]: V.V[] = jets;
    return {
      controls: [
        [front.point, V.add(front.point, fc.v), V.sub(a!, vectors.Ain!), a!],
        [a!, V.add(a!, vectors.Aout!), V.sub(l!, vectors.Lin!), l!],
        [l!, V.add(l!, vectors.Lout!), V.sub(b!, vectors.Bin!), b!],
        [b!, V.add(b!, vectors.Bout!), V.sub(back.point, bc.v), back.point],
      ],
      fullJ: [
        [
          front.fullJ,
          V.add(front.fullJ, fc.j),
          V.sub(ja!, derivatives.Ain!),
          ja!,
        ],
        [ja!, V.add(ja!, derivatives.Aout!), V.sub(jl!, derivatives.Lin!), jl!],
        [jl!, V.add(jl!, derivatives.Lout!), V.sub(jb!, derivatives.Bin!), jb!],
        [
          jb!,
          V.add(jb!, derivatives.Bout!),
          V.sub(back.fullJ, bc.j),
          back.fullJ,
        ],
      ],
      entries: { anterior: front, posterior: back },
      atFloorCollapsedPieces: height === owner.floor ? [0, 3] : [],
    };
  }
}
/** Euclidean construction-chart inner product used by tangent normalization and its derivative. */
function dot(a: V.V, b: V.V): number {
  return a.reduce(
    (sum: number, x: number, i: number): number => sum + x * b[i]!,
    0,
  );
}
