import type {
  IAutoMovieJointAxes,
  IAutoMovieJointRotationFrame,
  IAutoMovieSwingTwistBasis,
} from "@automovie/interface";

import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { swingTwistBasis } from "./swingTwistBasis";

/** The private reader carried only by frames this module explicitly prepares. */
const READ_BASIS: unique symbol = Symbol("prepared swing-twist basis");

/** The private normalized-axis reader owned by the same explicit wrapper. */
const READ_AXES: unique symbol = Symbol("prepared normalized joint axes");

/** The private composer reader owned by the same explicit wrapper. */
const READ_COMPOSER: unique symbol = Symbol("prepared joint composer");

/** Weak provenance of wrappers actually completed by this module's constructor. */
const PREPARED: WeakSet<IAutoMovieJointRotationFrame> = new WeakSet();

/** An ordinary joint frame plus its operation-owned lazy axis and swing readers. */
interface IPrepared extends IAutoMovieJointRotationFrame {
  /** Admit the unchanged axes on first use, retaining only successful preparation. */
  readonly [READ_BASIS]: (
    receiver: IAutoMovieJointRotationFrame,
  ) => IAutoMovieSwingTwistBasis.IBasis;

  /** Admit at the first actual caller's diagnostic path; ordinary receivers opt out. */
  readonly [READ_AXES]: (
    receiver: IAutoMovieJointRotationFrame,
    path: string,
  ) => IAutoMovieJointAxes | undefined;

  /** The frame's record composer on its admitted axes, made at the first composition. */
  readonly [READ_COMPOSER]: (
    receiver: IAutoMovieJointRotationFrame,
    path: string,
  ) => ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined;
}

/** Exact constructor provenance, without probing any caller-owned property or prototype. */
function prepared(joint: IAutoMovieJointRotationFrame): joint is IPrepared {
  return PREPARED.has(joint);
}

/**
 * Explicit one-operation swing-twist frame preparation. Ordinary joint frames
 * keep their live basis admission, while a prepared wrapper owns its reader.
 */
export namespace SwingTwistFramePreparation {
  /**
   * Borrow a joint's axes and rest frame for one unchanged operation.
   * Creating the frozen wrapper performs no numerical admission; its first
   * numerical reader keeps its original diagnostic path.
   *
   * @param joint Frame whose axis and rest-frame records remain unchanged until release.
   * @returns A fresh wrapper carrying private lazy metadata readers; release it when the operation ends.
   */
  export function of(joint: IAutoMovieJointRotationFrame): IAutoMovieJointRotationFrame {
    const axes: IAutoMovieJointAxes = joint.axes;
    let normal: IAutoMovieJointAxes | undefined;
    let basis: IAutoMovieSwingTwistBasis.IBasis | undefined;
    let composer: ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined;
    const readAxes: (path: string) => IAutoMovieJointAxes = (
      path: string,
    ): IAutoMovieJointAxes => {
      if (normal === undefined) normal = normalizeJointAxes(axes, path);
      return normal;
    };
    const frame: IPrepared = {
      axes,
      frame: joint.frame,
      [READ_AXES]: (
        receiver: IAutoMovieJointRotationFrame,
        path: string,
      ): IAutoMovieJointAxes | undefined =>
        receiver === frame ? readAxes(path) : undefined,
      [READ_COMPOSER]: (
        receiver: IAutoMovieJointRotationFrame,
        path: string,
      ): ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined =>
        receiver !== frame ? undefined
          : (composer ??= jointToQuaternionOnBasis.prepare(readAxes(path), joint.frame)),
      [READ_BASIS]: (
        receiver: IAutoMovieJointRotationFrame,
      ): IAutoMovieSwingTwistBasis.IBasis => {
        if (receiver !== frame) return swingTwistBasis.of(receiver.axes);
        if (basis === undefined) {
          const admitted: IAutoMovieSwingTwistBasis.IBasis =
            swingTwistBasis.fromNormalized(readAxes("swingTwistRange axes"));
          Object.freeze(admitted.e2);
          basis = Object.freeze(admitted);
        }
        return basis;
      },
    };
    Object.defineProperty(frame, READ_BASIS, { enumerable: false });
    Object.defineProperty(frame, READ_AXES, { enumerable: false });
    Object.defineProperty(frame, READ_COMPOSER, { enumerable: false });
    const owned: IPrepared = Object.freeze(frame);
    PREPARED.add(owned);
    return owned;
  }

  /**
   * Read normalized axes only from an explicitly prepared frame. Ordinary,
   * copied and inherited receivers return undefined without admitting axes;
   * their numerical caller keeps its existing live admission path.
   *
   * @param joint The frame whose exact wrapper identity owns any preparation.
   * @param path The actual numerical caller's unchanged admission diagnostic prefix.
   * @returns Its successful admitted basis, or undefined for an ordinary receiver.
   */
  export function normalized(
    joint: IAutoMovieJointRotationFrame,
    path: string,
  ): IAutoMovieJointAxes | undefined {
    return prepared(joint) ? joint[READ_AXES](joint, path) : undefined;
  }

  /**
   * Read the explicit wrapper's record composer on its admitted axes and
   * rest frame (`jointToQuaternionOnBasis.prepare`), made at the first
   * composition, or undefined for an ordinary receiver, whose caller keeps
   * its own composition. The composer's products are the direct
   * composition's, sharing only its factors between calls.
   *
   * @param joint The frame whose exact wrapper identity owns any preparation.
   * @param path The actual numerical caller's unchanged admission diagnostic prefix.
   * @returns The composer, or undefined for an ordinary receiver.
   */
  export function composer(
    joint: IAutoMovieJointRotationFrame,
    path: string,
  ): ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined {
    return prepared(joint) ? joint[READ_COMPOSER](joint, path) : undefined;
  }

  /**
   * Read the explicit wrapper's prepared basis, or admit an ordinary frame's
   * current axes exactly as the original numerical reader did.
   *
   * @param joint An ordinary frame or an explicit unchanged-operation wrapper.
   * @returns Its admitted basis, frozen for an explicit wrapper, with the existing diagnostic path.
   */
  export function basis(joint: IAutoMovieJointRotationFrame): IAutoMovieSwingTwistBasis.IBasis {
    return prepared(joint)
      ? joint[READ_BASIS](joint)
      : swingTwistBasis.of(joint.axes);
  }
}
