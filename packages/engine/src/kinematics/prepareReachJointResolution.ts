import type {
  AutoMovieHumanoidBone, IAutoMovieJointAxes, IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { decomposeJointRotationOnBasis } from "./decomposeJointRotationOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";

/** One actual fixed bone's clinical basis and effective ROM, before lazy admission. */
interface IJointSource {
  /** Canonical bone identity used by clinical output and original ROM scoring. */
  bone: AutoMovieHumanoidBone;

  /** Original raw merged basis; undefined retains the inverse's default basis. */
  axes: IAutoMovieJointAxes | undefined;

  /** Actual effective source constraint, never a target-dependent projection. */
  constraint: IAutoMovieJointConstraint | null;
}

/** Fixed clinical inputs of one explicitly unchanged native reach source. */
interface IProps {
  /** The two actual source joints, in the original upper/lower admission order. */
  upper: IJointSource;
  lower: IJointSource;

  /** Actual clinical table; each original argument lookup remains at numerical use. */
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}

/** The original clinical lift's fresh numeric joint representation. */
type IJoint = IAutoMovieResolvedJointAngles & { bone: AutoMovieHumanoidBone };

/** One solve's actual upper/lower candidate rotations become two fresh joints. */
type ILift = (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => [IJoint, IJoint];

/**
 * Bind only fixed clinical prerequisites of an actual unchanged reach source.
 * Construction admits no axis, frame or quaternion. Each solve receives an
 * independent lift; the first actual upper/lower candidate preserves its
 * original table lookup and basis-admission path, and every quaternion still
 * passes the inverse's full finite/extraction/chart/alias/ROM logic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States unchanged source ownership, lazy original upper/lower admission order, degree outputs, current quaternion validation and independent solve/output lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Each joint lazily normalizes its actual raw basis after the original frame-argument lookup, then creates the existing OnBasis prepareQueries factory. Every solve receives independent readers: each candidate retains quaternion admission/extraction, principal and applicable alternate clinical maps, aliases, ROM comparisons and ties. Only fixed successful affine metadata shares across queries, and every lift returns fresh joints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One source factory owns the two fixed clinical readers; query factories supply independent lifts. Existing normalizeJointAxes and decomposeJointRotationOnBasis retain numerical admission and inverse mathematics, while reachPose alone owns candidate search.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Undefined-only basis defaults remain, null/malformed maps are not repaired and unused frames are not admitted. No target, candidate result, previous angle, approximate comparison or alternate scoring rule is stored or supplied.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each used source joint admits its basis once and shares the existing inverse's three lazy affine readers. Every original candidate still performs current quaternion extraction/chart/ROM work; original frame-argument lookup remains per call. Factory/lift storage is constant, outputs remain fresh and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual unchanged reach source owns normalized basis and fixed affine preparation; each solve creates independent target-state-free inverse readers. Every current quaternion, original frame argument lookup, chart and score remains live. Source changes require another producer; no target, candidate or previous angle certifies reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The source borrows two fixed joint records/table and retains two normalized bases/factories with at most six affine readers until release. Each solve owns two independent inverse readers without target/angle history; only fresh numeric joints escape and no handle or task is created.
 */
export function prepareReachJointResolution(props: IProps): () => ILift {
  const upper: ReturnType<typeof prepareInverse> = prepareInverse(props.upper, props.frames);
  const lower: ReturnType<typeof prepareInverse> = prepareInverse(props.lower, props.frames);
  return (): ILift => {
    const readUpper: ReturnType<ReturnType<typeof prepareInverse>> = upper();
    const readLower: ReturnType<ReturnType<typeof prepareInverse>> = lower();
    return (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): [IJoint, IJoint] => [
      { bone: props.upper.bone, ...readUpper(upper) },
      { bone: props.lower.bone, ...readLower(lower) },
    ];
  };
}

/** Defer real basis admission to the same first candidate site as the raw inverse. */
function prepareInverse(
  source: IJointSource,
  frames: IProps["frames"],
): () => (q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles {
  let create: ReturnType<typeof decomposeJointRotationOnBasis.prepareQueries> | undefined;
  return (): (q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles => {
    let read: ReturnType<ReturnType<typeof decomposeJointRotationOnBasis.prepareQueries>> | undefined;
    return (q: IAutoMovieQuaternion): IAutoMovieResolvedJointAngles => {
      const frame: IAutoMovieRestFrame | undefined = frames[source.bone];
      if (read === undefined) {
        create ??= decomposeJointRotationOnBasis.prepareQueries(
          normalizeJointAxes(
            source.axes === undefined ? DEFAULT_JOINT_AXES : source.axes,
            "decomposeJointRotation axes",
          ),
          frame,
          { bone: source.bone, constraint: source.constraint },
        );
        read = create();
      }
      return read(q);
    };
  };
}
