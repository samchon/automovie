import { AutoMovieViewOutline as O } from "../../../packages/engine/src/geometry/construction/AutoMovieViewOutline";
import type { PartConicFields as F } from "./PartConicFields";
import type { PartConicTypes as T } from "./PartConicTypes";
import { PartConicInput as I } from "./PartConicInput";

/** Moving-boundary checks use the engine's analytic surface jets, with explicitly finite one-sided approaches. */
export namespace PartConicJoins {
  /** Inspect the full surface, not merely the G1 directions of independent section conics. */
  export function inspect(part: T.Part, result: F.Result): { available: boolean; samples: number; approachRadians: number[]; maximumNormalJumpDegrees: number; maximumPhaseDerivativeRelativeJump: number; maximumBoundaryStationResidual: number; errors: string[] } {
    const summary = { available: result.loft.surface !== null, samples: 0, approachRadians: [1e-5, 1e-7], maximumNormalJumpDegrees: 0, maximumPhaseDerivativeRelativeJump: 0, maximumBoundaryStationResidual: 0, errors: [] as string[] };
    const surface = result.loft.surface;
    if (surface === null) return summary;
    const fields: O.IOutline[] = result.coefficients.fields.map((knots): O.IOutline => { const prepared = O.create({ knots }); if ("contract" in prepared) throw new Error(prepared.detail); return prepared; });
    const contacts: [number, number][] = [[0, 4], [5, 2], [1, 6], [7, 3]];
    if (result.coefficients.piecesPerQuarter === 2) for (let q: number = 0; q < 4; ++q) contacts.push([12 + 4 * q, 13 + 4 * q]);
    for (const row of part.rows) for (const contact of contacts) {
      try {
        const a = O.at(fields[contact[0]]!, row.s); const b = O.at(fields[contact[1]]!, row.s);
        if (typeof a === "string" || typeof b === "string" || a.stationJet === null || b.stationJet === null) throw new Error("Moving-contact physical station jet unavailable.");
        const theta: number = Math.atan2(b.value, a.value);
        const thetaPrime: number = (a.value * b.stationJet[0] - b.value * a.stationJet[0]) / (a.value * a.value + b.value * b.value);
        const expected: T.V = [0, 1, 2].map((k: number): number => part.n[k]! + part.u[k]! * a.stationJet![0] + part.v[k]! * b.stationJet![0]) as T.V;
        for (const delta of summary.approachRadians) {
          const left = surface.jet(row.s, (theta - delta + 2 * Math.PI) % (2 * Math.PI));
          const right = surface.jet(row.s, (theta + delta + 2 * Math.PI) % (2 * Math.PI));
          const lu: T.V = [0, 1, 2].map((k: number): number => left.u[k]! + delta * left.uv[k]!) as T.V;
          const ru: T.V = [0, 1, 2].map((k: number): number => right.u[k]! - delta * right.uv[k]!) as T.V;
          const lv: T.V = [0, 1, 2].map((k: number): number => left.v[k]! + delta * left.vv[k]!) as T.V;
          const rv: T.V = [0, 1, 2].map((k: number): number => right.v[k]! - delta * right.vv[k]!) as T.V;
          const ln: T.V = I.cross(lu, lv); const rn: T.V = I.cross(ru, rv);
          const cosine: number = I.dot(ln, rn) / (Math.hypot(...ln) * Math.hypot(...rn));
          summary.maximumNormalJumpDegrees = Math.max(summary.maximumNormalJumpDegrees, Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI);
          summary.maximumPhaseDerivativeRelativeJump = Math.max(summary.maximumPhaseDerivativeRelativeJump, Math.hypot(...I.sub(lv, rv)) / Math.max(Math.hypot(...lv), Math.hypot(...rv)));
          for (const [u, v] of [[lu, lv], [ru, rv]]) {
            const boundary: T.V = [0, 1, 2].map((k: number): number => u![k]! + thetaPrime * v![k]!) as T.V;
            summary.maximumBoundaryStationResidual = Math.max(summary.maximumBoundaryStationResidual, Math.hypot(...I.sub(boundary, expected)));
          }
          ++summary.samples;
        }
      } catch (error) { summary.errors.push(String(error)); }
    }
    return summary;
  }
}
