import type {
  IAutoMovieAngleRange,
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { swingTwistExcludedSwivels } from "./swingTwistExcludedSwivels";
import { swivelArcs } from "./swivelArcs";
import { swivelJointReadings } from "./swivelJointReadings";

/**
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
 * piece of at most `PIECE` degrees the axes leave is refused in a chart where
 * the cone's closed-form bound over the piece certainly exceeds it by `MARGIN`
 * (`swivelJointReadings.coneExceeded`).
 *
 * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past the
 * bound by more than `MARGIN` radians, the joints' tolerance (`ROM_TOLERANCE`,
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
 *
 * @param props The joint and its rotation by swivel.
 * @returns Whether every swivel in `[low, high]`, degrees, is refused; a joint
 *   with nothing to refuse refuses no swivel.
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
  const reading: Record<Axis, IRead> = swivelJointReadings.of(
    props.basis,
    props.rotation,
  );

  // Each chart's refused swivels: the union of its axes' arcs.
  const charts: (IAutoMovieSwivelArcs.IArc[] | "all")[] = [false, true].map(
    (alternate: boolean): IAutoMovieSwivelArcs.IArc[] | "all" => {
      const arcs: IAutoMovieSwivelArcs.IArc[] = [];
      for (const axis of AXES) {
        const range: IAutoMovieAngleRange | null = swivelJointReadings.interval(
          constraint,
          axis,
        );
        if (range === null) continue;
        const read: IRead = reading[axis];
        for (const bound of swivelJointReadings.bounds(
          read,
          rig(range, props.frame?.[axis]),
          alternate,
        )) {
          const arc: IAutoMovieSwivelArcs.IArc | "all" | null =
            swivelArcs.above(bound, MARGIN);
          if (arc === "all") return "all";
          if (arc !== null) arcs.push(arc);
        }
      }
      return swivelArcs.union(arcs);
    },
  );

  // A swing cone couples flexion and abduction, so it refuses no arc of one
  // sinusoid: each piece of at most `PIECE` degrees the axes' arcs leave is
  // refused where the cone is certainly exceeded over it
  // (`swivelJointReadings.coneExceeded`).
  const cone: swivelJointReadings.ICone | null = swivelJointReadings.cone(
    constraint,
    props.frame,
    reading,
  );
  const refused = (
    chart: IAutoMovieSwivelArcs.IArc[] | "all",
    alternate: boolean,
    low: number,
    high: number,
  ): boolean => {
    if (swivelArcs.covers(chart, low, high)) return true;
    if (cone === null) return false;
    const pieces: number = Math.max(1, Math.ceil((high - low) / PIECE));
    for (let k: number = 0; k < pieces; ++k) {
      const from: number = low + ((high - low) * k) / pieces;
      const to: number = low + ((high - low) * (k + 1)) / pieces;
      if (
        !swivelArcs.covers(chart, from, to) &&
        !swivelJointReadings.coneExceeded(cone, from, to, alternate, MARGIN)
      )
        return false;
    }
    return true;
  };
  return (low: number, high: number): boolean =>
    refused(charts[0]!, false, low, high) &&
    refused(charts[1]!, true, low, high);
}

/**
 * The widest piece of swivels, degrees, a cone's refusal is read over: the
 * sweep's step (`hingedArmSwivel.STEP`), over which the sinusoids' ranges stay
 * tight.
 */
const PIECE: number = 1;

/**
 * How far past a bound, in sine or projected units, a reading must lie to be
 * refused: the joints' tolerance (`ROM_TOLERANCE`) in radians, past the
 * rounding of every step and the decomposition's gimbal band.
 */
const MARGIN: number = (ROM_TOLERANCE * Math.PI) / 180;

/** The three clinical axes (`swivelJointReadings.AXES`). */
const AXES: readonly Axis[] = swivelJointReadings.AXES;

/** A clinical axis. */
type Axis = swivelJointReadings.Axis;

/** How an axis is read (`swivelJointReadings.IRead`). */
type IRead = swivelJointReadings.IRead;

/** A clinical interval as rest-relative degrees (`swivelJointReadings.rig`). */
const rig: typeof swivelJointReadings.rig = swivelJointReadings.rig;
