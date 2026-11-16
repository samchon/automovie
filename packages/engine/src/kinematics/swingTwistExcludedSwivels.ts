import {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { toRigAngle } from "../rom/toRigAngle";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { swingTwistBasis } from "./swingTwistBasis";
import { swingTwistRange } from "./swingTwistRange";
import { swingTwistRegion } from "./swingTwistRegion";
import { swivelArcs } from "./swivelArcs";

/**
 * The swivels a joint's swing-twist range provably refuses: for a joint
 * whose bone-local rotation is a fixed rotation turned about a fixed axis by
 * the swivel (the chain root of `hingedArmSwivel.pose`), a test of whether
 * every swivel from `low` to `high` degrees reads past the range, so that
 * `jointRomOvershoot` scores each of them above zero. It is the swing-twist
 * counterpart of `boxExcludedSwivels`, which refuses nothing for such a joint.
 *
 * The range reads the rotation `q` by its twist about the rest direction `u`
 * and its swing (`swingTwistRange.read`). Such a rotation's quaternion is
 * `A cos(ψ/2) + B sin(ψ/2)` up to its sign, so its scalar part `w` and its
 * vector part along `u`, `s`, are each a first harmonic of the half swivel.
 * The twist is `2 atan2(s, w)`, legal on the rig interval `[lo, hi]` the
 * clinical one maps to (`toRigAngle`) and its full-turn aliases, so the half
 * twist `φ` is legal on `[lo/2, hi/2]` and its half-turn aliases. For an
 * interval narrower than a full turn, `sin(φ - hi/2) sin(φ - lo/2)` is
 * positive exactly where `φ` lies outside, and times `s² + w²` it is
 * `(s cos(hi/2) - w sin(hi/2)) (s cos(lo/2) - w sin(lo/2))`: a product of two
 * first harmonics of the half swivel, so a sinusoid of the swivel, the same
 * for either sign of the quaternion. The swing is `acos(u · q u)`, and
 * `u · q u` is a sinusoid of the swivel (Rodrigues' formula); every swing
 * past the region's greatest radius on any great circle is refused, where
 * `cos` of that radius less the sinusoid is positive. Each sinusoid is
 * fitted exactly from the rotation at 0, 90 and 180 degrees, and each refuses
 * the arc where it exceeds `MARGIN` (`swivelArcs`).
 *
 * Every refusal is certain. The twist's product above `MARGIN` puts both
 * sines above it, so the half twist lies past its interval by more than
 * `MARGIN` radians, the twist by twice that; the swing's cosine short of the
 * greatest radius's by more than `MARGIN` puts the swing past it by more
 * than `MARGIN` radians. `MARGIN` is the joints' tolerance (`ROM_TOLERANCE`)
 * in radians, far beyond the rounding of the fit and the arcs' ends. The
 * range reads the rotation the caller's angles compose in its own frame
 * (`scanJointRom`), which is the swivel's rotation only when the caller
 * decomposes it on that same basis and rest frame; any other basis or frame,
 * a constraint without a swing-twist gate, a twist interval of a full turn
 * or more and a greatest radius of a half turn refuse nothing, so the test
 * only ever says less than the range would.
 *
 * @param props The joint and its rotation by swivel.
 * @returns Whether every swivel in `[low, high]`, degrees, is refused; a joint with nothing to refuse refuses no swivel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise on the rotation, why the twist's and the swing's bounds are sinusoids of the swivel, the margin and why every refusal is certain, and every case that refuses nothing.
 * @evidence contracts/development/implementation.md#principled-implementation A quaternion turned about a fixed axis is a first harmonic of the half angle, so a product of two of its linear readings is a sinusoid of the swivel; the twist interval maps to rig degrees as `swingTwistRange.read` lifts them, and the swing is bounded by the region's greatest radius, which every great circle's radius is at most.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The rotation is read at three swivels, each bound gives one sinusoid, the sinusoids their arcs and the arcs one union the test reads.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sound by construction, never by sampling: an arc is refused only from its sinusoid's roots with the joints' tolerance to spare, and a case the analysis does not cover refuses nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three rotations fit both sinusoids, at most two arcs are merged once, and each test is a scan of the few merged intervals (`swivelArcs.covers`).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit, the arcs, their union and its test are `swivelArcs`'s, the rig interval `toRigAngle`'s, the rest direction `swingTwistBasis`'s and the radii `swingTwistRegion`'s cached table, shared with `swingTwistRange`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the merged arc list in the returned test only.
 */
export function swingTwistExcludedSwivels(props: {
  /** The basis the caller decomposes the rotation on, admitted and normalized (`normalizeJointAxes`). */
  basis: IAutoMovieJointAxes;

  /** The rest frame the caller lifts its angles by; omitted, they are clinical. */
  frame?: IAutoMovieRestFrame | undefined;

  /** The joint's resolved range of motion; one without a swing-twist gate refuses nothing. */
  constraint: IAutoMovieJointConstraint | null;

  /** The frame the range reads the joint in (`scanJointRom`'s: the caller's rig's, or `swingTwistRange.of`'s). */
  joint: swingTwistRange.IJoint;

  /** The joint's bone-local rotation at a swivel, degrees: a fixed rotation turned about a fixed axis by the swivel. */
  rotation: (swivel: number) => IAutoMovieQuaternion;
}): (low: number, high: number) => boolean {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  const gate: IAutoMovieJointConstraint.ISwingTwist | null | undefined =
    constraint?.swingTwist;
  if (
    constraint === null ||
    gate === null ||
    gate === undefined ||
    !same(props.basis, props.frame, props.joint)
  )
    return (): boolean => false;
  const u: IAutoMovieVector3 = swingTwistBasis.of(props.joint.axes).u;

  // The rotation's half-angle readings and its rest direction's cosine at
  // swivels 0, 90 and 180.
  const sampled: { s: number; w: number; d: number }[] = [0, 90, 180].map(
    (swivel: number): { s: number; w: number; d: number } => {
      const q: IAutoMovieQuaternion = Quaternion.normalize(
        props.rotation(swivel),
      );
      return {
        s: q.x * u.x + q.y * u.y + q.z * u.z,
        w: q.w,
        d: Vector3.dot(u, Quaternion.rotateVector(q, u)),
      };
    },
  );
  const fit = (
    read: (sample: { s: number; w: number; d: number }) => number,
  ): swivelArcs.ISinusoid => {
    const [zero, quarter, half] = sampled.map(read) as [number, number, number];
    return swivelArcs.fitted(zero, quarter, half);
  };

  const arcs: swivelArcs.IArc[] = [];
  const refuse = (f: swivelArcs.ISinusoid): boolean => {
    const arc: swivelArcs.IArc | "all" | null = swivelArcs.above(f, MARGIN);
    if (arc === "all") return true;
    if (arc !== null) arcs.push(arc);
    return false;
  };

  // The twist past its rig interval, read on the half twist.
  const twist: IAutoMovieAngleRange = gate.twist;
  const ends: number[] = [twist.min, twist.max].map(
    (clinical: number): number =>
      toRigAngle(clinical, props.joint.frame?.twist)!,
  );
  const lo: number = (Math.min(...ends) / 2) * Quaternion.DEG2RAD;
  const hi: number = (Math.max(...ends) / 2) * Quaternion.DEG2RAD;
  if (
    hi - lo < Math.PI &&
    refuse(
      fit(
        ({ s, w }): number =>
          (s * Math.cos(hi) - w * Math.sin(hi)) *
          (s * Math.cos(lo) - w * Math.sin(lo)),
      ),
    )
  )
    return (): boolean => true;

  // The swing past the region's greatest radius.
  const greatest: number = Math.max(
    ...swingTwistRegion.table(constraint, props.joint),
  );
  if (
    greatest < 180 &&
    refuse(fit(({ d }): number => Math.cos(greatest * Quaternion.DEG2RAD) - d))
  )
    return (): boolean => true;

  const merged: swivelArcs.IArc[] | "all" = swivelArcs.union(arcs);
  return (low: number, high: number): boolean =>
    swivelArcs.covers(merged, low, high);
}

/**
 * How far past a bound, in sine or cosine units, a reading must lie to be
 * refused: the joints' tolerance (`ROM_TOLERANCE`) in radians, past the
 * rounding of every step.
 */
const MARGIN: number = (ROM_TOLERANCE * Math.PI) / 180;

/**
 * Whether the caller's basis and rest frame are the range's own, so that the
 * angles the caller reads compose back, in the range's frame, to the
 * rotation it decomposed.
 */
function same(
  basis: IAutoMovieJointAxes,
  frame: IAutoMovieRestFrame | undefined,
  joint: swingTwistRange.IJoint,
): boolean {
  const own: IAutoMovieJointAxes = normalizeJointAxes(
    joint.axes,
    "swingTwistExcludedSwivels axes",
  );
  const vector = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    a.x === b.x && a.y === b.y && a.z === b.z;
  const axis = (
    a: IAutoMovieAxisFrame | undefined,
    b: IAutoMovieAxisFrame | undefined,
  ): boolean =>
    a === b ||
    (a !== undefined &&
      b !== undefined &&
      a.sign === b.sign &&
      a.neutral === b.neutral);
  return (
    vector(basis.flexion, own.flexion) &&
    vector(basis.abduction, own.abduction) &&
    vector(basis.twist, own.twist) &&
    basis.twistPlacement === own.twistPlacement &&
    axis(frame?.flexion, joint.frame?.flexion) &&
    axis(frame?.abduction, joint.frame?.abduction) &&
    axis(frame?.twist, joint.frame?.twist)
  );
}
