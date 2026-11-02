import { AutoMovieHumanHeadCranialImplicitSection as I } from "./AutoMovieHumanHeadCranialImplicitSection";

/** Safeguarded machine-precision root of the unchanged actual two-body field. */
export namespace AutoMovieHumanHeadCranialSourceRoot {
  /** Actual numerical work and geometric residual, without a changed dimension. */
  export interface IResult {
    /** Actual radius on the original source ray. */
    radius: number;
    /** Last safeguarded iterate, separate from the retained old skin on failure. */
    rootRadius: number;
    /** True only when failure retained the exact previous bounded body solver. */
    fallbackUsed: boolean;
    /** Actual primal-field calls performed by that previous bounded solver. */
    fallbackEvaluations: number;
    /** Root acceptance, independent of anatomical and clinical availability. */
    healthy: boolean;
    /** Actual root iterations, including an exhausted budget. */
    iterations: number;
    /** Actual implicit value/gradient evaluations, including bracket work. */
    evaluations: number;
    /** Final absolute implicit residual. */
    fieldResidual: number;
    /** Residual converted through the actual radial derivative to millimetres. */
    radialResidualMm: number;
    /** Floating-point coordinate budget derived from the source scale. */
    coordinateBudgetMm: number;
    /** Explicit unaccepted source geometry or numerical condition. */
    reason?: string;
  }

  /**
   * Solve Q=g^-POWER+shield*f^-POWER-1=0, exactly the old field=1 equation.
   * Newton uses the actual analytic gradient and remains bracketed. The stop
   * budget is eight floating-point epsilons of the source coordinate scale;
   * it changes neither the outer 1e-12 rad criterion nor a clinical limit.
   */
  export function prepare(section: I.Inputs, originXi: number): (theta: number, guess?: number) => IResult {
    const operator: I.Operator = I.operator(section);
    return (theta: number, guess: number = 0): IResult => {
      const c: number = Math.cos(theta);
      const n: number = Math.sin(theta);
      let evaluations: number = 0;
      const read = (r: number): I.Jet => { evaluations++; return operator.evaluate(originXi + r * c, r * n, false); };
      let lo: number = 0;
      let hi: number = 3 * Math.max(10, section.front - section.back);
      const inside: I.Jet = read(0);
      let outside: I.Jet = read(hi);
      for (let expansion: number = 0; outside.value > 0 && expansion < 32; expansion++) { hi *= 2; outside = read(hi); }
      let r: number = guess > lo && guess < hi ? guess : (section.front - section.back) / 2 || 1;
      if (!(r > lo && r < hi)) r = (lo + hi) / 2;
      let jet: I.Jet = read(r);
      let radialResidualMm: number = Infinity;
      let coordinateBudgetMm: number = NaN;
      const result = (healthy: boolean, iterations: number, reason?: string): IResult => {
        const retained: { radius: number; evaluations: number } = healthy ? { radius: r, evaluations: 0 } : legacy(section, originXi, theta, guess);
        return { radius: retained.radius, rootRadius: r, fallbackUsed: !healthy, fallbackEvaluations: retained.evaluations, healthy, iterations, evaluations, fieldResidual: Math.abs(jet.value), radialResidualMm, coordinateBudgetMm, reason };
      };
      if (!(inside.value >= 0 && outside.value <= 0)) return result(false, 0, "The original source ray has no inside/outside bracket.");
      for (let iteration: number = 1; iteration <= 64; iteration++) {
        const derivative: number = jet.gradient[0] * c + jet.gradient[1] * n;
        radialResidualMm = Math.abs(jet.value / derivative);
        coordinateBudgetMm = 8 * Number.EPSILON * Math.max(1, Math.abs(originXi), Math.abs(section.front), Math.abs(section.back), section.width, section.face, Math.abs(r));
        if (Number.isFinite(radialResidualMm) && derivative < 0 && radialResidualMm <= coordinateBudgetMm) return result(true, iteration);
        if (iteration === 64) return result(false, 64, "The actual source root exhausted its safeguarded Newton budget.");
        if (jet.value > 0) lo = r;
        else hi = r;
        const next: number = r - jet.value / derivative;
        let chosen: number = next > lo && next < hi && Number.isFinite(next) ? next : (lo + hi) / 2;
        if (chosen === r) chosen = (lo + hi) / 2;
        if (chosen === lo || chosen === hi || chosen === r)
          return result(false, iteration, "The actual source root exhausted floating-point separation before its residual closed.");
        r = chosen;
        jet = read(r);
      }
      return result(false, 64, "The actual source root exhausted its safeguarded Newton budget.");
    };
  }

  /**
   * Retain the previous twelve fixed-point plus forty bisection steps exactly
   * when the stricter root is unaccepted. Its original arithmetic, including
   * nonfinite invalid inputs, is intentionally preserved rather than repaired
   * into a different skin. Numerical failure remains false and observable.
   */
  function legacy(section: I.Inputs, originXi: number, theta: number, guess: number): { radius: number; evaluations: number } {
    let evaluations: number = 0;
    const raw: number = Math.min(1, Math.max(0, (section.handover - section.t) / (section.handover - section.handed)));
    const neck: number = raw * raw * (3 - 2 * raw);
    const anterior: number = neck * (section.axis - section.back) + (1 - neck) * (section.waist - section.axis);
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const field = (radius: number): number => {
      evaluations++;
      const x: number = originXi + radius * c;
      const z: number = radius * n;
      const g: number = (Math.abs((x - section.axis) / Math.max(1, x < section.axis ? section.axis - section.back : anterior)) ** section.powerBack + Math.abs(z / section.width) ** section.powerBack) ** (1 / section.powerBack);
      const f: number = (Math.abs((x - section.waist) / Math.max(1, section.front - section.waist)) ** section.powerFace + Math.abs(z / section.face) ** section.powerFace) ** (1 / section.powerFace);
      return (g ** -section.power + section.shield * f ** -section.power) ** (-1 / section.power);
    };
    let radius: number = guess > 0 ? guess : (section.front - section.back) / 2 || 1;
    for (let i: number = 0; i < 12; i++) {
      const next: number = radius / field(radius);
      if (Math.abs(next - radius) < 1e-6) return { radius: next, evaluations };
      radius = next;
    }
    let lo: number = 0;
    let hi: number = 3 * Math.max(10, section.front - section.back);
    for (let i: number = 0; i < 40; i++) {
      const middle: number = (lo + hi) / 2;
      if (field(middle) < 1) lo = middle;
      else hi = middle;
    }
    return { radius: lo, evaluations };
  }
}
