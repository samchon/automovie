import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { AutoMovieFootFamily64 as F } from "./AutoMovieFootFamily64";
import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";
import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/** Same-family toe section supports, local PCHIP rails and actual rounded tips. */
export namespace AutoMovieFootToes64 {
  /**
   * Register each toe's longitudinal support rails and append a common distal cap.
   * Named profile fractions locate rows between root gap and projected tip distance.
   * PCHIP rails supply the root jets consumed by branches. The terminal handle uses
   * the supplied cap-rounding ratio on a transverse radial vector; all rails meet
   * the same world tip. Mutates model curves and families without creating toe bones.
   */
  export function construct(
    model: F.Model,
    input: D.Side,
    prefix: string,
  ): void {
    const frame: M.Frame = model.frame;
    const dims: D.Side["dimensions"] = input.dimensions;
    const floor: number = dims.floorOffsetAlongLocalUp_mm;
    const curves: F.Curve[] = model.curves;
    for (const [number, toe] of Object.entries(input.toes)) {
      const name: string = prefix + ".toe" + number;
      const root: number = toe.rootLongitudinalRatio * dims.forefootWebReach_mm;
      const center: number = toe.rootOutwardRatio * dims.breadth_mm;
      const rows: F.Row[] = [];
      for (const [station, p] of Object.entries(toe.profiles).sort(
        (a: [string, D.ToeProfile], b: [string, D.ToeProfile]): number =>
          a[1].fraction - b[1].fraction,
      )) {
        const w: number =
          root +
          toe.rootGap_mm +
          (toe.projectedExtentAfterWeb_mm - toe.rootGap_mm) * p.fraction;
        const sole: number = floor + p.soleHeightAboveFloor_mm;
        const support: Record<string, C.Vector> = F.profile(
          p,
          center + toe.breadth_mm * p.centerOutwardOffsetRatio,
          toe.breadth_mm * p.breadthRatio,
          sole,
          sole + toe.thickness_mm * p.thicknessRatio,
          w,
        );
        const points: Record<string, C.Vector> = Object.fromEntries(
          Object.entries(support).map(
            ([key, v]: [string, C.Vector]): [string, C.Vector] => [
              key,
              M.world(frame, v),
            ],
          ),
        );
        curves.push({
          name: name + ".section." + station,
          role: "toeGeneratingSection",
          closed: true,
          spans: [],
          familyKey: "toe" + number,
          station: w,
        });
        rows.push({ distance: w, points });
      }
      const rails: F.Curve[] = F.rails(
        name,
        rows,
        ["outer", "dorsum", "inner", "sole"],
        frame,
      );
      const tipLocal: C.Vector = [
        center + toe.breadth_mm * toe.tipOutwardOffsetRatio,
        floor + toe.thickness_mm * toe.tipHeightRatio,
        root + toe.projectedExtentAfterWeb_mm,
      ];
      const tip: C.Vector = M.world(frame, tipLocal);
      for (const rail of rails) {
        const last: C.Span = rail.spans[rail.spans.length - 1]!;
        const point: C.Vector = last[3];
        const delta: number = tipLocal[2] - rows[rows.length - 1]!.distance;
        const jet: C.Vector = M.mul(
          M.sub(last[3], last[2]),
          3 /
            (rows[rows.length - 1]!.distance - rows[rows.length - 2]!.distance),
        );
        const r: C.Vector = M.sub(
          point,
          M.mean(Object.values(rows[rows.length - 1]!.points)),
        );
        const radial: C.Vector = M.sub(
          r,
          M.mul(frame.basis[2], M.dot(r, frame.basis[2])),
        );
        rail.spans.push([
          point,
          M.add(point, M.mul(jet, delta / 3)),
          M.add(tip, M.mul(radial, toe.capRoundingRatio)),
          tip,
        ]);
        rail.tipCap = true;
      }
      curves.push(...rails);
      F.register(model, "toe" + number, rails, rows, undefined, tipLocal[2]);
    }
  }
}
