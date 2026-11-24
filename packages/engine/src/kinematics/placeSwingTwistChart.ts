import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieSwingTwistBasis,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { rotationBetween } from "../math/rotationBetween";
import { toRigAngle } from "../rom/toRigAngle";
import { swingTwistBasis } from "./swingTwistBasis";
import { swingTwistRange } from "./swingTwistRange";

/** A disc coordinate pair and clinical-degree twist, as the chart produces. */
type IPlace = ReturnType<typeof swingTwistRange.chart>;

/** Existing region-radius owner, passed without constructing a per-read closure. */
type IRadius = typeof swingTwistRange.radius;

/** One fixed chart inversion's prepared scalar metadata. */
interface IState {
  /** Admitted swing frame. */
  basis: IAutoMovieSwingTwistBasis.IBasis;

  /** Source normalization of the swing axis. */
  aim: ReturnType<typeof rotationBetween.prepare>;

  /** Fixed twist axis. */
  turn: ReturnType<typeof Quaternion.prepareAxisAngle>;

  /** Fixed affine operands of the twist conversion. */
  rig: ReturnType<typeof toRigAngle.prepare>;
}

/**
 * Invert a swing-twist disc coordinate through the original placed arithmetic.
 * Optional caller-owned state shares only unchanged frame/source/axis/affine
 * metadata for the actual prepared endpoint blender. A direct caller supplies
 * no state and keeps every original admission and ordinary numerical entry.
 */
export function placeSwingTwistChart(
  place: IPlace,
  constraint: IAutoMovieJointConstraint,
  joint: IAutoMovieJointRotationFrame,
  radius: IRadius,
  state?: IState,
): IAutoMovieQuaternion {
  const basis: IAutoMovieSwingTwistBasis.IBasis =
    state?.basis ?? swingTwistBasis.of(joint.axes);
  const k: number = Math.hypot(place.x, place.y);
  const azimuth: number =
    k > 1e-12 ? Math.atan2(place.y, place.x) * swingTwistBasis.DEG : 0;
  const direction: IAutoMovieVector3 = swingTwistBasis.direction(
    basis,
    k * radius(constraint, joint, azimuth),
    azimuth,
  );
  const aimed: IAutoMovieQuaternion =
    state === undefined
      ? rotationBetween(basis.u, direction)
      : state.aim(direction);
  const angle: number =
    state === undefined
      ? toRigAngle(place.twist, joint.frame?.twist)!
      : state.rig(place.twist, joint.frame?.twist)!;
  const turned: IAutoMovieQuaternion =
    state === undefined
      ? Quaternion.fromAxisAngle(basis.u, angle)
      : state.turn(angle);
  return Quaternion.normalize(Quaternion.multiply(aimed, turned));
}

/** Private numerical preparation for the actual fixed-endpoint chart blender. */
export namespace placeSwingTwistChart {
  /** Release this reader with its fixed endpoint pair and unchanged rig. */
  export function prepare(
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
    radius: IRadius,
  ): (place: IPlace) => IAutoMovieQuaternion {
    const basis: IAutoMovieSwingTwistBasis.IBasis = swingTwistBasis.of(
      joint.axes,
    );
    const state: IState = {
      basis,
      aim: rotationBetween.prepare(basis.u),
      turn: Quaternion.prepareAxisAngle(basis.u),
      rig: toRigAngle.prepare(),
    };
    return (place: IPlace): IAutoMovieQuaternion =>
      placeSwingTwistChart(place, constraint, joint, radius, state);
  }
}
