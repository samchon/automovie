import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/**
 * Map a source driver's absolute coordinate through its ordered piecewise-linear
 * profile. No extrapolation, clinical capacity inference or caller mutation is
 * performed; the source author owns every knot's units and supported scope.
 *
 * @author Samchon
 */
export function readHumanBodySourceProfile(
  axis: IAutoMovieHumanBodySourceJointAxis,
  value: number,
): number {
  const knots = axis.profile;
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
  const exact = knots.find((knot) => knot.input === value);
  if (exact !== undefined) return exact.output;
  for (let at = 1; at < knots.length; at++)
    if (value < knots[at].input) {
      const from = knots[at - 1],
        to = knots[at];
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
