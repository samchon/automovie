import {
  AutoMoviePchipField64,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { ITorsoMeasurements as T } from "./ITorsoMeasurements";
import { TorsoFamily } from "./TorsoFamily";
import { TorsoMath as M } from "./TorsoMath";

/** Approximate two separate lower mass borders on the actual common family.
 * The inner endpoint is at the phase midpoint of its prominence-to-sternum span;
 * the outer endpoint is its anterior-root lane. This correspondence is a common
 * geometric convention, not an extracted inframammary or pectoral crease.
 * Sixteen Hermite pieces per sector use the actual composed first derivative.
 * Reported error covers only the three declared samples per piece.
 */
export function constructAutoMovieTorsoMassBorders64(
  p: T.Value,
  family: TorsoFamily,
): {
  /** Two disjoint actual-family restrictions, expressed in world millimetres. */
  curves: C.Cubic[];

  /** Maximum discrepancy at the three selected samples of each piece, in mm. */
  maximumSelectedApproximationErrorMm: number;
} {
  const ay: number = family.rows.at(-1)!.y;
  const fold: number = family.rows.find(
    (row: { name: string; y: number }): boolean =>
      row.name === "underfoldProxy",
  )!.y;
  const phase: number[] = M.cumulative(family.widths),
    rootFold: number = p.foldRootHeightRatio * p.trunkLengthMm;
  const height: AutoMoviePchipField64 = new AutoMoviePchipField64(
    phase.slice(0, 9),
    [
      ay,
      rootFold,
      rootFold,
      fold,
      p.foldMedianHeightRatio * p.trunkLengthMm,
      fold,
      rootFold,
      rootFold,
      ay,
    ].map((v: number): number[] => [v]),
  );
  const point: (s: number, j: number) => C.Vector = (
    s: number,
    j: number,
  ): C.Vector =>
    family.sample(height.at(s)[0]!, j, (s - phase[j]!) / family.widths[j]!);
  const derivative: (s: number, j: number) => C.Vector = (
    s: number,
    j: number,
  ): C.Vector => {
    const y: number = height.at(s)[0]!,
      t: number = (s - phase[j]!) / family.widths[j]!;
    return M.add(
      M.mul(
        M.angularDerivative(family.controls(y)[j]!, t),
        1 / family.widths[j]!,
      ),
      M.mul(M.bez(family.controls(y, true)[j]!, t), height.at(s, true)[0]!),
    );
  };
  // Each visible lower-border proxy stays on its own front mass. The sternum
  // is not connected by a false cross-chest fold. These finite Hermite pieces
  // approximate the varying-height family restriction, not a measured crease.
  const curves: C.Cubic[] = [];
  let foldError: number = 0;
  for (const side of ["left", "right"] as const) {
    const spans: C.Span[] = [];
    const widths: number[] = [];
    const sectors: readonly number[] = side === "left" ? [2, 3] : [4, 5];
    for (const j of sectors) {
      const start: number = phase[j]! + (j === 4 ? 0.5 * family.widths[j]! : 0);
      const end: number =
        phase[j + 1]! - (j === 3 ? 0.5 * family.widths[j]! : 0);
      for (let piece: number = 0; piece < 16; piece++) {
        const lo: number = start + ((end - start) * piece) / 16;
        const hi: number =
          piece === 15 ? end : start + ((end - start) * (piece + 1)) / 16;
        const q: C.Span = M.hermite(
          point(lo, j),
          point(hi, j),
          derivative(lo, j),
          derivative(hi, j),
          hi - lo,
        );
        spans.push(q);
        widths.push(hi - lo);
        for (const t of [0.2, 0.5, 0.8])
          foldError = Math.max(
            foldError,
            M.length(M.sub(M.bez(q, t), point(lo + t * (hi - lo), j))),
          );
      }
    }
    curves.push(
      M.cubic(side + ".pairedMassLowerBorder.proxy", spans, false, widths),
    );
  }
  return { curves, maximumSelectedApproximationErrorMm: foldError };
}
