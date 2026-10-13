import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceMotionKnot } from "./IAutoMovieHumanBodySourceMotionKnot";

/**
 * Map a source driver's absolute coordinate through its ordered piecewise-linear profile. No extrapolation, clinical capacity inference or caller mutation is performed; the source author owns every knot's units and supported scope.
 *
 * The source graph admission must establish finite, strictly increasing profile inputs and supported output values before interpolation. An exact input returns its recorded output. Empty profiles, out-of-coverage coordinates, missing unit conversions or an absent bracket throw; neither the axis nor its knots are changed.
 *
 * @evidence contracts/common.md#principled-implementation Ordered source knots define piecewise-linear interpolation, with exact-knot output preserved and extrapolation refused; absent profiles require matching driver and joint units.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns both runtime coordinate mapping and the admission check that driver neutral reaches source neutral.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no inferred clinical range or extrapolated continuation; source authors remain responsible for knot units and supported scope.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies ordered profiles, refusal of extrapolation and unchanged inputs; expanded prose records admission's finite/order premise and error effects.
 * @evidence contracts/performance.md#efficient-algorithms An exact-knot search followed by a bracketing scan costs O(K) for K knots with constant auxiliary storage; supported small source profiles are scanned without a retained search index.
 * @evidence contracts/performance.md#reuse-equivalent-work Admission and runtime share this conversion function rather than duplicating interpolation; no scalar result is reused across changed axis profiles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Knot arrays remain caller-owned and only two bracketing references are live during interpolation; no source profile cache is retained.
 */
export function readHumanBodySourceProfile(
  axis: IAutoMovieHumanBodySourceJointAxis,
  value: number,
): number {
  const knots: readonly IAutoMovieHumanBodySourceMotionKnot[] | undefined = axis.profile;
  if (knots === undefined) {
    if (axis.driver.unit !== (axis.kind === "rotation" ? "degrees" : "metres"))
      throw new Error(
        "Source joint needs an explicit unit conversion profile: " + axis.id,
      );
    return value;
  }
  if (
    knots.length === 0 ||
    value < knots[0].input ||
    value > knots[knots.length - 1].input
  )
    throw new Error(
      "Source joint driver exceeds its recorded profile: " + axis.id,
    );
  const exact: IAutoMovieHumanBodySourceMotionKnot | undefined = knots.find((knot: IAutoMovieHumanBodySourceMotionKnot): boolean => knot.input === value);
  if (exact !== undefined) return exact.output;
  for (let at: number = 1; at < knots.length; at++)
    if (value < knots[at].input) {
      const from: IAutoMovieHumanBodySourceMotionKnot = knots[at - 1];
      const to: IAutoMovieHumanBodySourceMotionKnot = knots[at];
      return (
        from.output +
        ((to.output - from.output) * (value - from.input)) /
          (to.input - from.input)
      );
    }
  throw new Error(
    "Source joint profile has no bracketing coordinates: " + axis.id,
  );
}
