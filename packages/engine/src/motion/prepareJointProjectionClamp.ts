import type { IAutoMovieJointPose } from "@automovie/interface";

import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";

/** Original F/A/T coordinate names, with no alternate angular convention. */
type Axis = "flexion" | "abduction" | "twist";

/**
 * Read one query's actual reference clamp and own its later analytic inputs.
 * The current callback is looked up exactly once at each original call site.
 * Foreign callbacks keep the original props receiver. Genuine factories are
 * producer-owned arrows with lexical this, so direct invocation preserves their
 * complete call behavior without reflective argument storage. A factory never
 * mutates or retains inputs; its first reference is an own-data record, so one
 * private scratch may replace subsequent input clones. Unknown, wrapped or
 * replaced callbacks receive fresh candidate values, and their returned
 * bone/F/A/T values are snapshotted before another callback can overwrite a
 * shared output. The numerical snapshot reads only these four fields.
 *
 * @param props The original projector props object, including its live clamp
 *   lookup and method receiver.
 * @param raw The query's original inverse reading, passed to its first actual
 *   clamp.
 * @returns A stable reference, retained generic projection and analytic
 *   candidate reader; each unknown output owns its four numerical joint
 *   fields.
 */
export function prepareJointProjectionClamp(
  props: Pick<Parameters<typeof prepareJointRotationProjection>[0], "clamp">,
  raw: IAutoMovieJointPose,
): {
  /** First numerical result; unknown callback outputs are copied by four fields. */
  reference: IAutoMovieJointPose;
  /**
   * Retain one generic result; caller captures callback before its original
   * input spread.
   */
  project: (
    clamp: typeof props.clamp,
    joint: IAutoMovieJointPose,
  ) => IAutoMovieJointPose;
  /**
   * Admit a completed rig-degree X/Y pair in original clinical order, returning
   * stable ownership.
   */
  candidate: (
    first: Axis,
    second: Axis | undefined,
    x: number,
    y: number,
    clinical: (axis: Axis, angle: number) => number,
  ) => IAutoMovieJointPose;
} {
  const initial: typeof props.clamp = props.clamp;
  const nativeInitial: boolean =
    clampJointToSkeleton.borrow(initial) !== undefined;
  let args: [IAutoMovieJointPose] | undefined;
  const read: (
    clamp: typeof props.clamp,
    joint: IAutoMovieJointPose,
  ) => IAutoMovieJointPose = (
    clamp: typeof props.clamp,
    joint: IAutoMovieJointPose,
  ): IAutoMovieJointPose => {
    const native: boolean =
      clamp === initial
        ? nativeInitial
        : clampJointToSkeleton.borrow(clamp) !== undefined;
    if (native) return clamp(joint);
    const argumentsList: [IAutoMovieJointPose] = (args ??= [joint]);
    argumentsList[0] = joint;
    return snapshot(Reflect.apply(clamp, props, argumentsList));
  };
  const reference: IAutoMovieJointPose = read(initial, raw);
  const scratch: IAutoMovieJointPose | undefined = nativeInitial
    ? { ...reference }
    : undefined;
  return {
    reference,
    project: read,
    candidate: (
      first: Axis,
      second: Axis | undefined,
      x: number,
      y: number,
      clinical: (axis: Axis, angle: number) => number,
    ): IAutoMovieJointPose => {
      const candidate: IAutoMovieJointPose = scratch ?? { ...reference };
      candidate[first] = clinical(first, x);
      if (second !== undefined) candidate[second] = clinical(second, y);
      const current: typeof props.clamp = props.clamp;
      const input: IAutoMovieJointPose =
        scratch !== undefined &&
        current !== initial &&
        clampJointToSkeleton.borrow(current) === undefined
          ? { ...candidate }
          : candidate;
      const admitted: IAutoMovieJointPose = read(current, input);
      return scratch !== undefined && admitted === scratch
        ? { ...admitted }
        : admitted;
    },
  };
}

/** Preserve the actual returned clinical values without reading unused metadata. */
function snapshot(joint: IAutoMovieJointPose): IAutoMovieJointPose {
  return {
    bone: joint.bone,
    flexion: joint.flexion,
    abduction: joint.abduction,
    twist: joint.twist,
  };
}
