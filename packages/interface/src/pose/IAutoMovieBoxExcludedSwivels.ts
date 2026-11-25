import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointConstraint } from "../skeleton/IAutoMovieJointConstraint";
import type { IAutoMovieJointRotationFrame } from "./IAutoMovieJointRotationFrame";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/**
 * The swivels a joint's three-angle box provably refuses: for a joint whose
 * bone-local rotation is a fixed rotation turned about a fixed axis by the
 * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
 * swivel from `low` to `high` degrees reads past the joint's box in both of the
 * charts `decomposeJointRotationOnBasis` chooses between, so that
 * `jointRomOvershoot` scores each of them above zero.
 */
export namespace IAutoMovieBoxExcludedSwivels {
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
   * past the upper end `β` of an interval no wider than a half turn where `y
   * cos β - x sin β` (the vector's length times `sin(δ - β)`) is positive, and
   * past the lower end `α` where `x sin α - y cos α` is. The alternate chart
   * (`alternateRigJointAngles`) turns each outer angle by a half turn, negating
   * its vector, and reflects the middle angle about its right angle. Where one
   * such sinusoid exceeds `MARGIN`, its exact roots bound an arc of swivels (`φ
   * ± acos((MARGIN - a) / R)`), and a reading is refused on the union of its
   * axes' arcs.
   *
   * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past the
   * bound by more than `MARGIN` radians, the joints' tolerance
   * (`ROM_TOLERANCE`, about 1.7e-4), far beyond the rounding of the fit, of the
   * arc's ends and of the decomposition itself (near 1e-15); and an outer
   * angle's vector is then longer than `MARGIN`, past the gimbal band
   * (`sqrt(ε)`, 1.5e-8) inside which the decomposition pins that angle instead.
   * A joint gated by swing and twist, which the box does not score, is read by
   * its range instead (`swingTwistExcludedSwivels`) when the frame the
   * overshoot reads it in is given, and refuses nothing otherwise; an axis
   * without an interval, an outer interval wider than a half turn (whose
   * refusal is an intersection, not a union, of two arcs) and a middle interval
   * met twice by the half turn the middle angle covers refuse nothing, so the
   * test only ever says less than the box would.
   */
  export type IProps = {
    /**
     * The joint's clinical basis, admitted and normalized
     * (`normalizeJointAxes`).
     */
    basis: IAutoMovieJointAxes;

    /**
     * The rest frame lifting the joint's rest-relative angles to clinical ones;
     * omitted, they are clinical.
     */
    frame?: IAutoMovieRestFrame | undefined;

    /**
     * The joint's resolved range of motion, as the decomposition's domain and
     * the overshoot read it; `null` refuses nothing.
     */
    constraint: IAutoMovieJointConstraint | null;

    /**
     * The frame a swing-twist gate is read in, as the overshoot reads it
     * (`scanJointRom`); omitted, a gated joint refuses nothing.
     */
    joint?: IAutoMovieJointRotationFrame | undefined;

    /**
     * The joint's bone-local rotation at a swivel, degrees: a fixed rotation
     * turned about a fixed axis by the swivel.
     *
     * Return the bone-local unit rotation for swivel degrees, following one
     * fixed-axis rotation of a fixed base pose. Sampling is synchronous; equal
     * angles must return equivalent rotations without mutating shared inputs.
     * The returned exclusion predicate retains sampled coefficients, not this
     * callback.
     */
    rotation: (swivel: number) => IAutoMovieQuaternion;
  };
}
