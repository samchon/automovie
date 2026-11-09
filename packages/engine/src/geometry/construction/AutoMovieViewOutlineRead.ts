import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieViewHermite } from "./AutoMovieViewHermite";
import type { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Value and qualified scalar jets of an already admitted original outline.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each capability states units, pole/extension status and finite-output requirements.
 * @evidence contracts/development/design.md#principled-representation Represents Value and qualified scalar jets of an already admitted original outline: companion namespace of 3 members (`value`, `at`, `valueAt`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewOutlineRead` in packages/engine/src/geometry/construction/AutoMovieViewOutlineRead.ts; its surface is the 3 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewOutlineRead {
  /**
   * Scalar value without derivative work or a qualified-reading allocation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same original parameter map, exact input pole zero and natural/quintic value owner serve the public Outline.value API.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private value helper is shared with qualified reading without a second source preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside-parameter and nonfinite-value failures preserve their original text; input getter exceptions propagate unchanged.
   * @evidence contracts/development/common.md#meaningful-documentation Station uses source length units and the scalar keeps its authored value units; open ends retain parameter-tangent extension.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(log N) value lookup and constant parameter conversion; exact poles read their zero input directly.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the admitted source and shared parameter-value helper, retaining no previous station.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar or failure string without retaining inputs.
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
   * @evidence contracts/development/implementation.md#principled-implementation Analytic scalar derivatives and first/second parameter chain rules produce the same qualified source reading; exact pole station jets remain absent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Natural non-pole value/derivatives share one lookup, while a pole retains its existing specialized rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A finite near-pole value survives unavailable/nonfinite station2; missing derivatives are not filled and getter exceptions are not intercepted.
   * @evidence contracts/development/common.md#meaningful-documentation Retains parameter versus station derivative units, pole/parameter-endpoint/extension locations and explicit availability statuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms One combined natural or requested-quintic O(log N) lookup precede fixed chain-rule and finite checks; exact poles read only parameter derivatives.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the prepared polynomial and selected original interval, with no mutable cursor or cached output.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned fixed-size record/tuples are fresh and caller-owned; nothing persists between calls.
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
    const polynomial: [number, number, number] | null = pole
      ? null
      : outline.hermite === undefined
        ? AutoMovieNaturalSpline.read(outline.spline, x)
        : AutoMovieViewHermite.read(outline.hermite, x);
    const value: number =
      polynomial === null ? valueAt(outline, station, x) : polynomial[0];
    const jet: [number, number] =
      polynomial !== null
        ? [polynomial[1], polynomial[2]]
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
