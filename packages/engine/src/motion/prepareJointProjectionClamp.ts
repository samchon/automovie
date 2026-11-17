import type { IAutoMovieJointPose } from "@automovie/interface";

import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { prepareJointRotationProjection } from "./prepareJointRotationProjection";

/** Original F/A/T coordinate names, with no alternate angular convention. */
type Axis = "flexion" | "abduction" | "twist";

/**
 * Read one query's actual reference clamp and own its later analytic inputs.
 * The current callback is looked up exactly once at each original call site
 * and invoked with the original props receiver. A genuine factory never
 * mutates or retains inputs; its first reference is an own-data record, so
 * one private scratch may replace subsequent input clones. Unknown, wrapped
 * or replaced callbacks receive fresh candidate values, and their returned
 * bone/F/A/T values are snapshotted before another callback can overwrite a
 * shared output. The numerical snapshot reads only these four fields.
 *
 * @param props The original projector props object, including its live clamp lookup and method receiver.
 * @param raw The query's original inverse reading, passed to its first actual clamp.
 * @returns A stable reference, retained generic projection and analytic candidate reader; each unknown output owns its four numerical joint fields.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original callback lookup/receiver/order, genuine own-data reference, per-query scratch/arguments, foreign input freshness and numerical output snapshots without metadata reads.
 * @evidence contracts/development/implementation.md#principled-implementation Exact ROM factory provenance alone proves no input/output retention or input mutation. Its result is fresh own data or an own input; other callbacks can reuse mutable output, so their actual bone/F/A/T values are copied before any later call. Analytic clinical conversion precedes current lookup, while generic callers pass the callback obtained before their original argument spread. Reflect.apply preserves the original receiver and argument list.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This internal owner handles reference/candidate callback dispatch and input ownership only. The projector owns candidate enumeration, actual composition, scores and ties; the ROM factory remains the sole numerical clamp.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No callback is replaced, added or skipped. Unknown callbacks retain fresh inputs and actual call order. Foreign outputs copy only the interface's four fields, without metadata spread/introspection, to prevent later calls changing a stored score's joint. Scratch-alias results are copied before editing. No caller flag, descriptor, numerical key, ROM relaxation or cached fit claims provenance.
 * @evidence contracts/development/implementation.md#efficient-algorithms One query owns an adapter, one argument array and optional genuine scratch. Scratch replaces per-pair input clones for actual factories. Foreign callbacks retain fresh inputs and additionally create stable four-field output snapshots; every numerical clamp/probe remains. Generic span outputs need no snapshot because their requested axis is consumed immediately. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Genuine factory identity alone permits scratch reuse. Foreign reference/candidate outputs are independent numerical records, so subsequent calls cannot mutate candidate inputs, duplicate keys or selected joint/raw pairs. Every lookup, clinical conversion and receiver keeps its original order; generic callback capture remains caller-owned. Nested queries own independent adapters/argument arrays, without pending callable slots.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One query owns stable reference, optional scratch, argument array and two closures until return/throw. Its foreign snapshots retain only bone/F/A/T and no callback-output object. Selected numerical output may escape, but no scratch, callback input, query history, global result or handle survives.
 */
export function prepareJointProjectionClamp(
  props: Pick<Parameters<typeof prepareJointRotationProjection>[0], "clamp">,
  raw: IAutoMovieJointPose,
): {
  /** First numerical result; unknown callback outputs are copied by four fields. */
  reference: IAutoMovieJointPose;
  /** Retain one generic result; caller captures callback before its original input spread. */
  project: (clamp: typeof props.clamp, joint: IAutoMovieJointPose) => IAutoMovieJointPose;
  /** Admit a completed rig-degree X/Y pair in original clinical order, returning stable ownership. */
  candidate: (first: Axis, second: Axis | undefined, x: number, y: number,
    clinical: (axis: Axis, angle: number) => number) => IAutoMovieJointPose;
} {
  const args: [IAutoMovieJointPose] = [raw];
  const read: (clamp: typeof props.clamp, joint: IAutoMovieJointPose) => IAutoMovieJointPose = (
    clamp: typeof props.clamp, joint: IAutoMovieJointPose,
  ): IAutoMovieJointPose => {
    args[0] = joint;
    const admitted: IAutoMovieJointPose = Reflect.apply(clamp, props, args);
    return clampJointToSkeleton.borrow(clamp) === undefined ? snapshot(admitted) : admitted;
  };
  const initial: typeof props.clamp = props.clamp;
  const reference: IAutoMovieJointPose = read(initial, raw);
  const scratch: IAutoMovieJointPose | undefined =
    clampJointToSkeleton.borrow(initial) === undefined ? undefined : { ...reference };
  return {
    reference,
    project: read,
    candidate: (first: Axis, second: Axis | undefined, x: number, y: number,
      clinical: (axis: Axis, angle: number) => number): IAutoMovieJointPose => {
      const candidate: IAutoMovieJointPose = scratch ?? { ...reference };
      candidate[first] = clinical(first, x);
      if (second !== undefined) candidate[second] = clinical(second, y);
      const current: typeof props.clamp = props.clamp;
      const input: IAutoMovieJointPose = scratch !== undefined && clampJointToSkeleton.borrow(current) === undefined
        ? { ...candidate } : candidate;
      const admitted: IAutoMovieJointPose = read(current, input);
      return scratch !== undefined && admitted === scratch ? { ...admitted } : admitted;
    },
  };
}

/** Preserve the actual returned clinical values without reading unused metadata. */
function snapshot(joint: IAutoMovieJointPose): IAutoMovieJointPose {
  return { bone: joint.bone, flexion: joint.flexion,
    abduction: joint.abduction, twist: joint.twist };
}
