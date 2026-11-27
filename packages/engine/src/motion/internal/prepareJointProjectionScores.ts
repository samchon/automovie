import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { jointToQuaternionOnBasis } from "../../kinematics/internal/jointToQuaternionOnBasis";
import { readNormalizedQuaternion } from "../../math/internal/readNormalizedQuaternion";
import { prepareJointProjectionClamp } from "./prepareJointProjectionClamp";
import type { AutoMovieEngineMotionJointProjection } from "../AutoMovieEngineMotionJointProjection";

/**
 * Rank the analytic box projector's actual admitted candidates under its
 * original normalized-dot, summation-error and nearest-reference tie policy.
 * The caller supplies the already completed finite candidate pairs, actual
 * query reference/clamp and local target; this helper changes no enumeration,
 * callback, numerical expression or result ownership.
 *
 * Empty scratch capacity belongs to the fixed projector. A synchronous query
 * leases it exclusively; reentrant clamp queries use separate temporary
 * containers. finally clears every joint and map reference on success or throw.
 * Selected joints and requested raw quaternion copies remain independent.
 *
 * @param props Fixed mobile axes, exact composer/converter and original
 *   equality under one unchanged rig.
 * @returns A query scorer accepting current target/reference/pairs/clamp and
 *   the original paired-output demand.
 */
export function prepareJointProjectionScores(
  props: IProps,
): (
  local: IAutoMovieQuaternion,
  reference: IAutoMovieJointPose,
  pairs: readonly number[],
  clamp: ReturnType<typeof prepareJointProjectionClamp>,
  requested: boolean,
) => IEvaluation {
  const { mobile, clinical, sameJoint }: IProps = props;
  const first: ClinicalAxis = mobile[0]!;
  const second: ClinicalAxis | undefined = mobile[1];
  const unitRoundoff: number = Number.EPSILON / 2;
  const gamma: number = (4 * unitRoundoff) / (1 - 4 * unitRoundoff);
  const queryStorage: ReturnType<typeof createStorage> = createStorage();
  return (
    local: IAutoMovieQuaternion,
    reference: IAutoMovieJointPose,
    pairs: readonly number[],
    clamp: ReturnType<typeof prepareJointProjectionClamp>,
    requested: boolean,
  ): IEvaluation => {
    // Four rounded products followed by three additions give gamma(4):
    // Higham, Accuracy and Stability of Numerical Algorithms, section 3.1;
    // https://epubs.siam.org/doi/10.1137/18M1226312 recalls gamma(n).
    // Four least-subnormal units cover gradual-underflow product errors.
    const compose: ReturnType<IProps["composition"]> = props.composition();
    const storage: IWorkspace = queryStorage.acquire();
    try {
      const { joints, scores, buckets }: IWorkspace = storage;
      /** One normalized-score visitor per query, never one per candidate. */
      const normalizedScore: (
        x: number,
        y: number,
        z: number,
        w: number,
        joint: IAutoMovieJointPose,
      ) => number = (
        normalizedX: number,
        normalizedY: number,
        normalizedZ: number,
        normalizedW: number,
        joint: IAutoMovieJointPose,
      ): number => {
        const x: number = local.x * normalizedX;
        const y: number = local.y * normalizedY;
        const z: number = local.z * normalizedZ;
        const w: number = local.w * normalizedW;
        let value: number = 0;
        value += x;
        value += y;
        value += z;
        value += w;
        let magnitude: number = 0;
        magnitude += Math.abs(x);
        magnitude += Math.abs(y);
        magnitude += Math.abs(z);
        magnitude += Math.abs(w);
        const index: number = joints.length;
        joints.push(joint);
        scores.push(
          Math.abs(value),
          (gamma * magnitude) / (1 - gamma) + 4 * Number.MIN_VALUE,
          0,
          -1,
        );
        return index;
      };
      const scoreScalars: (
        x: number,
        y: number,
        z: number,
        w: number,
        joint: IAutoMovieJointPose,
      ) => number = (
        x: number,
        y: number,
        z: number,
        w: number,
        joint: IAutoMovieJointPose,
      ): number => {
        const index: number = readNormalizedQuaternion.fromScalars(
          x,
          y,
          z,
          w,
          normalizedScore,
          joint,
        );
        scores.push(x, y, z, w);
        return index;
      };
      const score: (joint: IAutoMovieJointPose) => number = (
        joint: IAutoMovieJointPose,
      ): number => compose(joint, scoreScalars, joint);
      score(reference);
      buckets.set(reference[first], 0);
      let maximum: number = 0;
      for (let pair: number = 0; pair < pairs.length; pair += 2) {
        const admitted: IAutoMovieJointPose = clamp.candidate(
          first,
          second,
          pairs[pair]!,
          pairs[pair + 1]!,
          clinical,
        );

        // The same admitted coordinates under this query's unchanged target,
        // basis and frame compose the same quaternion, including null/-0.
        // Numeric membership only narrows the scan; sameJoint below still
        // distinguishes signed zeros, every other coordinate and bone.
        const coordinate: number | null = admitted[first];
        const head: number | undefined = buckets.get(coordinate);
        let index: number = head ?? -1;
        let known: number | undefined;
        while (index >= 0) {
          if (sameJoint(joints[index]!, admitted)) {
            known = index;
            break;
          }
          index = scores[index * ScoreField.STRIDE + ScoreField.PREVIOUS]!;
        }
        if (known !== undefined) continue;
        const next: number = score(admitted);
        const offset: number = next * ScoreField.STRIDE;
        for (const axis of mobile) {
          const value: number | null = admitted[axis];
          const coordinate: number = value === null ? clinical(axis, 0) : value;
          const origin: number | null = reference[axis];
          scores[offset + ScoreField.DISTANCE]! +=
            (coordinate - (origin === null ? clinical(axis, 0) : origin)) ** 2;
        }
        scores[offset + ScoreField.PREVIOUS] = head ?? -1;
        buckets.set(coordinate, next);
        if (
          scores[offset + ScoreField.VALUE]! >
          scores[maximum * ScoreField.STRIDE + ScoreField.VALUE]!
        )
          maximum = next;
      }
      let best: number = 0;
      let bestDistance: number = Infinity;
      const maximumOffset: number = maximum * ScoreField.STRIDE;
      const maximumLow: number =
        scores[maximumOffset + ScoreField.VALUE]! -
        scores[maximumOffset + ScoreField.ERROR]!;
      const maximumHigh: number =
        scores[maximumOffset + ScoreField.VALUE]! +
        scores[maximumOffset + ScoreField.ERROR]!;
      for (let candidate: number = 0; candidate < joints.length; candidate++) {
        const offset: number = candidate * ScoreField.STRIDE;
        if (
          scores[offset + ScoreField.VALUE]! +
            scores[offset + ScoreField.ERROR]! >=
            maximumLow &&
          maximumHigh >=
            scores[offset + ScoreField.VALUE]! -
              scores[offset + ScoreField.ERROR]! &&
          scores[offset + ScoreField.DISTANCE]! < bestDistance
        ) {
          best = candidate;
          bestDistance = scores[offset + ScoreField.DISTANCE]!;
        }
      }
      if (!requested) return joints[best]!;
      const offset: number = best * ScoreField.STRIDE;
      return {
        joint: joints[best]!,
        quaternion: {
          x: scores[offset + ScoreField.RAW_X]!,
          y: scores[offset + ScoreField.RAW_Y]!,
          z: scores[offset + ScoreField.RAW_Z]!,
          w: scores[offset + ScoreField.RAW_W]!,
        },
      };
    } finally {
      queryStorage.release(storage);
    }
  };
}

