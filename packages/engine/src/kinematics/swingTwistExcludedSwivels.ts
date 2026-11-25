import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { swingTwistRefusedArcs } from "./swingTwistRefusedArcs";
import { swivelArcs } from "./swivelArcs";

/**
 * The swivels a joint's swing-twist range provably refuses: for a joint whose
 * bone-local rotation is a fixed rotation turned about a fixed axis by the
 * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
 * swivel from `low` to `high` degrees reads past the range, so that
 * `jointRomOvershoot` scores each of them above zero. It is the swing-twist
 * counterpart of `boxExcludedSwivels`, which refuses nothing for such a joint.
 *
 * The range reads the rotation `q` by its twist about the rest direction `u`
 * and its swing (`swingTwistRange.read`). Such a rotation's quaternion is `A
 * cos(ψ/2) + B sin(ψ/2)` up to its sign, so its scalar part `w` and its vector
 * part along `u`, `s`, are each a first harmonic of the half swivel. The twist
 * is `2 atan2(s, w)`, legal on the rig interval `[lo, hi]` the clinical one
 * maps to (`toRigAngle`) and its full-turn aliases, so the half twist `φ` is
 * legal on `[lo/2, hi/2]` and its half-turn aliases. For an interval narrower
 * than a full turn, `sin(φ - hi/2) sin(φ - lo/2)` is positive exactly where `φ`
 * lies outside, and times `s² + w²` it is `(s cos(hi/2) - w sin(hi/2)) (s
 * cos(lo/2) - w sin(lo/2))`: a product of two first harmonics of the half
 * swivel, so a sinusoid of the swivel, the same for either sign of the
 * quaternion. The swing is `acos(u · q u)`, and `u · q u` is a sinusoid of the
 * swivel (Rodrigues' formula); every swing past the region's greatest radius on
 * any great circle is refused, where `cos` of that radius less the sinusoid is
 * positive. Each sinusoid is fitted exactly from the rotation at 0, 90 and 180
 * degrees, and each refuses the arc where it exceeds `MARGIN` (`swivelArcs`).
 *
 * Every refusal is certain. The twist's product above `MARGIN` puts both sines
 * above it, so the half twist lies past its interval by more than `MARGIN`
 * radians, the twist by twice that; the swing's cosine short of the greatest
 * radius's by more than `MARGIN` puts the swing past it by more than `MARGIN`
 * radians. `MARGIN` is the joints' tolerance (`ROM_TOLERANCE`) in radians, far
 * beyond the rounding of the fit and the arcs' ends. The range reads the
 * rotation the caller's angles compose in its own frame (`scanJointRom`), which
 * is the swivel's rotation only when the caller decomposes it on that same
 * basis and rest frame; any other basis or frame, a constraint without a
 * swing-twist gate, a twist interval of a full turn or more and a greatest
 * radius of a half turn refuse nothing, so the test only ever says less than
 * the range would.
 *
 * @param props The joint and its rotation by swivel.
 * @returns Whether every swivel in `[low, high]`, degrees, is refused; a joint
 *   with nothing to refuse refuses no swivel.
 */
export function swingTwistExcludedSwivels(props: {
  /**
   * The basis the caller decomposes the rotation on, admitted and normalized
   * (`normalizeJointAxes`).
   */
  basis: IAutoMovieJointAxes;

  /** The rest frame the caller lifts its angles by; omitted, they are clinical. */
  frame?: IAutoMovieRestFrame | undefined;

  /**
   * The joint's resolved range of motion; one without a swing-twist gate
   * refuses nothing.
   */
  constraint: IAutoMovieJointConstraint | null;

  /**
   * The frame the range reads the joint in (`scanJointRom`'s: the caller's
   * rig's, or `swingTwistRange.of`'s).
   */
  joint: IAutoMovieJointRotationFrame;

  /**
   * The joint's bone-local rotation at a swivel, degrees: a fixed rotation
   * turned about a fixed axis by the swivel.
   */
  rotation: (swivel: number) => IAutoMovieQuaternion;
}): (low: number, high: number) => boolean {
  // The refused arcs in closed form (`swingTwistRefusedArcs`), read by every
  // test of the sweep.
  const merged: IAutoMovieSwivelArcs.IArc[] | "all" =
    swingTwistRefusedArcs(props);
  return (low: number, high: number): boolean =>
    swivelArcs.covers(merged, low, high);
}
