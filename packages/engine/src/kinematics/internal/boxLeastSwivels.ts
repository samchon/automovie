import type {
  IAutoMovieAngleRange,
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { swivelArcs } from "../swivelArcs";
import { swivelJointReadings } from "../swivelJointReadings";

/**
 * The swivels at which each limit of a joint's three-angle box is least
 * violated, for a joint whose bone-local rotation is a fixed rotation turned
 * about a fixed axis by the swivel (the chain root of `hingedArmSwivel.pose`).
 *
 * Each clinical bound, in either chart the decomposition reads, is the sign of
 * a sinusoid of the swivel (`swivelJointReadings.bounds`; Tolani, Goswami and
 * Badler 2000, section 3.2.3: a joint limit maps to a sinusoid of the swivel
 * angle), positive past the bound and growing with the angle's distance past
 * it. Where no swivel is legal, every limit some swivel violates is least
 * violated at its sinusoid's least value, in closed form (`swivelArcs.least`),
 * so these swivels are where a search for the least overshoot starts. They are
 * candidates, not the answer: an outer angle's sinusoid is its vector's length
 * times the sine of its excess, and two limits violated together are least
 * where their sum is, which the caller's own score decides. A bound that no
 * swivel violates, or a constant one, gives no swivel. An abduction ceiling
 * that rises with flexion is read at the highest ceiling the coupling reaches
 * (`swivelJointReadings.interval`), and a swing cone at the swivel where the
 * joint's twist axis turns least from rest, the greatest `cos f · cos a`
 * (`swivelJointReadings.cone`).
 *
 * @param props The joint and its rotation by swivel; `joint` is not read.
 * @returns The swivels, degrees: the cone's and at most one a bound in each
 *   chart; null for an unconstrained joint or one gated by swing and twist,
 *   whose range the box does not read.
 */
export function boxLeastSwivels(
  props: IAutoMovieBoxExcludedSwivels.IProps,
): number[] | null {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (
    constraint === null ||
    (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
  )
    return null;
  const reading: IReading = swivelJointReadings.of(props.basis, props.rotation);
  const swivels: number[] = [];
  // The cone is least where the twist axis turns least from rest, the
  // greatest `cos f cos a`, the outer angle's vector `x`.
  const cone: swivelJointReadings.ICone | null = swivelJointReadings.cone(
    constraint,
    props.frame,
    reading,
  );
  if (cone !== null) {
    const least: number | null = swivelArcs.least(
      swivelArcs.scaled(cone.outer, -1),
    );
    if (least !== null) swivels.push(least);
  }
  for (const alternate of [false, true])
    for (const axis of swivelJointReadings.AXES) {
      const range: IAutoMovieAngleRange | null = swivelJointReadings.interval(
        constraint,
        axis,
      );
      if (range === null) continue;
      for (const bound of swivelJointReadings.bounds(
        reading[axis],
        swivelJointReadings.rig(range, props.frame?.[axis]),
        alternate,
      )) {
        if (!violated(bound)) continue;
        const least: number | null = swivelArcs.least(bound);
        if (least !== null) swivels.push(least);
      }
    }
  return swivels;
}

/** A joint's three angles as the swivel reads them (`swivelJointReadings.of`). */
type IReading = ReturnType<typeof swivelJointReadings.of>;

/**
 * Whether some swivel lies past the bound: the sinusoid's greatest value is
 * positive.
 */
function violated(bound: IAutoMovieSwivelArcs.ISinusoid): boolean {
  return bound.a + Math.hypot(bound.b, bound.c) > 0;
}
