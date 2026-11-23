import type {
  IAutoMovieAngleRange,
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { abductionRange } from "../rom/abductionRange";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { swingTwistExcludedSwivels } from "./swingTwistExcludedSwivels";
import { swivelArcs } from "./swivelArcs";
import { swivelJointReadings } from "./swivelJointReadings";

/**
 * The swivels a joint's three-angle box provably refuses: for a joint whose
 * bone-local rotation is a fixed rotation turned about a fixed axis by the
 * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
 * swivel from `low` to `high` degrees reads past the joint's box in both of
 * the charts `decomposeJointRotationOnBasis` chooses between, so that
 * `jointRomOvershoot` scores each of them above zero.
 *
 * A rotation turned about a fixed axis by `ψ` has a matrix whose every entry
 * is `a + b cos ψ + c sin ψ` (Rodrigues' formula between two fixed
 * rotations), so every entry the decomposition reads is such a sinusoid,
 * fitted exactly from the rotation at 0, 90 and 180 degrees. Each clinical
 * bound is then a sinusoid's sign. The middle angle of the composition
 * (`atan2(s, cos)` with a non-negative cosine, so `asin(s)`) lies past a
 * bound `q` where `s - sin q` is positive; an outer angle `atan2(y, x)` lies
 * past the upper end `β` of an interval no wider than a half turn where
 * `y cos β - x sin β` (the vector's length times `sin(δ - β)`) is positive,
 * and past the lower end `α` where `x sin α - y cos α` is. The alternate
 * chart (`alternateRigJointAngles`) turns each outer angle by a half turn,
 * negating its vector, and reflects the middle angle about its right angle.
 * Where one such sinusoid exceeds `MARGIN`, its exact roots bound an arc of
 * swivels (`φ ± acos((MARGIN - a) / R)`), and a reading is refused on the
 * union of its axes' arcs. An abduction ceiling that rises with flexion
 * (`abductionRange`) couples two axes, so its abduction is refused only past
 * the highest ceiling the coupling reaches, which bounds it at every flexion.
 *
 * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past
 * the bound by more than `MARGIN` radians, the joints' tolerance
 * (`ROM_TOLERANCE`, about 1.7e-4), far beyond the rounding of the fit, of
 * the arc's ends and of the decomposition itself (near 1e-15); and an outer
 * angle's vector is then longer than `MARGIN`, past the gimbal band
 * (`sqrt(ε)`, 1.5e-8) inside which the decomposition pins that angle
 * instead. A joint gated by swing and twist, which the box does not score,
 * is read by its range instead (`swingTwistExcludedSwivels`) when the frame
 * the overshoot reads it in is given, and refuses nothing otherwise; an
 * axis without an interval, an outer interval wider than a half turn
 * (whose refusal is an intersection, not a union, of two arcs) and a middle
 * interval met twice by the half turn the middle angle covers refuse
 * nothing, so the test only ever says less than the box would.
 *
 * @param props The joint and its rotation by swivel.
 * @returns Whether every swivel in `[low, high]`, degrees, is refused; a joint with nothing to refuse refuses no swivel.
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
        const range: IAutoMovieAngleRange | null =
          axis === "abduction" ? highestAbduction(constraint) : constraint[axis];
        if (range === null) continue;
        const read: IRead = reading[axis];
        for (const bound of bounds(
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
  return (low: number, high: number): boolean =>
    charts.every((chart: IAutoMovieSwivelArcs.IArc[] | "all"): boolean =>
      swivelArcs.covers(chart, low, high),
    );
}

/**
 * How far past a bound, in sine or projected units, a reading must lie to be
 * refused: the joints' tolerance (`ROM_TOLERANCE`) in radians, past the
 * rounding of every step and the decomposition's gimbal band.
 */
const MARGIN: number = (ROM_TOLERANCE * Math.PI) / 180;

/**
 * A joint's abduction interval at its highest ceiling: the ceiling a flexed
 * abduction coupling reaches at its own flexion (`abductionRange`), which no
 * flexion exceeds since the coupled ceiling is at least the neutral one
 * (`validateJointConstraint`); the joint's own interval without a coupling.
 */
function highestAbduction(
  constraint: IAutoMovieJointConstraint,
): IAutoMovieAngleRange | null {
  return abductionRange(constraint, constraint.abductionFlexed?.flexion ?? null);
}

/** The three clinical axes (`swivelJointReadings.AXES`). */
const AXES: readonly Axis[] = swivelJointReadings.AXES;

/** A clinical axis. */
type Axis = swivelJointReadings.Axis;

/** How an axis is read (`swivelJointReadings.IRead`). */
type IRead = swivelJointReadings.IRead;

/** A clinical interval as rest-relative degrees (`swivelJointReadings.rig`). */
const rig: typeof swivelJointReadings.rig = swivelJointReadings.rig;

/**
 * The sinusoids positive where one chart's reading of an axis lies past its
 * rest-relative interval `[lo, hi]`, any full-turn alias of the angle
 * considered (`nearestAngleAlias`); none where the analysis cannot refuse.
 */
function bounds(
  read: IRead,
  [lo, hi]: [number, number],
  alternate: boolean,
): IAutoMovieSwivelArcs.ISinusoid[] {
  if (hi - lo >= 360) return [];
  if ("sine" in read) {
    // The middle angle is asin(s), or in the alternate chart 180 - asin(s),
    // which lies in [lo, hi] exactly where asin(s) lies in [180 - hi, 180 - lo].
    const [from, to] = alternate ? [180 - hi, 180 - lo] : [lo, hi];
    const first: number = Math.ceil((-90 - to) / 360);
    const last: number = Math.floor((90 - from) / 360);
    if (last < first) return [{ a: 1, b: 0, c: 0 }];
    if (last > first) return [];
    const p: number = Math.max(from + 360 * first, -90);
    const q: number = Math.min(to + 360 * first, 90);
    const out: IAutoMovieSwivelArcs.ISinusoid[] = [];
    if (q < 90)
      out.push({
        ...read.sine,
        a: read.sine.a - Math.sin(q * Quaternion.DEG2RAD),
      });
    if (p > -90)
      out.push(
        swivelArcs.scaled(
          { ...read.sine, a: read.sine.a - Math.sin(p * Quaternion.DEG2RAD) },
          -1,
        ),
      );
    return out;
  }
  // An outer angle δ = atan2(y, x) reads `turn · δ`, or a half turn more in
  // the alternate chart, where the vector is negated.
  if (hi - lo > 180) return [];
  const ends: number[] = [lo * read.turn, hi * read.turn];
  const alpha: number = Math.min(...ends) * Quaternion.DEG2RAD;
  const beta: number = Math.max(...ends) * Quaternion.DEG2RAD;
  const sign: number = alternate ? -1 : 1;
  return [
    swivelArcs.scaled(
      swivelArcs.combined(read.y, Math.cos(beta), read.x, -Math.sin(beta)),
      sign,
    ),
    swivelArcs.scaled(
      swivelArcs.combined(read.x, Math.sin(alpha), read.y, -Math.cos(alpha)),
      sign,
    ),
  ];
}
