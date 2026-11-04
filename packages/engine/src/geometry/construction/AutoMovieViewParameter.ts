import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

/**
 * Source parameter arithmetic shared by radial outlines and nonzero world-coordinate curves.
 *
 * @evidence contracts/common.md#principled-implementation Implements the existing monotone station/root/angle maps, analytic inverse and station derivatives independently of radial closure.
 * @evidence contracts/common.md#clear-and-simple-design One owner admits, maps, inverts and differentiates source parameters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside-domain stations remain invalid and singular endpoint jets remain absent; scalar values are never changed here.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes parameter endpoints, scalar values and radial closure, with kernel millimetre units.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic per map, inverse or derivative.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure scalar arithmetic coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds no global state or handles.
 */
export namespace AutoMovieViewParameter {
  /**
   * Admit and copy parameter endpoints already converted to kernel millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Finite roots and a finite positive angle span define the monotone source domain.
   * @evidence contracts/common.md#clear-and-simple-design Returns a copied record, undefined identity map, or named failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses invalid endpoints without sorting or widening a domain.
   * @evidence contracts/common.md#meaningful-documentation States units and all return states.
   * @evidence contracts/performance.md#efficient-algorithms Constant checks and a fixed-size copy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pure admission has no reusable effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns a copied record; no input is retained.
   */
  export function prepare(parameter: AutoMovieConstructionOutlineParameter | undefined): AutoMovieConstructionOutlineParameter | undefined | string {
    if (parameter === undefined) return undefined;
    if (parameter.type === "root") return Number.isFinite(parameter.pole) && (parameter.end === "bottom" || parameter.end === "top") ? { ...parameter } : "root parameter needs a finite endpoint and its bottom/top side";
    return Number.isFinite(parameter.bottom) && Number.isFinite(parameter.top) && parameter.top > parameter.bottom && Number.isFinite(parameter.top - parameter.bottom) ? { ...parameter } : "angle parameter needs finite increasing endpoints and a finite span";
  }

  /**
   * Map a station; nonfinite or outside-domain requests return NaN.
   *
   * @evidence contracts/common.md#principled-implementation Uses signed square root or the equivalent angle root/asin expression from the nearer endpoint to avoid cancellation.
   * @evidence contracts/common.md#clear-and-simple-design One map serves all scalar meanings, with omission as identity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp a station or alter any scalar value.
   * @evidence contracts/common.md#meaningful-documentation States admitted-domain and invalid-query behavior.
   * @evidence contracts/performance.md#efficient-algorithms Constant work with at most one root and asin.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure scalar mapping schedules no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(parameter: AutoMovieConstructionOutlineParameter | undefined, station: number): number {
    if (!Number.isFinite(station)) return NaN;
    if (parameter === undefined) return station;
    if (parameter.type === "root") {
      const d: number = parameter.end === "bottom" ? station - parameter.pole : parameter.pole - station;
      return d >= 0 ? (parameter.end === "bottom" ? 1 : -1) * Math.sqrt(d) : NaN;
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    if (a < 0 || b < 0) return NaN;
    const span: number = parameter.top - parameter.bottom;
    return a <= b ? 2 * Math.asin(Math.sqrt(a / span)) : Math.PI - 2 * Math.asin(Math.sqrt(b / span));
  }

  /**
   * Invert an admitted in-span source parameter.
   *
   * @evidence contracts/common.md#principled-implementation Uses the square-root inverse and angle half-sine identity, from the nearer endpoint.
   * @evidence contracts/common.md#clear-and-simple-design One inverse serves all critical-station observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Assumes the admitted parameter span and invents no closure.
   * @evidence contracts/common.md#meaningful-documentation States the in-span premise and millimetre result.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic and at most one sine.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pure scalar inverse schedules no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export function station(parameter: AutoMovieConstructionOutlineParameter | undefined, x: number): number {
    if (parameter === undefined) return x;
    if (parameter.type === "root") return parameter.pole + (parameter.end === "bottom" ? 1 : -1) * x * x;
    const span: number = parameter.top - parameter.bottom;
    return x <= Math.PI / 2 ? parameter.bottom + span * Math.sin(x / 2) ** 2 : parameter.top - span * Math.sin((Math.PI - x) / 2) ** 2;
  }

  /**
   * First/second parameter derivatives in station, absent at a singular parameter endpoint.
   *
   * @evidence contracts/common.md#principled-implementation Differentiates signed root and two-end angle analytically; zero endpoint distance has no finite change-of-parameter jet.
   * @evidence contracts/common.md#clear-and-simple-design One pair feeds the scalar source chain rule, with null singularity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no finite difference and leaves overflowing arithmetic observable to the caller.
   * @evidence contracts/common.md#meaningful-documentation States derivative order, singular absence and admitted-domain premise.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic per requested jet.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure derivatives coordinate no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns at most a two-number pair and retains nothing.
   */
  export function jet(parameter: AutoMovieConstructionOutlineParameter | undefined, station: number): [number, number] | null {
    if (parameter === undefined) return [1, 0];
    if (parameter.type === "root") {
      const d: number = parameter.end === "bottom" ? station - parameter.pole : parameter.pole - station;
      return d === 0 ? null : [1 / (2 * Math.sqrt(d)), (parameter.end === "bottom" ? -1 : 1) / (4 * d ** 1.5)];
    }
    const a: number = station - parameter.bottom;
    const b: number = parameter.top - station;
    const p: number = a * b;
    return a === 0 || b === 0 ? null : [1 / Math.sqrt(p), (a - b) / (2 * p ** 1.5)];
  }
}
