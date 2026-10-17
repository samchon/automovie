import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine";

import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisBranchMedian64 as Median } from "./PelvisBranchMedian64";
import { PelvisBranchTrim64 as T } from "./PelvisBranchTrim64";

/** The V17 source-correspondence construction, without a copied source network.
 * Median-to-entry cross courses share actual paired restrictions. The upper
 * floor uses the same merged family. No closed upper paired ring is emitted.
 *
 * @author Samchon
 */
export class PelvisBranchCorrespondence64 {
  /** Partitioned longitudinal q intervals shared by curves and their physical chart derivatives. */
  public readonly intervals: Record<P.Side, [number, number][]> = {
    left: [],
    right: [],
  };

  /** Exact paired trim restrictions in the same interval order. */
  public readonly entries: Record<P.Side, B.Poly[]> = { left: [], right: [] };

  /** Polynomial construction rows owning semantic arches and the independent Y field. */
  public readonly grids: Record<P.Side, B.Grid[][]> = { left: [], right: [] };

  /** The six named q stations, including the derived anterior sweep station. */
  public readonly semanticRows: Record<string, number>;

  /** Anterior sweep station solved from the median depth chart. */
  public readonly sweepQ: number;

  /** Derived first-height scale for the central entry law, in millimetres per lambda. */
  public readonly k: number;

  /** Trimmed paired pieces with their moving-root full-height derivatives. */
  public readonly centralPorts: Record<P.Side, T.Piece[]> = {
    left: [],
    right: [],
  };

  /** One median-to-entry polynomial course at each semantic station. */
  public readonly coarseCourses: Record<P.Side, B.Poly[]> = {
    left: [],
    right: [],
  };

