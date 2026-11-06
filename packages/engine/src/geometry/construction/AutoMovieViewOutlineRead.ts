import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieViewHermite } from "./AutoMovieViewHermite";
import type { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Value and qualified scalar jets of an already admitted original outline.
 *
 * @evidence contracts/common.md#principled-implementation Reads the original natural/requested quintic polynomial under its declared parameter and exact pole rule; physical derivatives use the existing chain rule.
 * @evidence contracts/common.md#clear-and-simple-design ViewOutline retains admission and its public API; this reader owns value/jet work and the common parameter-value helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No new source, value clamp, implicit physical derivative, exception conversion or source cache is added.
 * @evidence contracts/common.md#meaningful-documentation Each capability states units, pole/extension status and finite-output requirements.
 * @evidence contracts/performance.md#efficient-algorithms Scalar and combined-natural queries use O(log N) lookup; requested quintic value and derivatives retain their separate O(log N) lookups.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared source coefficients are reused; ordinary natural value/parameter jets share one selected interval.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fresh fixed-size readings escape; no source or query is retained.
 */
export namespace AutoMovieViewOutlineRead {
  /**
   * Scalar value without derivative work or a qualified-reading allocation.
   *
   * @evidence contracts/common.md#principled-implementation The same original parameter map, exact input pole zero and natural/quintic value owner serve the public Outline.value API.
   * @evidence contracts/common.md#clear-and-simple-design One private value helper is shared with qualified reading without a second source preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside-parameter and nonfinite-value failures preserve their original text; input getter exceptions propagate unchanged.
   * @evidence contracts/common.md#meaningful-documentation Station uses source length units and the scalar keeps its authored value units; open ends retain parameter-tangent extension.
   * @evidence contracts/performance.md#efficient-algorithms One O(log N) value lookup and constant parameter conversion; exact poles read their zero input directly.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the admitted source and shared parameter-value helper, retaining no previous station.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a scalar or failure string without retaining inputs.
   */
  export function value(
    outline: AutoMovieViewOutline.IOutline,
    station: number,
  ): number | string {
    const x: number = AutoMovieViewParameter.at(outline.parameter, station);
    if (!Number.isFinite(x))
      return `station ${station} is not finite inside the source parameter domain`;
    const y: number = valueAt(outline, station, x);
    return Number.isFinite(y)
      ? y
      : `station ${station} has a nonfinite source value`;
  }

  /**
   * Original value, parameter jets and explicitly available physical station jets.
   *
   * @evidence contracts/common.md#principled-implementation Analytic scalar derivatives and first/second parameter chain rules produce the same qualified source reading; exact pole station jets remain absent.
   * @evidence contracts/common.md#clear-and-simple-design Natural non-pole value/derivatives share one lookup, while a pole and requested quintic retain their existing specialized rules.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A finite near-pole value survives unavailable/nonfinite station2; missing derivatives are not filled and getter exceptions are not intercepted.
   * @evidence contracts/common.md#meaningful-documentation Retains parameter versus station derivative units, pole/parameter-endpoint/extension locations and explicit availability statuses.
   * @evidence contracts/performance.md#efficient-algorithms One combined natural or two requested-quintic O(log N) lookups precede fixed chain-rule and finite checks; exact poles read only parameter derivatives.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the prepared polynomial and selected natural interval, with no mutable cursor or cached output.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned fixed-size record/tuples are fresh and caller-owned; nothing persists between calls.
   */
  export function at(
    outline: AutoMovieViewOutline.IOutline,
    station: number,
  ): AutoMovieViewOutline.IReading | string {
    const { bottom, top }: AutoMovieViewOutline.IEnds = outline.ends;
    const x: number = AutoMovieViewParameter.at(outline.parameter, station);
    if (!Number.isFinite(x))
      return `station ${station} is not finite inside the source parameter domain`;
    const pole: boolean = station === bottom || station === top;
    const natural: [number, number, number] | null =
      !pole && outline.hermite === undefined
        ? AutoMovieNaturalSpline.read(outline.spline, x)
        : null;
    const value: number =
      natural === null ? valueAt(outline, station, x) : natural[0];
    const jet: [number, number] =
      natural !== null
        ? [natural[1], natural[2]]
        : outline.hermite === undefined
          ? AutoMovieNaturalSpline.derivative(outline.spline, x)
          : AutoMovieViewHermite.derivative(outline.hermite, x);
    if (!Number.isFinite(value) || !jet.every(Number.isFinite))
      return `station ${station} has a nonfinite source value or parameter jet`;
    const change: [number, number] | null = AutoMovieViewParameter.jet(
      outline.parameter,
      station,
    );
    let stationJet: [number, number] | null = null;
    let stationJetStatus: AutoMovieViewOutline.IReading["stationJetStatus"] =
      pole ? "singular-pole" : "singular-parameter";
    if (change !== null && !pole) {
      stationJet = [
        jet[0] * change[0],
        jet[1] * change[0] * change[0] + jet[0] * change[1],
      ];
      stationJetStatus = stationJet.every(Number.isFinite)
        ? "regular"
        : "nonfinite";
      if (stationJetStatus === "nonfinite") stationJet = null;
    }
    const [lo, hi]: readonly [number, number] = outline.domain;
    return {
      station,
      parameter: x,
      value,
      parameterJet: jet,
      stationJet,
      stationJetStatus,
      location: pole
        ? "pole"
        : change === null
          ? "parameter-endpoint"
          : station < lo || station > hi
            ? "extension"
            : station === lo || station === hi
              ? "endpoint"
              : "interior",
    };
  }

  /** Preserve exact pole zeros and the admitted parameter's original polynomial value. */
  function valueAt(
    outline: AutoMovieViewOutline.IOutline,
    station: number,
    x: number,
  ): number {
    return station === outline.ends.bottom || station === outline.ends.top
      ? 0
      : outline.hermite === undefined
        ? AutoMovieNaturalSpline.evaluate(outline.spline, x)
        : AutoMovieViewHermite.value(outline.hermite, x);
  }
}
