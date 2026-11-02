import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";

/** Resolve a lateral endpoint on each monotone span of an actual column spline. */
export namespace AutoMovieHumanThoracicCrossing {
  /** Actual world crossing and its generating phase. */
  export interface IPoint {
    /** Canonical left-half phase in radians. */
    phase: number;
    /** Actual evaluated source position in millimetres. */
    point: [number, number, number];
  }
  /** Complete actual left-half extrema and every admitted crossing. */
  export interface IReading {
    /** Actual endpoint candidates, including a tangent contact. */
    crossings: IPoint[];
    /** Actual minimum and maximum lateral coordinates, mm. */
    range: [number, number];
    /** Every knot and stationary phase used to partition the cubic spans. */
    extrema: IPoint[];
  }

  /** Operation-local immutable section preparation reused by lateral queries. */
  export interface IPrepared {
    /** Query the same evaluated section with the original root and bisection arithmetic. */
    read(lateral: number, stage?: "start" | "end" | "interior"): IReading;
  }

  /**
   * A column's world Z is its periodic cubic section's Z component. Its
   * derivative is quadratic on each knot span. Partition at every actual
   * derivative root, then bracket crossings on those monotone intervals.
   * Uniform sign samples cannot admit a near-tangent endpoint between them.
   * The endpoint remains unchanged; the arithmetic equality allowance is
   * 64 epsilon times coordinate magnitude, not a geometric tolerance.
   * Framed, harmonic and relieved surfaces need a different root proof and
   * are explicitly outside this column operation's admitted domain.
   */
  export function read(owner: Chain, station: number, lateral: number, stage: "start" | "end" | "interior" = "interior"): IReading {
    return prepare(owner, station, stage, lateral).read(lateral, stage);
  }

  /** Prepare coefficients, extrema and the sampler once for one unchanged source section. */
  export function prepare(owner: Chain, station: number, stage: "start" | "end" | "interior" = "interior", lateral?: number): IPrepared {
    const context: Record<string, unknown> = { stage, chain: owner.name, station, targetCoordinate: lateral, units: "mm" };
    if (owner.basis !== "spline" || owner.layers.some((layer: Chain.ILayer): boolean => layer.frame !== undefined) || (owner.reliefs?.length ?? 0) > 0)
      throw new Error("A thoracic endpoint requires an unframed unrelieved spline column", { cause: context });
    const coefficients: number[] = Loft.coefficients(owner, station);
    if (!coefficients.every(Number.isFinite)) throw new Error("A thoracic course evaluated a nonfinite source point", { cause: { ...context, coefficients } });
    const n: number = owner.order;
    const z: (index: number) => number = (index: number): number => coefficients[n + ((index % n) + n) % n]!;
    const phases: Set<number> = new Set([0, Math.PI]);
    for (let span: number = 0; span < Math.ceil(n / 2); span++) {
      const a: number = (-z(span - 1) + 3 * z(span) - 3 * z(span + 1) + z(span + 2)) / 2;
      const b: number = z(span - 1) - 2 * z(span) + z(span + 1);
      const c: number = (z(span + 1) - z(span - 1)) / 2;
      const roots: number[] = quadratic(a, b, c, { ...context, span });
      for (const unit of [0, 1, ...roots]) {
        const phase: number = 2 * Math.PI * (span + unit) / n;
        if (unit >= 0 && unit <= 1 && phase >= 0 && phase <= Math.PI) phases.add(phase);
      }
    }
    const sample: (phase: number) => [number, number, number] = Loft.sampler(owner, station);
    const extrema: IPoint[] = [...phases].sort((a: number, b: number): number => a - b).map((phase: number): IPoint => {
      const point: [number, number, number] = sample(phase);
      if (!point.every(Number.isFinite)) throw new Error("A thoracic course evaluated a nonfinite source point", { cause: { ...context, phase, coordinates: point } });
      return { phase, point };
    });
    const range: [number, number] = [Math.min(...extrema.map((point: IPoint): number => point.point[2])), Math.max(...extrema.map((point: IPoint): number => point.point[2]))];
    return { read: (lateral: number, queryStage: "start" | "end" | "interior" = stage): IReading => {
      if (!Number.isFinite(lateral)) throw new Error("A thoracic crossing needs a finite lateral coordinate", { cause: { ...context, stage: queryStage, targetCoordinate: lateral } });
      const crossings: IPoint[] = [];
      for (let index: number = 0; index < extrema.length; index++) {
        const here: IPoint = extrema[index]!;
        const round: number = 64 * Number.EPSILON * Math.max(1, Math.abs(lateral), Math.abs(here.point[2]));
        if (Math.abs(here.point[2] - lateral) <= round) crossings.push(here);
        if (index === 0) continue;
        const before: IPoint = extrema[index - 1]!;
        const left: number = before.point[2] - lateral;
        if (left * (here.point[2] - lateral) >= 0) continue;
        let low: number = before.phase;
        let high: number = here.phase;
        for (let iteration: number = 0; iteration < 48; iteration++) {
          const middle: number = (low + high) / 2;
          if ((sample(middle)[2] - lateral) * left > 0) low = middle;
          else high = middle;
        }
        const phase: number = (low + high) / 2;
        crossings.push({ phase, point: sample(phase) });
      }
      return { crossings, range, extrema };
    } };
  }

  /** Stable real roots of a derivative polynomial, without a sampling fallback. */
  function quadratic(a: number, b: number, c: number, context: Record<string, unknown>): number[] {
    if (a === 0) return b === 0 ? [] : [-c / b];
    const discriminant: number = b * b - 4 * a * c;
    if (!Number.isFinite(discriminant)) throw new Error("A thoracic endpoint derivative has unresolved arithmetic", { cause: { ...context, a, b, c, discriminant } });
    if (discriminant < 0) return [];
    if (discriminant === 0) return [-b / (2 * a)];
    const q: number = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
    return [q / a, c / q];
  }
}
