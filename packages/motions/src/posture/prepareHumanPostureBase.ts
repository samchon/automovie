import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import type { IHumanPosture } from "./IHumanPosture";
import { assembleHumanPosture } from "./assembleHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanLimbSource } from "./prepareHumanLimbSource";
import { refitHumanPosture } from "./refitHumanPosture";
import type { resolveHumanPosture } from "./resolveHumanPosture";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Snapshot cloneable enumerable own fixed root/orientation/direct joints and
 * digit demands, then assemble that exact snapshot for a synchronous search
 * replacing only complete limb goals. The body, rig and clinical/ROM tables
 * stay unchanged until search release; ordinary seeded keeps live admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed and varying inputs, complete candidate goals, unchanged-body operation and fresh result ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The explicit snapshot-first API assembles exactly its owned fixed authoring, preventing separate getter states from pairing a different turn context with an earlier pose. Direct assembly/clamping is independent of later goals and runs once; each candidate's world turn, attachment order, paired arms, thigh/rival clearance, seeds and digit IK still execute normally.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure assembleHumanPosture owns direct admission/clamping, this operation owns fixed snapshots and one unexposed lazy reader, and existing refit/digit owners retain every actual solve. Explicit incoming readers keep their original current callbacks and independent full issuing.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Accepts no candidate direct joints/root or resolved flag, adds no numerical fit/seed/result cache, and preserves complete original candidate goals, raw root-turn plant refusal and every existing live memory lookup/disabled solve.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed B-bone assembly and ROM projection run once across K candidates. Each candidate copies O(B) fixed pose data and retains the complete actual limb loop, memory lookup and numerical work; no candidate goal is replaced by a separately serialized baseline. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed authoring/digit snapshots and unchanged body prove only direct-coordinate equivalence. The search's actual private reader permits native geometry/COW ownership; an incoming reader supplies no such authority. Every complete goal, attachment, near seed and placed-arm order still enters the original loop; JSON equality never substitutes a fixed request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One search owns its clamped base, fixed authoring/digit snapshot and private lazy reader/source geometry until completion or throw. Explicit incoming FK sources and candidate outputs are not retained; fresh copies isolate the base and existing memory, with no fixed-goal key/result reader.
 */
export function prepareHumanPostureBase(
  body: IHumanBody,
  posture: IHumanPosture,
  base?: IAutoMoviePose,
): prepareHumanPostureBase.IWorkspace {
  const fixed: IHumanPosture = structuredClone({ ...posture, limbs: {} });
  const assembled: ReturnType<typeof assembleHumanPosture> = assembleHumanPosture(body, fixed, base);
  const pose: IAutoMoviePose = structuredClone(assembled.pose);
  const ownedResolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanLimbSource(body);
  return {
    seeded: (
      limbs: IHumanPosture["limbs"],
      near: resolveHumanPosture.INear = {},
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): resolveHumanPosture.ISeeded => {
      const turned: turnHumanPosture.ITurned = turnHumanPosture({ ...fixed, limbs });
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = source === undefined
        ? ownedResolution : prepareHumanPoseResolution(source);
      const fitted: resolveHumanPosture.ISeeded = (source === undefined ? refitHumanPosture : refitHumanPosture.independent)(
        body,
        structuredClone(pose),
        turned.limbs,
        near,
        resolution,
      );
      const result: resolveHumanPosture.ISeeded = {
        ...fitted,
        pose: HumanDigitFit.fitted(body, fitted.pose, fixed.digits, resolution),
      };
      return source === undefined ? result : structuredClone(result);
    },
  };
}

/**
 * A fixed-base candidate operation; numerical goal fitting remains actual.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines operation scope, varying complete goals and continuation inputs.
 * @evidence contracts/development/design.md#principled-representation IWorkspace exposes one seeded function accepting complete limb goals plus the resolver's existing continuation/FK inputs; fixed root/orientation/direct coordinates and digit demands belong to the operation snapshot, and outputs remain the existing canonical seeded record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed-posture grasp candidate/roll searches consume IWorkspace.seeded, with no cache switch, arbitrary pose replacement, extra result type or retained answer exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The workspace cannot assert a candidate is resolved; every call executes the actual limb and digit solvers on fresh protected-base copies.
 */
export namespace prepareHumanPostureBase {
  /**
   * The search-owned complete-goal fitter with no retained candidate output.
   *
   * States complete-goal replacement, actual solve and independent output ownership.
   * Varies full limb-goal records and the existing near/FK inputs while fixed direct coordinates belong to the operation snapshot.
   * One seeded method serves fixed-posture grasp candidate/roll searches without a second result type.
   * No caller-set resolved state, target projection or cached fit answer is represented.
   */
  export interface IWorkspace {
    /** Actual cold/continued solve on a fresh copy of this operation's fixed direct pose. */
    seeded: (
      limbs: IHumanPosture["limbs"],
      near?: resolveHumanPosture.INear,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ) => resolveHumanPosture.ISeeded;
  }
}
