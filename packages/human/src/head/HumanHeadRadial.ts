import type { HumanCurve } from "../internal/HumanCurve";

/** Shared numerical representation for independently identified head courses. */
export namespace HumanHeadRadial {
  /** Project an anisotropically scaled common curve into world radial Fourier form.
   * Both scales are physical mm; the input coefficients are dimensionless. The
   * returned midpoint-grid loss is an observation, not a continuous error bound.
   */
  export function project(radial: readonly number[], forwardMm: number, lateralMm: number): { coefficients: number[]; maximumMm: number } {
    if (!(forwardMm > 0 && lateralMm > 0 && Number.isFinite(forwardMm + lateralMm)))
      throw new Error("Head course scales must be positive finite millimetres");
    const degree: number = 12, samples: number = 256;
    const coefficients: number[] = new Array<number>(2 * degree + 1).fill(0);
    const radius: (phase: number) => number = (phase: number): number => {
      const cosine: number = Math.cos(phase), sine: number = Math.sin(phase);
      const normalized: number = Math.atan2(forwardMm * sine, lateralMm * cosine);
      return evaluate(radial, normalized) / Math.hypot(cosine / forwardMm, sine / lateralMm);
    };
    for (let i: number = 0; i < samples; i++) {
      const phase: number = 2 * Math.PI * i / samples, value: number = radius(phase);
      coefficients[0] = coefficients[0]! + value / samples;
      for (let k: number = 1; k <= degree; k++) {
        coefficients[2 * k - 1] = coefficients[2 * k - 1]! + 2 * value * Math.cos(k * phase) / samples;
        coefficients[2 * k] = coefficients[2 * k]! + 2 * value * Math.sin(k * phase) / samples;
      }
    }
    let maximumMm: number = 0;
    for (let i: number = 0; i < samples; i++) {
      const phase: number = 2 * Math.PI * (i + 0.5) / samples;
      maximumMm = Math.max(maximumMm, Math.abs(radius(phase) - evaluate(coefficients, phase)));
    }
    return { coefficients, maximumMm };
  }

  /** Evaluate every declared Fourier mode, without reducing its degree. */
  export function evaluate(coefficients: readonly number[], phase: number): number {
    let radius: number = coefficients[0]!;
    for (let k: number = 1; 2 * k < coefficients.length; k++)
      radius += coefficients[2 * k - 1]! * Math.cos(k * phase) + coefficients[2 * k]! * Math.sin(k * phase);
    return radius;
  }

  /** Evaluate a generated principal plane in world mm at phase radians. */
  export function position(section: HumanCurve.Section, phase: number): HumanCurve.Vector {
    const radius: number = evaluate(section.coefficientsMm, phase);
    const cosine: number = Math.cos(phase), sine: number = Math.sin(phase);
    return section.originMm.map((value: number, axis: number): number =>
      value + radius * (section.axisU[axis]! * cosine + section.axisV[axis]! * sine)) as HumanCurve.Vector;
  }

  /** Exact phase derivative of a generated principal curve, in mm/radian^order. */
  export function phaseDerivative(section: HumanCurve.Section, phase: number, order: 1 | 2): HumanCurve.Vector {
    const result: HumanCurve.Vector = [0, 0, 0];
    for (let j: number = 0; j <= order; j++) {
      let radial: number = j === 0 ? section.coefficientsMm[0]! : 0;
      for (let k: number = 1; 2 * k < section.coefficientsMm.length; k++) {
        const angle: number = k * phase + j * Math.PI / 2;
        radial += k ** j * (section.coefficientsMm[2 * k - 1]! * Math.cos(angle) + section.coefficientsMm[2 * k]! * Math.sin(angle));
      }
      const angle: number = phase + (order - j) * Math.PI / 2;
      const binomial: number = order === 2 && j === 1 ? 2 : 1;
      for (let axis: number = 0; axis < 3; axis++)
        result[axis] = result[axis]! + binomial * radial * (section.axisU[axis]! * Math.cos(angle) + section.axisV[axis]! * Math.sin(angle));
    }
    return result;
  }
}
