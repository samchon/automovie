import type { IAutoMoviePose } from "@automovie/interface";
import type { IAutoMovieSeededChainFit } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import { HumanLimbFitMemory } from "./HumanLimbFitMemory";
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
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Accepts no candidate direct joints/root or resolved flag, adds no numerical fit/seed/result cache, and preserves complete original candidate goals, raw root-turn plant refusal and every existing live memory lookup/disabled solve.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed B-bone assembly and ROM projection run once across K candidates. An exactly unchanged uncontinued first world leg additionally prepares its mirror/root-frame/full-pose memory key once, retaining every live lookup/LRU/disabled solve. Each candidate copies O(B) data and retains actual remaining numerical work; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit fixed authoring/digit snapshots and unchanged body prove direct-coordinate equivalence. A first-leg key reader additionally requires exact complete goal scalars, no attachment-order changes, the actual initial placed-arm mask and no leg near seed; it stores no fitted answer and later legs remain ordinary reads.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One search owns its clamped base, fixed authoring/digit/goal snapshots and at most one fixed-key reader until completion or throw; per-call FK sources and outputs are not retained, and fresh copies isolate the protected base and existing memory entries.
 */
export function prepareHumanPostureBase(
  body: IHumanBody,
  posture: IHumanPosture,
  base?: IAutoMoviePose,
): prepareHumanPostureBase.IWorkspace {
  const assembled: ReturnType<typeof assembleHumanPosture> = assembleHumanPosture(body, posture, base);
  const fixed: IHumanPosture = structuredClone({ ...posture, limbs: {} });
  const pose: IAutoMoviePose = structuredClone(assembled.pose);
  const goals: IHumanPosture["limbs"] = structuredClone(assembled.limbs);
  const keys: Partial<Record<Leg, string | undefined>> = {};
  for (const limb of LEGS) if (goals[limb] !== undefined) keys[limb] = goalKey(goals[limb]!);
  let first: { limb: Leg; mask: number; read: ReturnType<typeof HumanLimbFitMemory.prepare> } | undefined;
  return {
    seeded: (
      limbs: IHumanPosture["limbs"],
      near: resolveHumanPosture.INear = {},
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): resolveHumanPosture.ISeeded => {
      const turned: turnHumanPosture.ITurned = turnHumanPosture({ ...fixed, limbs });
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
      const limb: Leg | undefined = turned.limbs.leftLeg !== undefined ? "leftLeg" :
        turned.limbs.rightLeg !== undefined ? "rightLeg" : undefined;
      let prefix: IAutoMovieSeededChainFit | undefined;
      let pending: IHumanPosture["limbs"] = turned.limbs;
      if (limb !== undefined && goals[limb] !== undefined && near[limb] === undefined &&
        keys[limb] !== undefined && keys[limb] === goalKey(turned.limbs[limb]!) &&
        Object.values(turned.limbs).every((goal: IHumanPosture.IGoal | undefined): boolean => goal?.on === undefined)) {
        const mask: number = (turned.limbs.leftArm === undefined ? 1 : 0) +
          (turned.limbs.rightArm === undefined ? 2 : 0);
        if (first === undefined || first.limb !== limb || first.mask !== mask) {
          const placed: ("left" | "right")[] = [];
          if ((mask & 1) !== 0) placed.push("left");
          if ((mask & 2) !== 0) placed.push("right");
          first = { limb, mask, read: HumanLimbFitMemory.prepare(body, pose, limb, goals[limb]!, placed) };
        }
        prefix = structuredClone(first.read(resolution));
        pending = { ...turned.limbs };
        delete pending[limb];
      }
      const fitted: resolveHumanPosture.ISeeded = refitHumanPosture(
        body,
        prefix?.pose ?? structuredClone(pose),
        pending,
        near,
        resolution,
      );
      return {
        ...fitted,
        ...(prefix === undefined || limb === undefined ? {} : {
          seeds: { [limb]: prefix.seed, ...fitted.seeds },
          values: { [limb]: prefix.value, ...fitted.values },
        }),
        pose: HumanDigitFit.fitted(body, fitted.pose, fixed.digits, resolution),
      };
    },
  };
}

/** The original first existing leg in native leg-before-arm order. */
type Leg = "leftLeg" | "rightLeg";

/** Fixed source legs; attached candidates conservatively retain the native complete loop. */
const LEGS: readonly Leg[] = ["leftLeg", "rightLeg"];

/** Exact complete goal equality, preserving signed zero and nonfinite primitive distinctions. */
function goalKey(goal: IHumanPosture.IGoal): string | undefined {
  try {
    return JSON.stringify(goal, (_key: string, value: unknown): unknown => typeof value !== "number"
      ? value : Object.is(value, -0) ? "number:-0" : Number.isFinite(value) ? value : `number:${String(value)}`);
  } catch {
    return undefined;
  }
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
