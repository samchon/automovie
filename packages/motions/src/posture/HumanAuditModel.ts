import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";

/**
 * What the tangle and partner audits read a body by, as one provider every
 * consumer that keeps a limb clear reads too: the arm planner, the per-read
 * limb and digit fits, the course of a limb's swivel and the audit itself. The
 * probes, their reference depths and the related pairs stay the tangle model's
 * (`AutoMovieMotionHumanAuditTangleModel`); this owner places them with the
 * shapes they are read against and states the one depth a probe may lie past
 * its reference, so no consumer judges a narrower body or a different bound
 * than the take is judged by.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is provided, who reads it and which owner the probes stay with.
 * @evidence contracts/development/design.md#principled-representation The tangle model's own parts, placed on posed bones, beside another body's segments and external shapes, in world metres; one allowance in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The allowance and one placement, the two things every clearance consumer needs from the audit's model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No probe, reference or pair rule is restated: each is the tangle model's.
 */
export namespace HumanAuditModel {
  /**
   * How far past its reference depth a probe may lie in a shape, metres: the
   * audit's skin (`AutoMovieMotionHumanAuditSkin.BUILT`) less the arm solver's
   * own tolerance (`HumanArmTrajectoryTerms.DEPTH`), so what a consumer admits
   * the audit admits.
   */
  export const ALLOWANCE: number = HumanArmTrajectoryTerms.DEPTH;

  /**
   * A body placed as the audit reads it, beside what else it is read against.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The tangle model, its parts placed in profile order, each part's probes in world metres, and the other segments.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a clearance consumer reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The parts and probes are the model's own, in its order.
   */
  export interface IFrame {
    /** The body's tangle model. */
    model: M.IModel;

    /** The body's segments placed, in the model's part order. */
    placed: IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Each part's probes in world metres, in the model's part and probe order:
     * its colliders' corners, then the points along its bone; the hand group's
     * digits are parts of their own.
     */
    probes: IAutoMovieVector3[][];

    /**
     * Another body's segments the body is read against, a partner's; none when
     * absent.
     */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /**
     * Segments no human body carries the body is read against, a prop's, a
     * carrier's or an animal's; none when absent.
     */
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }

  /**
   * A body placed as the audit reads it.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param others Another body's placed segments it is read against.
   * @param externals Segments no human body carries it is read against, a
   *   carrier's included.
   * @returns The frame.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The single collider placement owner (`HumanColliders.placed`) and the tangle model's probes carried by each placed segment's pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement, one probe transform per part.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every part and probe is placed; none is screened here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the body's probes, once per posed frame its caller reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments; the model is the tangle model's per-body memo.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh placements and points; borrows the others and externals.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    externals: readonly IAutoMovieMotionHumanColliders.IExternal[] = [],
  ): IFrame {
    const model: M.IModel = M.model(body);
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return {
      model,
      placed,
      probes: placed.map(
        (
          segment: IAutoMovieMotionHumanColliders.IPlaced,
          i: number,
        ): IAutoMovieVector3[] =>
          model.parts[i]!.probes.map(
            (probe: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.add(
                segment.pose.position,
                Quaternion.rotateVector(segment.pose.rotation, probe),
              ),
          ),
      ),
      others,
      externals,
    };
  }
}
