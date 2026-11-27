import type {
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { boxRefusedArcs } from "./boxRefusedArcs";
import { swingTwistExcludedSwivels } from "./swingTwistExcludedSwivels";
import { AutoMovieEngineSwivelArcs } from "../AutoMovieEngineSwivelArcs";

/*
 * The swivels a joint's three-angle box provably refuses: for a joint whose
 * bone-local rotation is a fixed rotation turned about a fixed axis by the
 * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
 * swivel from `low` to `high` degrees reads past the joint's box in both of the
 * charts `decomposeJointRotationOnBasis` chooses between, so that
 * `jointRomOvershoot` scores each of them above zero.
 *
 * A rotation turned about a fixed axis by `ψ` has a matrix whose every entry is
 * `a + b cos ψ + c sin ψ` (Rodrigues' formula between two fixed rotations), so
 * every entry the decomposition reads is such a sinusoid, fitted exactly from
 * the rotation at 0, 90 and 180 degrees. Each clinical bound is then a
 * sinusoid's sign, in either chart the decomposition reads
 * (`swivelJointReadings.bounds`). Where one such sinusoid exceeds `MARGIN`, its
 * exact roots bound an arc of swivels (`φ ± acos((MARGIN - a) / R)`), and a
 * reading is refused on the union of its axes' arcs. An abduction ceiling that
 * rises with flexion (`abductionRange`) couples two axes, so its abduction is
 * refused only past the highest ceiling the coupling reaches, which bounds it
 * at every flexion (`swivelJointReadings.interval`). A swing cone (`swingDeg`)
 * couples flexion and abduction too, so no arc of one sinusoid bounds it: each
 * one-degree piece of the turn the axes leave is refused in a chart where the
 * cone's closed-form bound over the piece certainly exceeds it by `MARGIN`
 * (`swivelJointReadings.coneExceeded`). The arcs are `boxRefusedArcs`'s.
 *
 * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past the
 * bound by more than `MARGIN` radians, the joints' tolerance (`AutoMovieEngineRomTolerance`,
 * about 1.7e-4), far beyond the rounding of the fit, of the arc's ends and of
 * the decomposition itself (near 1e-15); and an outer angle's vector is then
 * longer than `MARGIN`, past the gimbal band (`sqrt(ε)`, 1.5e-8) inside which
 * the decomposition pins that angle instead. A joint gated by swing and twist,
 * which the box does not score, is read by its range instead
 * (`swingTwistExcludedSwivels`) when the frame the overshoot reads it in is
 * given, and refuses nothing otherwise; an axis without an interval, an outer
 * interval wider than a half turn (whose refusal is an intersection, not a
 * union, of two arcs) and a middle interval met twice by the half turn the
 * middle angle covers refuse nothing, so the test only ever says less than the
 * box would.
 * Parameter props: The joint and its rotation by swivel.
 * Returns: Whether every swivel in `[low, high]`, degrees, is refused; a joint
 * with nothing to refuse refuses no swivel.
 */
export function boxExcludedSwivels(
  props: IAutoMovieBoxExcludedSwivels.IProps,
): (low: number, high: number) => boolean {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (constraint === null) return (): boolean => false;
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
    return props.joint === undefined
      ? (): boolean => false
      : swingTwistExcludedSwivels({
          basis: props.basis,
          frame: props.frame,
          constraint,
          joint: props.joint,
          rotation: props.rotation,
        });

  // Each chart's refused arcs (`boxRefusedArcs`), built once and read by
  // every test of the sweep: a swivel is refused where both charts refuse it.
  const [principal, alternate]: [
    IAutoMovieSwivelArcs.IArc[] | "all",
    IAutoMovieSwivelArcs.IArc[] | "all",
  ] = boxRefusedArcs(props);
  return (low: number, high: number): boolean =>
    AutoMovieEngineSwivelArcs.covers(principal, low, high) &&
    AutoMovieEngineSwivelArcs.covers(alternate, low, high);
}
