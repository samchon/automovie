import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/**
 * Actual solve/strain sweeps sharing one unchanged arm's prepared geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fixes the body/posture/side while world wrist points, rotations, fallback and requested elbow side remain per query.
 * @evidence contracts/development/design.md#principled-representation Uses the existing bend request's goal fields and original candidate/score types, with world metres and rest-relative quaternions unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface solve and strain are both used by saw slope/catch roll selection; grasp selection uses solve alone, with no unused level operation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only chain/collider/neutral preparation is shared; no target, ranking, chosen elbow or strain answer is cached.
 */
export namespace AutoMovieMotionHumanBendPreparation {
  /**
   * Variable fields of the existing bend request, after body/trunk/side are fixed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retains the existing world-metre point, optional rest-relative rotation and explicit fallback preset/shares.
   * @evidence contracts/development/design.md#principled-representation A Pick of the original ISolve owns the same units and closed fallback alternatives without another goal representation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface solve reads every field, while strain retains its existing rule of ignoring fallback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No goal is clamped, widened or changed; source geometry must stay unchanged for the operation's lifetime.
   */
  export type IGoal = Pick<AutoMovieMotionHumanBend.ISolve, "point" | "rotation" | "fallback">;

  /**
   * Two original numerical queries on one fixed body/trunk/side geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation solve returns a world elbow and strain a dimensionless score or Infinity under their original refusal/legality rules.
   * @evidence contracts/development/design.md#principled-representation Both operations consume the existing variable goal and actual elbow point while the prepared owner holds fixed body geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Current catch/tool selectors use both methods; fixed-posture grasp searches use solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface exposes no prepared-chain injection, result flag, tolerance or candidate subset.
   */
  export interface IPrepared {
    /**
     * Run the original legality-first then least-strain sweep for this wrist.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Returns a world-metre elbow; the caller's fallback is used only under the original no-legal-place rule and otherwise the same HumanRefusal is thrown.
     * @evidence contracts/development/implementation.md#principled-implementation of ranks each actual candidate by original overshoot and strain, then applies the unchanged allowed/fallback/refusal policy.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One actual shared-owner sweep precedes the original two policy branches.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original candidate/refinement and exact-zero legality condition remains, with no elbow result reused across wrists.
     * @evidence contracts/development/implementation.md#efficient-algorithms Reuses fixed chain/FK preparation while retaining the original bounded numerical sweep per actual wrist/rotation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body/trunk/side share geometry only; each changed wrist/rotation is independently ranked and solved.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning synchronous search releases its one fixed chain/collider context; each call returns a candidate/fallback point and stores no query result or external handle.
     */
    solve: (goal: IGoal) => IAutoMovieVector3;

    /**
     * Run the original elbow-side-ranked sweep and report its legal strain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The hint is a world-metre elbow side; the result is unitless or Infinity when the original sweep finds no allowed candidate, and fallback is not read.
     * @evidence contracts/development/implementation.md#principled-implementation of passes the existing toward ranking at the exact current shoulder/wrist/hint to the original sweep and reads its unchanged overshoot/strain.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One original side-rank factory and actual sweep precede the same Infinity-or-strain result.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This remains a distinct sweep from solve; its candidate, side band and refinement are never replaced by solve's chosen score.
     * @evidence contracts/development/implementation.md#efficient-algorithms Fixed geometry is reused, while every actual differently ranked sweep retains its original bounded cost.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the unchanged body/trunk/side geometry is shared; every requested wrist/rotation/hint still determines its own rank and result.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fixed synchronous operation owns one geometry reader until release; this method retains no wrist, hint, score, result history or handle.
     */
    strain: (goal: IGoal, bend: IAutoMovieVector3) => number;
  }

  /**
   * Prepare one actual unchanged body/trunk/side for all of its requested sweeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed source geometry and the original hanging-arm reader, with variable solve/strain goals on the returned object.
   * @evidence contracts/development/implementation.md#principled-implementation The existing search owner prepares the real arm chain, colliders and neutral angles once; both methods retain their original distinct ranks and admission/policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared search is shared by the original solve and strain adapters, retaining one numerical sweep owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original exact-zero legality, error text, fallback rule and Infinity result are copied without threshold, candidate or sampling changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms For Q requested sweeps the one chain/FK/neutral preparation replaces Q identical preparations; each actual sweep and its refinements still execute.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller fixes unchanged body/profile/trunk/root/heading/side through its synchronous selector; differing goals and ranks share no solved answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The selector owns one chain/collider/neutral context and releases it on return or throw; no operation FK reader, pose sample history or external handle escapes.
   */
  export function of(
    fixed: Pick<AutoMovieMotionHumanBend.ISolve, "body" | "posture" | "side">,
    hang: Parameters<typeof AutoMovieMotionHumanBendSearch.prepare>[1],
  ): IPrepared {
    const search: ReturnType<typeof AutoMovieMotionHumanBendSearch.prepare> =
      AutoMovieMotionHumanBendSearch.prepare(fixed, hang);
    return {
      solve: (goal: IGoal): IAutoMovieVector3 => {
        const found: AutoMovieMotionHumanBendSearch.ICandidate | string = search(goal,
          (): (candidate: AutoMovieMotionHumanBendSearch.ICandidate) => AutoMovieMotionHumanBendSearch.IScore =>
            (candidate: AutoMovieMotionHumanBendSearch.ICandidate): AutoMovieMotionHumanBendSearch.IScore =>
              ({ overshoot: candidate.overshoot, deviation: candidate.strain }));
        if (typeof found !== "string" && found.overshoot === 0) return found.elbow;
        if (goal.fallback !== undefined)
          return AutoMovieMotionHumanBend.arm(fixed.body, fixed.posture, fixed.side, goal.fallback);
        throw new HumanRefusal({
          kind: "reach", axis: "target", value: fixed.side,
          reason: `AutoMovieMotionHumanBend.solve found no elbow place for the ${fixed.side} hand: ${typeof found === "string" ? found : "every place leaves a joint out of range or the forearm inside the body"}`,
          fix: "move the target to where the arm can bend to it: nearer the shoulder's side and off the body",
        });
      },
      strain: (goal: IGoal, bend: IAutoMovieVector3): number => {
        const found: AutoMovieMotionHumanBendSearch.ICandidate | string = search(goal,
          (chain: Parameters<Parameters<typeof AutoMovieMotionHumanBendSearch.search>[1]>[0]): (candidate: AutoMovieMotionHumanBendSearch.ICandidate) => AutoMovieMotionHumanBendSearch.IScore =>
            AutoMovieMotionHumanBendSearch.toward(chain.shoulder, goal.point, bend));
        return typeof found === "string" || found.overshoot !== 0 ? Infinity : found.strain;
      },
    };
  }
}
