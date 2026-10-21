import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import { HumanJointRules } from "./HumanJointRules";

/** Source-free elbow and knee support-neighborhood shape laws. The sole common
 * boundary owner restricts shafts, transports phase and supplies joining spans.
 * These bands establish no clinical joint location or unobserved patella apex.
 */
export namespace HumanJointCurves {
  /** One common observed joint band, before shared-boundary assembly. */
  export interface Region {
    /** Joint and side identity, independent of reference people. */
    id: string;

    /** The source-observed support-plane curve at physical station zero. */
    middle: HumanCurve.Section;

    /** One analytic authority for skin, construction, first, second and mixed derivatives. */
    family: HumanCurveFamily.Family;

    /** Common normalized source overlap scaled by the actual joint course, mm. */
    observedDomainMm: [number, number];

    /** Outward orientation of longitudinal cross circumferential derivatives. */
    outwardSign: 1 | -1;

    /** Source-fit, parameter-response and assembly qualifications. */
    limitations: string[];
  }

  /** Build both elbow and knee bands around the generated current supports.
   * Station is signed bisector-plane distance in mm, increasing distally;
   * phase is radians in the forward-projected common chart. Authored physical
   * elbow/knee course controls scale the common dimensionless channels.
   * Source identification separately normalizes by actual measured courses.
   */
  export function build(
    parameters: IAutoMovieHumanBodyParameters,
    skeleton: HumanSkeleton.Result,
  ): Region[] {
    const regions: Region[] = [];
    const definitions: Array<[HumanJointRules.Joint, string, string, string]> = [
      ["elbow", "upperarm", "lowerarm", "hand"],
      ["knee", "thigh", "calf", "foot"],
    ];
    for (const side of ["l", "r"] as const)
      for (const [joint, incoming, middle, outgoing] of definitions) {
        const id: string = "joint-" + joint + "-" + side;
        const rule: HumanJointRules.Rule = HumanJointRules.rules[joint];
        const requestedCourse: number | null = parameters.controls[joint].value;
        if (requestedCourse === null || !(Number.isFinite(requestedCourse) && requestedCourse > 0))
          throw new Error("A positive authored physical joint-course control is required: " + id);
        const course: number = requestedCourse;
        const a: HumanCurve.Vector = support(incoming + "_" + side);
        const j: HumanCurve.Vector = support(middle + "_" + side);
        const b: HumanCurve.Vector = support(outgoing + "_" + side);
        const n0: HumanCurve.Vector = unit(subtract(j, a), id + " incoming axis");
        const n1: HumanCurve.Vector = unit(subtract(b, j), id + " outgoing axis");
        const normal: HumanCurve.Vector = unit(add(n0, n1), id + " bisector axis");
        const projected: HumanCurve.Vector = [
          1 - normal[0] * normal[0], -normal[0] * normal[1], -normal[0] * normal[2],
        ];
        if (Math.hypot(...projected) < 1e-6)
          throw new Error("Forward cannot define the generated joint roll: " + id);
        const v: HumanCurve.Vector = unit(projected, id + " rolled forward");
        const u: HumanCurve.Vector = scale(cross(v, normal), side === "l" ? 1 : -1);
        const halfBandMm: number = course * rule.halfDomainRatio;
        const limitations: string[] = [
          "This is a fitted current-pose support neighborhood, not a clinical joint or pose-retargeting model.",
          "Original Hermite source-fit tolerance failures remain separate from the common Fourier/longitudinal residual.",
          "Longitudinal and mixed jets differentiate the common fitted law; source circumferential Hermite derivatives do not directly observe them.",
          "The observed band does not identify an unobserved patella apex or a universal joint volume minimum.",
          "The common boundary owner must restrict adjacent shafts and establish shared phase, positions and jets.",
          "Independent shape response beyond actual joint-course scaling and the four observed current poses is unqualified.",
        ];
        if (course < rule.sourceCourseRangeMm[0] || course > rule.sourceCourseRangeMm[1])
          limitations.push("The authored joint course lies outside the observed source range; its scaled shape is an unobserved prediction.");
        const sections: HumanCurve.Section[] = [-halfBandMm, 0, halfBandMm].map(
          (stationMm: number, index: number): HumanCurve.Section => section(stationMm, index),
        );
        const family: HumanCurveFamily.Family = HumanCurveFamily.fromFunction(sections, evaluateJet, limitations);
        regions.push({
          id, middle: family.sections[1]!, family, observedDomainMm: [-halfBandMm, halfBandMm],
          outwardSign: side === "l" ? -1 : 1, limitations,
        });

        function channels(stationMm: number): Channels {
          const xi: number = stationMm / (course * rule.etaScale);
          const value: number[] = [];
          const derivative: number[] = [];
          const secondDerivative: number[] = [];
          for (const coefficients of rule.theta) {
            let f: number = 0;
            let d: number = 0;
            let dd: number = 0;
            for (let degree: number = 0; degree < coefficients.length; ++degree) {
              f += coefficients[degree]! * xi ** degree;
              if (degree > 0) d += degree * coefficients[degree]! * xi ** (degree - 1);
              if (degree > 1) dd += degree * (degree - 1) * coefficients[degree]! * xi ** (degree - 2);
            }
            value.push(course * f);
            derivative.push(d / rule.etaScale);
            secondDerivative.push(dd / (course * rule.etaScale * rule.etaScale));
          }
          return { value, derivative, secondDerivative };
        }

        function section(stationMm: number, index: number): HumanCurve.Section {
          const c: number[] = channels(stationMm).value;
          return {
            id: id + (index === 1 ? ".support-middle" : index === 0 ? ".observed-incoming-limit" : ".observed-outgoing-limit"),
            stationMm, originMm: add(add(add(j, scale(normal, stationMm)), scale(u, c[0]!)), scale(v, c[1]!)),
            axisU: u, axisV: v, coefficientsMm: c.slice(2),
          };
        }

        function evaluateJet(stationMm: number, phaseRadians: number): HumanCurveFamily.Jet {
          const c: Channels = channels(stationMm);
          const cosine: number = Math.cos(phaseRadians);
          const sine: number = Math.sin(phaseRadians);
          const e: HumanCurve.Vector = add(scale(u, cosine), scale(v, sine));
          const ep: HumanCurve.Vector = add(scale(u, -sine), scale(v, cosine));
          let radius: number = c.value[2]!;
          let radiusS: number = c.derivative[2]!;
          let radiusSS: number = c.secondDerivative[2]!;
          let radiusPhase: number = 0;
          let radiusPhasePhase: number = 0;
          let radiusSPhase: number = 0;
          for (let k: number = 1; 2 * k + 2 < c.value.length; ++k) {
            const cs: number = Math.cos(k * phaseRadians);
            const sn: number = Math.sin(k * phaseRadians);
            radius += c.value[2 * k + 1]! * cs + c.value[2 * k + 2]! * sn;
            radiusS += c.derivative[2 * k + 1]! * cs + c.derivative[2 * k + 2]! * sn;
            radiusSS += c.secondDerivative[2 * k + 1]! * cs + c.secondDerivative[2 * k + 2]! * sn;
            radiusPhase += k * (-c.value[2 * k + 1]! * sn + c.value[2 * k + 2]! * cs);
            radiusPhasePhase -= k * k * (c.value[2 * k + 1]! * cs + c.value[2 * k + 2]! * sn);
            radiusSPhase += k * (-c.derivative[2 * k + 1]! * sn + c.derivative[2 * k + 2]! * cs);
          }
          if (!(radius > 0 && Number.isFinite(radius)))
            throw new Error("The common joint radial chart is unresolved: " + id);
          const origin: HumanCurve.Vector = add(add(add(j, scale(normal, stationMm)), scale(u, c.value[0]!)), scale(v, c.value[1]!));
          const originS: HumanCurve.Vector = add(add(normal, scale(u, c.derivative[0]!)), scale(v, c.derivative[1]!));
          const originSS: HumanCurve.Vector = add(scale(u, c.secondDerivative[0]!), scale(v, c.secondDerivative[1]!));
          return {
            positionMm: add(origin, scale(e, radius)),
            longitudinalDerivative: add(originS, scale(e, radiusS)),
            phaseDerivativeMmPerRadian: add(scale(ep, radius), scale(e, radiusPhase)),
            longitudinalPhaseDerivativePerRadian: add(scale(ep, radiusS), scale(e, radiusSPhase)),
            longitudinalSecondDerivative: add(originSS, scale(e, radiusSS)),
            phaseSecondDerivativeMmPerRadianSquared: add(scale(e, radiusPhasePhase - radius), scale(ep, 2 * radiusPhase)),
          };
        }
      }
    return regions;

    function support(name: string): HumanCurve.Vector {
      const point: HumanCurve.Vector | undefined = skeleton.supports.get(name);
      if (!point || !point.every(Number.isFinite)) throw new Error("A generated joint support is unresolved: " + name);
      return [point[0], point[1], point[2]];
    }
  }

  /** Physical channel values, dimensionless first jets and inverse-mm second jets. */
  interface Channels { value: number[]; derivative: number[]; secondDerivative: number[]; }

  function add(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a: HumanCurve.Vector, factor: number): HumanCurve.Vector {
    return [a[0] * factor, a[1] * factor, a[2] * factor];
  }

  function unit(a: HumanCurve.Vector, name: string): HumanCurve.Vector {
    const length: number = Math.hypot(...a);
    if (!(length > 1e-12 && Number.isFinite(length)))
      throw new Error("A finite nondegenerate joint direction is required: " + name);
    return scale(a, 1 / length);
  }

  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
}
