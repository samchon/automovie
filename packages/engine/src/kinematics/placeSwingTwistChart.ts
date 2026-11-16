import type {
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { rotationBetween } from "../math/rotationBetween";
import { toRigAngle } from "../rom/toRigAngle";
import { SwingTwistFramePreparation } from "./SwingTwistFramePreparation";
import { swingTwistBasis } from "./swingTwistBasis";
import type { swingTwistRange } from "./swingTwistRange";

/** A disc coordinate pair and clinical-degree twist, as the chart produces. */
type IPlace = ReturnType<typeof swingTwistRange.chart>;

/** Existing region-radius owner, passed without constructing a per-read closure. */
type IRadius = typeof swingTwistRange.radius;

/** One fixed chart inversion's successful, lazily prepared scalar metadata. */
interface IState {
  /** Admitted swing frame first read at the original placed entry site. */
  basis?: swingTwistBasis.IBasis;

  /** Source normalization first reached after the actual direction calculation. */
  aim?: ReturnType<typeof rotationBetween.prepare>;

  /** Fixed twist axis, first read after the original rig-angle conversion. */
  turn?: ReturnType<typeof Quaternion.prepareAxisAngle>;

  /** Fixed affine operands admitted by the actual first twist conversion. */
  rig?: ReturnType<typeof toRigAngle.prepare>;
}

/**
 * Invert a swing-twist disc coordinate through the original placed arithmetic.
 * Optional caller-owned state shares only unchanged frame/source/axis/affine
 * metadata for the actual prepared endpoint blender. A direct caller supplies
 * no state and keeps every original admission and ordinary numerical entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines disc/clinical inputs, matching region/frame lifetime, original direct behavior, lazy metadata order and fresh rest-relative quaternion output.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original hypot/azimuth gate, region radius, direction, shortest turn from the rest axis and twist-axis composition followed by normalization. A fixed frame makes only successful basis admission, source normalization, axis magnitude and affine operands invariant; every current place still supplies the original direction, angle and normalization work.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One inversion owner serves swingTwistRange.placed and its actual fixed-endpoint prepareBlend reader. Existing basis, radius, direction, shortest-turn, axis-angle and affine owners retain their formulas; optional private state only chooses prepared entries at the original call sites.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No interpolation, azimuth threshold, radius, direction, normalization or multiplication association changes. The first use still admits basis before hypot, computes direction before source normalization, completes the shortest turn before twist-frame admission, and converts twist before axis-angle work. A failed admission installs no successful numerical reading; an empty reader may remain for retry. No place/output is cached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct inversion keeps the original constant work. Prepared inversion admits its basis once, normalizes the fixed shortest-turn source once, shares twist-axis magnitude and admits one fixed affine frame once; later reads omit those repeated fixed calculations/records while retaining current target normalization, direction/trigonometry and final normalization. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A fixed endpoint reader owns one state under its declared unchanged constraint/joint lifetime. The actual operation shares only metadata proven invariant by those inputs, delegating each numerical operation to the same direct/prepared owner; no global frame identity or queried chart result establishes reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct locals end with the call. Prepared state owns at most one admitted swing frame, one normalized source/aim reader, one axis reader and one affine reader until the endpoint reader releases it. Each result is fresh and no place, share, quaternion output, handle or task is retained.
 */
export function placeSwingTwistChart(
  place: IPlace,
  constraint: IAutoMovieJointConstraint,
  joint: swingTwistRange.IJoint,
  radius: IRadius,
  state?: IState,
): IAutoMovieQuaternion {
  const basis: swingTwistBasis.IBasis = state?.basis ??
    SwingTwistFramePreparation.basis(joint);
  if (state !== undefined) state.basis = basis;
  const k: number = Math.hypot(place.x, place.y);
  const azimuth: number = k > 1e-12
    ? Math.atan2(place.y, place.x) * swingTwistBasis.DEG : 0;
  const direction: IAutoMovieVector3 = swingTwistBasis.direction(
    basis, k * radius(constraint, joint, azimuth), azimuth,
  );
  const aimed: IAutoMovieQuaternion = state === undefined
    ? rotationBetween(basis.u, direction)
    : (state.aim ??= rotationBetween.prepare(basis.u))(direction);
  const angle: number = state === undefined
    ? toRigAngle(place.twist, joint.frame?.twist)!
    : (state.rig ??= toRigAngle.prepare())(place.twist, joint.frame?.twist)!;
  const turned: IAutoMovieQuaternion = state === undefined
    ? Quaternion.fromAxisAngle(basis.u, angle)
    : (state.turn ??= Quaternion.prepareAxisAngle(basis.u))(angle);
  return Quaternion.normalize(Quaternion.multiply(aimed, turned));
}

/**
 * Private numerical preparation for the actual fixed-endpoint chart blender.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines one unchanged constraint/joint/radius owner and lazy admission at each original inversion site.
 * @evidence contracts/development/design.md#principled-representation The state holds only frame and one-source/one-axis/one-affine invariants of the unchanged clinical rig, independently of the current interpolated place.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the actual prepared chart blender requests this internal reader; no radius table, metadata getter, public barrel or second inversion algorithm is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Construction reads no numerical input and no user-controlled freeze or frame identity admits preparation; caller-declared unchanged dependencies establish the lifetime.
 */
export namespace placeSwingTwistChart {
  /** Release this lazy reader with its fixed endpoint pair and unchanged rig. */
  export function prepare(
    constraint: IAutoMovieJointConstraint,
    joint: swingTwistRange.IJoint,
    radius: IRadius,
  ): (place: IPlace) => IAutoMovieQuaternion {
    const state: IState = {};
    return (place: IPlace): IAutoMovieQuaternion =>
      placeSwingTwistChart(place, constraint, joint, radius, state);
  }
}