  /** Reconcile median, paired restrictions and merged-floor operators before constructing the common curve family. */
  public constructor(
    /** Shared median and paired restrictions; this is the sole correspondence authority. */
    public readonly owner: Median,
  ) {
    const r: Record<string, number | string> = owner.parameters.roof!;
    const medianRounding: number = Number(r.medianRounding),
      entryRatio: number = Number(r.entryTangentialRoundingRatio);
    const quarterRise: number = Number(r.lowRoofQuarterHeightAboveMedian_mm);
    this.k = 4 * (owner.near - owner.points[2]![1]) - 8 * quarterRise;
    if (
      !(
        Math.min(
          ...owner.points
            .slice(1, 4)
            .map((p: V.V): number => p[1] - owner.near),
        ) > 0 &&
        this.k < 0 &&
        entryRatio > 0 &&
        entryRatio < 1
      )
    )
      throw new Error(
        "The public median/entry physical-height range requires another branch chart",
      );
    this.sweepQ = owner.medianRoot(
      (owner.depths.anteriorShoulder! + owner.depths.anteriorFloor!) / 2,
      3,
      4,
    );
    this.semanticRows = {
      posteriorFloor: 0,
      posteriorShoulder: 1,
      lowPoint: 2,
      anteriorShoulder: 3,
      anteriorSweep: this.sweepQ,
      anteriorFloor: 4,
    };
    const floor: V.Span[] = owner.owned.merged.controls(owner.floor),
      jet: V.Span[] = owner.owned.merged.controls(owner.floor, true);
    for (const side of ["left", "right"] as const) {
      const f: typeof owner.owned.paired.left = owner.owned.paired[side];
      const roots: Record<string, T.Root> = owner.roots[side];
      const r0: number = roots.posteriorShoulder!.r,
        r1: number = roots.anteriorShoulder!.r;
      const source: ReturnType<typeof T.loop> = T.loop(f, owner.near);
      const neutralQ: number = owner.medianRoot(source.c[0]!.at(-1)![2], 1, 3);
      if (!(r0 < 1 && r1 > 1))
        throw new Error(
          "The shared trim must contain its original inner quarter vertex",
        );
      const nodes: Map<number, [number, number]> = new Map([
        [1, [r0, roots.posteriorShoulder!.velocity]],
        [2, [roots.lowPoint!.r, roots.lowPoint!.velocity]],
        [3, [r1, roots.anteriorShoulder!.velocity]],
        [neutralQ, [1, 0]],
      ]);
      const qs: number[] = [...nodes.keys()].sort(
        (a: number, b: number): number => a - b,
      );
      const central: B.Poly[] = [],
        dCentral: B.Poly[] = [];
      for (let i: number = 0; i < qs.length - 1; i++) {
        const a: number = qs[i]!,
          b: number = qs[i + 1]!,
          [ra, da]: [number, number] = nodes.get(a)!,
          [rb, db]: [number, number] = nodes.get(b)!;
        const record: T.Piece = T.piece(f, owner.near, ra, rb, da, db);
        const e: B.Poly = structuredClone(record.controls),
          j: B.Poly = structuredClone(record.fullJ);
        for (const p of e) p[1] = owner.near;
        for (const p of j) p[1] = 1;
        const index: number = Math.floor((ra + rb) / 2);
        const beta: number[] =
          index === 0
            ? [
                (-entryRatio * (1 - ra)) / (1 - r0),
                (-entryRatio * (1 - rb)) / (1 - r0),
              ]
            : [
                (entryRatio * (ra - 1)) / (r1 - 1),
                (entryRatio * (rb - 1)) / (r1 - 1),
              ];
        const nativeT: B.Poly = B.restrict(
          B.tangent(source.c[index]!),
          ra - index,
          rb - index,
        );
        central.push(e);
        dCentral.push(B.add(B.scale(j, this.k), B.productV(beta, nativeT)));
        this.centralPorts[side].push(record);
      }
      const aPs: number = (nodes.get(qs[1]!)![0] - r0) / (qs[1]! - 1),
        aAs: number = (r1 - nodes.get(qs.at(-2)!)![0]) / (3 - qs.at(-2)!);
      const cBack: number = (-this.k * aPs) / entryRatio,
        cFront: number = (-this.k * aAs) / entryRatio;
      if (
        !(
          cBack > 0 &&
          cBack < 2 * owner.height &&
          cFront > 0 &&
          cFront < 2 * owner.height
        )
      )
        throw new Error(
          "The phase-aware outer entry height law is not monotone",
        );
      const backNode: number = side === "left" ? 15 : 13,
        frontNode: number = side === "left" ? 3 : 9;
      // The outer entry changes physical height while following the same
      // moving trim root. Its complete physical-height jet includes XZ;
      // replacing it by a vertical vector discards the proximal narrowing.
      const posteriorEntryJet: V.V = this.centralPorts[side][0]!.fullJ[0]!;
      const anteriorEntryJet: V.V = this.centralPorts[side]
        .at(-1)!
        .fullJ.at(-1)!;
      const back: V.Span = V.hermite(
        floor[backNode]![0],
        central[0]![0]!,
        V.scale(jet[backNode]![0], -owner.height),
        V.scale(posteriorEntryJet, -cBack),
        1,
      );
      const front: V.Span = V.hermite(
        central.at(-1)!.at(-1)!,
        floor[frontNode]![0],
        V.scale(anteriorEntryJet, cFront),
        V.scale(jet[frontNode]![0], owner.height),
        1,
      );
      const frontParts: [B.Poly, B.Poly] = B.split(front, this.sweepQ - 3);
      const intervals: [number, number][] = [
        [0, 1],
        ...qs
          .slice(1)
          .map((q: number, i: number): [number, number] => [qs[i]!, q]),
        [3, this.sweepQ],
        [this.sweepQ, 4],
      ];
      const entries: B.Poly[] = [back, ...central, ...frontParts];
      const cells: B.Grid[][] = [];
      for (let i: number = 0; i < intervals.length; i++) {
        const [a, b]: [number, number] = intervals[i]!,
          m: B.Poly = owner.medianPiece(a, b),
          e: B.Poly = entries[i]!;
        let d1: B.Poly;
        if (a >= 1 && b <= 3) d1 = dCentral[i - 1]!;
        else {
          const endpoint: V.V =
            b === 1 ? dCentral[0]![0]! : dCentral.at(-1)!.at(-1)!;
          const v: number[] =
            b === 1 ? [0, 0, 1, 1] : B.restrictS([1, 1, 0, 0], a - 3, b - 3);
          d1 = v.map((w: number): V.V => V.scale(endpoint, w));
        }
        const crossRows: B.Poly[] = m.map(
          (point: V.V, k: number): B.Poly => [
            point,
            V.add(point, [medianRounding * (e[k]![0] - point[0]), 0, 0]),
            V.add(e[k]!, V.scale(d1[k]!, -1 / 3)),
            e[k]!,
          ],
        );
        if (i === 0)
          this.coarseCourses[side].push(structuredClone(crossRows[0]!));
        this.coarseCourses[side].push(structuredClone(crossRows[3]!));
        const thirds: B.Poly[][] = crossRows.map((row: B.Poly): B.Poly[] =>
          B.thirds(row),
        );
        cells.push(
          [0, 1, 2].map(
            (half: number): B.Grid =>
              thirds.map((row: B.Poly[]): B.Poly => row[half]!),
          ),
        );
      }
      const backRows: B.Poly[] =
        side === "left"
          ? B.thirds(floor[14]!)
          : B.thirds([...floor[13]!].reverse());
      const backJets: B.Poly[] =
        side === "left"
          ? B.thirds(jet[14]!)
          : B.thirds([...jet[13]!].reverse());
      const frontRows: B.Poly[] =
        side === "left"
          ? [5, 4, 3].map((n: number): B.Poly => [...floor[n]!].reverse())
          : [6, 7, 8].map((n: number): B.Poly => [...floor[n]!]);
      const frontJets: B.Poly[] =
        side === "left"
          ? [5, 4, 3].map((n: number): B.Poly => [...jet[n]!].reverse())
          : [6, 7, 8].map((n: number): B.Poly => [...jet[n]!]);
      for (const [at, index, rows, jets, factor] of [
        [0, 0, backRows, backJets, -owner.height],
        [1, cells.length - 1, frontRows, frontJets, owner.height],
      ] as const) {
        const [a, b]: [number, number] = intervals[index]!;
        // Physical-Y jets retain their original owner. Only the q chart scale
        // varies across the floor: its median metric is independent of the
        // lower tube's chart depth. Multiplication includes the mixed term.
        const scales: number[][] = B.thirdsS([
          owner.endpointHeightScale,
          owner.endpointHeightScale,
          owner.height,
          owner.height,
        ]);
        for (let half: number = 0; half < 3; half++) {
          const g: B.Grid = cells[index]![half]!;
          const end: number = at === 0 ? 0 : 3;
          const normal: B.Poly =
            at === 0
              ? B.scale(B.add(g[1]!, g[0]!, -1), 3 / (b - a))
              : B.scale(B.add(g[3]!, g[2]!, -1), 3 / (b - a));
          const targetJet: B.Poly = B.productV(scales[half]!, jets[half]!);
          const position: B.Poly = B.add(rows[half]!, g[end]!, -1),
            derivative: B.Poly = B.add(
              B.scale(targetJet, factor < 0 ? -1 : 1),
              normal,
              -1,
            );
          const targets: number[] =
            at === 0 ? [0] : [cells.length - 2, cells.length - 1];
          for (const target of targets) {
            const [aa, bb]: [number, number] = intervals[target]!;
            const v: number[] =
              at === 0
                ? [1, 1, 0, 0]
                : B.restrictS([0, 0, 1, 1], aa - 3, bb - 3);
            const d: number[] =
              at === 0
                ? [0, 1 / 3, 0, 0]
                : B.restrictS([0, 0, -1 / 3, 0], aa - 3, bb - 3);
            cells[target]![half] = cells[target]![half]!.map(
              (row: B.Poly, k: number): B.Poly =>
                B.add(B.add(row, position, v[k]!), derivative, d[k]!),
            );
          }
        }
      }
      const previous: number = cells.length - 2,
        last: number = cells.length - 1;
      const sweepDepth: number =
        typeof r.anteriorSweepEntryFrontFromFrame_mm === "number"
          ? r.anteriorSweepEntryFrontFromFrame_mm +
            owner.parameters.frame.origin_mm[2] -
            entries[previous]!.at(-1)![2]
          : 0;
      const sweepRise: number =
        typeof r.anteriorSweepQuarterHeightFromFrame_mm === "number"
          ? r.anteriorSweepQuarterHeightFromFrame_mm +
            owner.parameters.frame.origin_mm[1] -
            B.value(cells[previous]![1]![3]!, 0.5)[1]
          : 0;
      const zParts: number[][] = B.thirdsS([0, 0, 1 - entryRatio, 1]);
      const riseParts: number[][] = [
        [0, 0, 13 / 27, 21 / 27],
        [21 / 27, 29 / 27, 29 / 27, 21 / 27],
        [21 / 27, 13 / 27, 0, 0],
      ];
      for (const [index, bump] of [
        [previous, [0, 0, 1, 1]],
        [last, [1, 1, 0, 0]],
      ] as const) {
        entries[index]!.forEach((p: V.V, k: number): void => {
          p[2] += sweepDepth * bump[k]!;
        });
        for (let half: number = 0; half < 3; half++)
          cells[index]![half]!.forEach((row: B.Poly, k: number): void => {
            const z: number[] = B.elevateScalar(zParts[half]!, row.length - 1),
              y: number[] = B.elevateScalar(riseParts[half]!, row.length - 1);
            row.forEach((p: V.V, j: number): void => {
              p[2] += sweepDepth * bump[k]! * z[j]!;
              p[1] += sweepRise * bump[k]! * y[j]!;
            });
          });
      }
      this.intervals[side] = intervals;
      this.entries[side] = entries;
      this.grids[side] = cells;
    }
  }
  /** Select the actual q interval and local coordinate; callers retain lambda as a separate chart coordinate. */
  public coordinates(
    side: P.Side,
    q: number,
    lambda: number,
  ): {
    /** Owning longitudinal q-interval index. */
    i: number;

    /** Normalized local coordinate within that q interval. */
    t: number;

    /** Width of the original q interval; derivatives divide by this scale. */
    length: number;

    /** Owning third of the median-to-entry lambda course. */
    half: number;

    /** Normalized local coordinate within that lambda third. */
    u: number;
  } {
    if (!(q >= 0 && q <= 4 && lambda >= 0 && lambda <= 1))
      throw new Error("Outside actual branch chart");
    const rows: [number, number][] = this.intervals[side];
    let i: number = rows.findIndex((p: [number, number]): boolean => q < p[1]);
    if (i < 0) i = rows.length - 1;
    const [a, b]: [number, number] = rows[i]!,
      half: number = Math.min(Math.floor(3 * lambda), 2);
    return {
      i,
      t: (q - a) / (b - a),
      length: b - a,
      half,
      u: 3 * lambda - half,
    };
  }
}
