import {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { swingTwistExcludedSwivels } from "./swingTwistExcludedSwivels";
import type { swingTwistRange } from "./swingTwistRange";
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
 * union of its axes' arcs.
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise on the rotation, why each entry is a sinusoid, each bound's sinusoid for both charts, the margin and why every refusal is certain, and every case that refuses nothing.
 * @evidence contracts/development/implementation.md#principled-implementation Rodrigues' formula makes each entry an exact sinusoid in the swivel, so each bound's crossing swivels are a sinusoid's two arccos roots, and an angle's interval maps through the rest frame and the chart exactly as `decomposeJointRotationOnBasis` and `alternateRigJointAngles` read it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The entries are fitted once, each reading's axes give their bound sinusoids, the sinusoids their arcs, the arcs one merged list per reading, and the test reads the lists.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sound by construction, never by sampling: an arc is refused only from its sinusoid's roots with the joints' tolerance to spare, and a case the analysis does not cover refuses nothing rather than guessing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three rotations and nine dot products each fit the entries, a few arcs per reading are merged once, and each test is a scan of a handful of merged arcs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit, the arcs, their union and its test are `swivelArcs`'s, shared with a point's bounds; the arcs are built once per rotation and read by every test of its sweep.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the two merged arc lists in the returned test only.
 */
export function boxExcludedSwivels(props: {
  /** The joint's clinical basis, admitted and normalized (`normalizeJointAxes`). */
  basis: IAutoMovieJointAxes;

  /** The rest frame lifting the joint's rest-relative angles to clinical ones; omitted, they are clinical. */
  frame?: IAutoMovieRestFrame | undefined;

  /** The joint's resolved range of motion, as the decomposition's domain and the overshoot read it; `null` refuses nothing. */
  constraint: IAutoMovieJointConstraint | null;

  /** The frame a swing-twist gate is read in, as the overshoot reads it (`scanJointRom`); omitted, a gated joint refuses nothing. */
  joint?: swingTwistRange.IJoint | undefined;

  /** The joint's bone-local rotation at a swivel, degrees: a fixed rotation turned about a fixed axis by the swivel. */
  rotation: (swivel: number) => IAutoMovieQuaternion;
}): (low: number, high: number) => boolean {
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
  const charts: (swivelArcs.IArc[] | "all")[] = [false, true].map(
    (alternate: boolean): swivelArcs.IArc[] | "all" => {
      const arcs: swivelArcs.IArc[] = [];
      for (const axis of AXES) {
        const range: IAutoMovieAngleRange | null = constraint[axis];
        if (range === null) continue;
        const read: IRead = reading[axis];
        for (const bound of bounds(
          read,
          rig(range, props.frame?.[axis]),
          alternate,
        )) {
          const arc: swivelArcs.IArc | "all" | null = swivelArcs.above(
            bound,
            MARGIN,
          );
          if (arc === "all") return "all";
          if (arc !== null) arcs.push(arc);
        }
      }
      return swivelArcs.union(arcs);
    },
  );
  return (low: number, high: number): boolean =>
    charts.every((chart: swivelArcs.IArc[] | "all"): boolean =>
      swivelArcs.covers(chart, low, high),
    );
}

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

/**
 * The sinusoids positive where one chart's reading of an axis lies past its
 * rest-relative interval `[lo, hi]`, any full-turn alias of the angle
 * considered (`nearestAngleAlias`); none where the analysis cannot refuse.
 */
function bounds(
  read: IRead,
  [lo, hi]: [number, number],
  alternate: boolean,
): swivelArcs.ISinusoid[] {
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
    const out: swivelArcs.ISinusoid[] = [];
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
