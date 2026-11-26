import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { swivelArcs } from "../swivelArcs";
import { swivelJointReadings } from "../swivelJointReadings";

/**
 * The swivels at which a joint with one immobile axis can take the rotation
 * asked of it, in closed form.
 *
 * A joint whose range leaves one clinical axis immobile (an ankle's axial
 * twist) has two degrees of freedom, so of a requested three-degree rotation
 * the chain's swivel must supply the third: the joint takes the rotation
 * exactly only where the rotation demanded of it reads that axis at its
 * neutral. For a demanded rotation that is a fixed rotation turned about a
 * fixed axis by the swivel, the reading is a sinusoid's root
 * (`swivelJointReadings`): the middle angle `asin(s)` is neutral where `s - sin
 * n` vanishes, and an outer angle `atan2(y, x)` is neutral, in the principal
 * chart or the alternate one a half turn on, where `y cos n - x sin n`
 * vanishes. There are at most two such swivels (`swivelArcs.roots`), Tolani,
 * Goswami and Badler's analytic treatment of a joint limit as a function of the
 * swivel (2000, Graphical Models 62).
 *
 * The roots are candidates, not certificates: the joint's two free axes may
 * still lie outside their intervals there, and a reading inside the
 * decomposition's gimbal band is pinned instead, so the caller scores each and
 * keeps a candidate only when its own measure finds the rotation met.
 *
 * @param props The joint and the rotation demanded of it by swivel.
 * @returns The candidate swivels, degrees in [0, 360), none when the axis never
 *   reads neutral; null when the joint has no range, a swing-twist gate, or not
 *   exactly one immobile axis, so this analysis does not apply.
 */
export function immobileAxisSwivels(props: {
  /** The joint's clinical basis, admitted and normalized (`normalizeJointAxes`). */
  basis: IAutoMovieJointAxes;

  /**
   * The rest frame lifting the joint's rest-relative angles to clinical ones;
   * omitted, they are clinical.
   */
  frame?: IAutoMovieRestFrame | undefined;

  /**
   * The joint's resolved range of motion; an axis with a `null` interval is
   * immobile at its clinical zero.
   */
  constraint: IAutoMovieJointConstraint | null;

  /**
   * The bone-local rotation demanded of the joint at a swivel, degrees: a fixed
   * rotation turned about a fixed axis by the swivel.
   */
  rotation: (swivel: number) => IAutoMovieQuaternion;
}): number[] | null {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (constraint === null) return null;
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
    return null;
  const immobile: swivelJointReadings.Axis[] = swivelJointReadings.AXES.filter(
    (axis: swivelJointReadings.Axis): boolean => constraint[axis] === null,
  );
  if (immobile.length !== 1) return null;
  const axis: swivelJointReadings.Axis = immobile[0]!;
  const read: swivelJointReadings.IRead = swivelJointReadings.of(
    props.basis,
    props.rotation,
  )[axis];

  // The axis's clinical zero as the rest-relative angle the entries read.
  const neutral: number =
    swivelJointReadings.rig({ min: 0, max: 0 }, props.frame?.[axis])[0] *
    Quaternion.DEG2RAD;
  const zero: IAutoMovieSwivelArcs.ISinusoid =
    "sine" in read
      ? { ...read.sine, a: read.sine.a - Math.sin(neutral) }
      : swivelArcs.combined(
          read.y,
          Math.cos(neutral * read.turn),
          read.x,
          -Math.sin(neutral * read.turn),
        );
  return swivelArcs.roots(zero);
}