/** Original degree-valued clinical coordinate names. */
type ClinicalAxis = "flexion" | "abduction" | "twist";

/** Fixed rig/scorer dependencies shared by one projector's independent queries. */
interface IProps {
  /** One or two positive-width coordinates, in the original stable order. */
  mobile: readonly ClinicalAxis[];
  /** Original query-owned composition factory with fixed rig arithmetic. */
  composition: ReturnType<typeof jointToQuaternionOnBasis.prepareScalarQueries>;
  /** Original rig-to-clinical conversion owner, including lazy frame admission. */
  clinical: (axis: ClinicalAxis, angle: number) => number;
  /** Exact original bone/F/A/T equality, including null and signed zero. */
  sameJoint: (a: IAutoMovieJointPose, b: IAutoMovieJointPose) => boolean;
}

/** Original joint-only or explicitly requested paired projection output. */
type IEvaluation =
  | IAutoMovieJointPose
  | AutoMovieEngineMotionJointProjection.IProjection;

/** Scores and raw components of each ordered candidate; links use -1 as absent. */
const enum ScoreField {
  /** Absolute normalized actual-target dot. */
  VALUE = 0,
  /** Existing four-product roundoff radius. */
  ERROR = 1,
  /** Squared clinical distance from the unchanged query reference. */
  DISTANCE = 2,
  /** Previous candidate index in this first-coordinate row, or -1. */
  PREVIOUS = 3,
  /** Original unnormalized composition, retained without a quaternion record. */
  RAW_X = 4,
  /** Original raw vector Y component. */
  RAW_Y = 5,
  /** Original raw vector Z component. */
  RAW_Z = 6,
  /** Original raw scalar component. */
  RAW_W = 7,
  /** Fixed cells per candidate, independent of the query's numerical inputs. */
  STRIDE = 8,
}

/** Empty-on-release containers for one active analytic projection. */
interface IWorkspace {
  /** Current admitted joint records, never shared with a nested query. */
  joints: IAutoMovieJointPose[];
  /** Original indexed score/tie/raw quaternion cells. */
  scores: number[];
  /** Original first-coordinate duplicate-chain heads. */
  buckets: Map<number | null, number>;
}

/** Lease primary capacity exclusively and discard temporary nested storage. */
function createStorage(): {
  /** Acquire empty exclusive arrays/map for one synchronous query. */
  acquire(): IWorkspace;
  /** Clear all query references and release any primary lease. */
  release(workspace: IWorkspace): void;
} {
  const primary: IWorkspace = createWorkspace();
  let active: boolean = false;
  return {
    acquire: (): IWorkspace => {
      if (active) return createWorkspace();
      active = true;
      return primary;
    },
    release: (workspace: IWorkspace): void => {
      workspace.joints.length = 0;
      workspace.scores.length = 0;
      workspace.buckets.clear();
      if (workspace === primary) active = false;
    },
  };
}

/** Allocate one unshared set of empty analytic-search containers. */
function createWorkspace(): IWorkspace {
  return { joints: [], scores: [], buckets: new Map<number | null, number>() };
}
