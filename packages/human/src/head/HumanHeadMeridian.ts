import type { HumanCurve } from "../internal/HumanCurve";
import { HumanHeadRadial } from "./HumanHeadRadial";

/** Physical meridian chord parameterization independent of the world up axis. */
export namespace HumanHeadMeridian {
  /** Reparameterize unchanged principal curves by mean corresponding chord length.
   * Each interval averages 128 phase-matched world chord lengths in mm. This is
   * a finite quadrature of principal-to-principal meridian chords, not the exact
   * arc length of the resulting spline. A terminal horizontal tangent is then
   * compatible with the longitudinal parameter without pretending that s is Y.
   * No principal position, Fourier order, plane or topology changes here.
   */
  export function parameterize(principal: readonly HumanCurve.Section[]): HumanCurve.Section[] {
    if (principal.length < 2) throw new Error("Head meridian chart requires adjacent principal curves");
    const result: HumanCurve.Section[] = [];
    let station: number = 0;
    for (let i: number = 0; i < principal.length; i++) {
      if (i > 0) {
        let meanChordMm: number = 0;
        for (let sample: number = 0; sample < 128; sample++) {
          const phase: number = 2 * Math.PI * sample / 128;
          const a: HumanCurve.Vector = HumanHeadRadial.position(principal[i - 1]!, phase);
          const b: HumanCurve.Vector = HumanHeadRadial.position(principal[i]!, phase);
          meanChordMm += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 128;
        }
        if (!(meanChordMm > 0 && Number.isFinite(meanChordMm)))
          throw new Error("Adjacent head principal curves have no finite meridian chord width");
        station += meanChordMm;
      }
      const section: HumanCurve.Section = principal[i]!;
      result.push({
        ...section, stationMm: station,
        originMm: [...section.originMm], axisU: [...section.axisU], axisV: [...section.axisV],
        coefficientsMm: [...section.coefficientsMm],
      });
    }
    return result;
  }
}
