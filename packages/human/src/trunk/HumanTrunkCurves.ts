import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import { HumanTrunkLaw } from "./HumanTrunkLaw";

/** Joint source values and jets, transported once into the assembly skeleton.
 * Common quintic shape fields identify size planes and intermediate geometry
 * together. Independent first jets and minimum-jerk second jets carry observed
 * profile turning without adding size planes or specimen-specific controls.
 * Skin, normals and construction consume this same analytic function.
 */
export namespace HumanTrunkCurves {
  /** Build the source gauge before applying an affine centre displacement.
   * If world Y=a*source Y+b, radial geometry remains in physical mm. The inverse
   * gauge and chain rule divide longitudinal and mixed jets by a; the centre
   * displacement's derivative is included once. This preserves C2 continuity
   * without the previous mapped-width-squared radial amplification. Mappers
   * must match one affine station displacement at every principal centre.
   */
  export function build(
    parameters: IAutoMovieHumanBodyParameters,
    mapOrigin?: (originMm: HumanCurve.Vector, id: string) => HumanCurve.Vector,
  ): HumanCurveFamily.Family {
    const source: HumanTrunkLaw.Gauge = HumanTrunkLaw.build(parameters);
    const sections: HumanCurve.Section[] = source.sections.map((section: HumanCurve.Section): HumanCurve.Section => {
      const origin: HumanCurve.Vector = mapOrigin ? mapOrigin(section.originMm, section.id.slice("trunk.".length)) : [...section.originMm];
      if (origin.length !== 3 || !origin.every(Number.isFinite))
        throw new Error("The trunk assembly mapper returned a nonfinite centre");
      return { ...section, stationMm: origin[1], originMm: origin };
    });
    const first: HumanCurve.Section = source.sections[0]!;
    const last: HumanCurve.Section = source.sections.at(-1)!;
    const sourceWidth: number = last.stationMm - first.stationMm;
    const worldStart: number = sections[0]!.stationMm;
    const scale: number = (sections.at(-1)!.stationMm - worldStart) / sourceWidth;
    if (!(scale > 0 && Number.isFinite(scale)))
      throw new Error("The trunk assembly mapper collapsed or reversed its physical gauge");
    const displacement: HumanCurve.Vector = difference(sections[0]!.originMm, first.originMm);
    const displacementDerivative: HumanCurve.Vector = difference(
      difference(sections.at(-1)!.originMm, last.originMm), displacement,
    ).map((value: number): number => value / sourceWidth) as HumanCurve.Vector;
    for (let i: number = 0; i < sections.length; i++) {
      const distance: number = source.sections[i]!.stationMm - first.stationMm;
      for (let axis: number = 0; axis < 3; axis++) {
        const predicted: number = source.sections[i]!.originMm[axis]! + displacement[axis]! + distance * displacementDerivative[axis]!;
        if (Math.abs(predicted - sections[i]!.originMm[axis]!) > 1e-6)
          throw new Error("The trunk assembly mapper must preserve one affine centre-displacement gauge");
      }
    }
    return HumanCurveFamily.fromFunction(sections, (station: number, phase: number): HumanCurveFamily.Jet => {
      const sourceStation: number = first.stationMm + (station - worldStart) / scale;
      const value: HumanCurveFamily.Jet = source.jet(sourceStation, phase);
      const distance: number = sourceStation - first.stationMm;
      return {
        positionMm: value.positionMm.map((component: number, axis: number): number =>
          axis === 1 ? station : component + displacement[axis]! + distance * displacementDerivative[axis]!,
        ) as HumanCurve.Vector,
        longitudinalDerivative: value.longitudinalDerivative.map((component: number, axis: number): number =>
          (component + displacementDerivative[axis]!) / scale,
        ) as HumanCurve.Vector,
        phaseDerivativeMmPerRadian: value.phaseDerivativeMmPerRadian,
        longitudinalPhaseDerivativePerRadian: value.longitudinalPhaseDerivativePerRadian.map((component: number): number => component / scale) as HumanCurve.Vector,
        ...(value.longitudinalSecondDerivative === undefined ? {} : { longitudinalSecondDerivative: value.longitudinalSecondDerivative.map((component: number): number => component/(scale*scale)) as HumanCurve.Vector }),
        ...(value.phaseSecondDerivativeMmPerRadianSquared === undefined ? {} : { phaseSecondDerivativeMmPerRadianSquared: value.phaseSecondDerivativeMmPerRadianSquared }),
        ...(value.longitudinalPhaseSecondDerivativePerRadianSquared === undefined ? {} : { longitudinalPhaseSecondDerivativePerRadianSquared: value.longitudinalPhaseSecondDerivativePerRadianSquared.map((component: number): number => component/scale) as HumanCurve.Vector }),
      };
    }, [
      "Five native size planes and all five first jets share pooled C2 minimum-jerk quintic fields fitted jointly to original source Hermite observations and local longitudinal jet estimates",
      "Native circumference controls and recovered transverse surface perimeter are distinct observables; their geometric scale relation is learned, not forced to equality",
      "The native-girth scalar is cubic and dimensionless shape is quintic with radial Fourier order ten; their analytic degree-eight longitudinal product and angular jets are retained without layer copies or polynomial reduction",
      "Source-gauge shape in mm is preserved by affine skeleton transport; longitudinal and mixed derivatives use its inverse physical Jacobian",
      "Four correlated references support conditional interpolation only; independent girth and shape responses, interactions and extrapolation remain unqualified",
      "Native size planes are not anatomical extrema: male source area minima lie about 26 mm below native waist planes; source volume, feature location and independent muscularity/fat response remain incompletely identified",
      "Local slope, perimeter, lower-hip centre and angular detail residuals remain; some holdout first-jet errors and Daniel centre RMS increase despite lower radial error, and source fitting does not establish actual-render improvement",
      "External shoulder, pelvic and neck branches remain outside this trunk domain",
      "Additional volume feature curves are stationary areas of the same degree-eight generated family; recursive derivative-root isolation supplies binary64 sign brackets, not certified coefficient-error or source-anatomy bounds",
      ...source.volumeFeatures.map((feature: HumanTrunkLaw.Gauge["volumeFeatures"][number]): string =>
        feature.id + " source-gauge numerical station bracket in mm: " + JSON.stringify(feature.stationBoundsMm)),
    ]);
  }

  /** Subtract physical world vectors without changing their reference frame. */
  function difference(left: HumanCurve.Vector, right: HumanCurve.Vector): HumanCurve.Vector {
    return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
  }
}
