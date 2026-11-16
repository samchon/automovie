import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import type { IHumanPosture } from "./IHumanPosture";
import { assembleHumanPosture } from "./assembleHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { refitHumanPosture } from "./refitHumanPosture";
import type { resolveHumanPosture } from "./resolveHumanPosture";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Prepare fixed root/orientation/direct joints and digit demands for a
 * synchronous candidate search that replaces only its complete limb goals.
 * The body, rig and clinical/ROM tables stay unchanged until search release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed and varying inputs, complete candidate goals, unchanged-body operation and fresh result ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Direct joint assembly/clamping is independent of later limb goals, so it runs once; each candidate's world turn, attachment order, paired arms, thigh/rival clearance, seeds and digit IK still execute normally.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure assembleHumanPosture owns direct admission/clamping, this operation owns the fixed snapshots and per-candidate pose copy, and the existing refit/digit owners retain every actual solve.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Accepts no candidate direct joints/root or resolved flag, shares no numerical fit/seed/result, and preserves the complete original candidate goals and raw root-turn plant refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed B-bone assembly and actual ROM projection run once for K candidate requests; each candidate copies O(B) canonical data and retains all goal/pair/digit numerical work, without a measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit operation snapshots fixed authoring coordinates and digit demands and borrows unchanged body metadata; only complete limb goals and continuation seeds vary, so changed root/joints/body require another preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One search owns its clamped base, fixed authoring/digit snapshot and optional parent resolution source until completion or throw; returned results copy the protected base and no candidate output or history is retained.
 */
export function prepareHumanPostureBase(
  body: IHumanBody,
  posture: IHumanPosture,
  base?: IAutoMoviePose,
): prepareHumanPostureBase.IWorkspace {
  const assembled: ReturnType<typeof assembleHumanPosture> = assembleHumanPosture(body, posture, base);
  const fixed: IHumanPosture = structuredClone({ ...posture, limbs: {} });
  const pose: IAutoMoviePose = structuredClone(assembled.pose);
  return {
    seeded: (
      limbs: IHumanPosture["limbs"],
      near: resolveHumanPosture.INear = {},
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): resolveHumanPosture.ISeeded => {
      const turned: turnHumanPosture.ITurned = turnHumanPosture({ ...fixed, limbs });
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
      const fitted: resolveHumanPosture.ISeeded = refitHumanPosture(
        body,
        structuredClone(pose),
        turned.limbs,
        near,
        resolution,
      );
      return {
        ...fitted,
        pose: HumanDigitFit.fitted(body, fitted.pose, fixed.digits, resolution),
      };
    },
  };
}

/**
 * A fixed-base candidate operation; numerical goal fitting remains actual.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines operation scope, varying complete goals and continuation inputs.
 * @evidence contracts/development/design.md#principled-representation A single seeded method varies only the inputs not used by fixed direct-joint assembly; its result remains the resolver's existing seeded record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grasp candidate search consumes seeded; no cache switch, arbitrary pose replacement or retained answer is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The workspace cannot assert a candidate is resolved; every call executes the actual limb and digit solvers on fresh protected-base copies.
 */
export namespace prepareHumanPostureBase {
  /**
   * The search-owned complete-goal fitter with no retained candidate output.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States complete-goal replacement, actual solve and independent output ownership.
   * @evidence contracts/development/design.md#principled-representation Varies full limb-goal records and the existing near/FK inputs while fixed direct coordinates belong to the operation snapshot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One seeded method serves fixed-posture grasp candidate/roll searches without a second result type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller-set resolved state, target projection or cached fit answer is represented.
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
