import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/**
 * Map a source driver's absolute coordinate through its ordered piecewise-linear
 * profile. No extrapolation, clinical capacity inference or caller mutation is
 * performed; the source author owns every knot's units and supported scope.
 *
 * @evidence contracts/common.md#principled-implementation One source profile owns the driver-to-joint conversion and refuses input outside its recorded coverage.
 * @evidence contracts/common.md#clear-and-simple-design Exact knots and their adjacent linear intervals use the same ordered source rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncovered inputs refuse instead of clamping or inventing a fallback curve.
 * @evidence contracts/common.md#meaningful-documentation Separates source support and units from physiological capacity.
 * @evidence contracts/modeling.md#parameter-channels Maps one named driver to one absolute source coordinate; neutral validation remains in graph admission.
 * @evidence contracts/modeling.md#spatial-conventions Explicit profiles permit source-owned degrees/metres conversion; the unprofiled path requires identical units.
 * @evidence contracts/anatomy.md#anatomical-source Preserves acquired or authored source knots and accounts without treating their values as a new clinical study.
 * @evidence contracts/anatomy.md#permitted-range Refuses outside the source profile domain; source/assembly owners still owe coupled physiological support.
 * @evidence contracts/anatomy.md#parametric-authority Reads named physiological motion coordinates and exposes no vertices or personal source curves.
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
