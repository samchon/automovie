import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The joint reference for a hand laid on a region, from an actual arm fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the measured joint values, their source and the forearm margin.
 * @evidence contracts/development/design.md#principled-representation An unreferred fit supplies upper/lower joint angles and the source body's forearm limits determine its bounded reference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface TouchLaid retains the existing public entry and the drinking search consumes the bounded reference of its already fitted candidate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reference comes from the actual fitted arm and uses the same forearm margin.
 */
export namespace HumanTouchArmReference {
  /**
   * The reference of an arm goal: the arm the posture resolver solves for
   * it on a posture, its forearm twist kept `MARGIN` degrees inside the
   * forearm's range. `laid` reads it for the arm laid on a region, and a
   * touch that keeps a held tool's rotation reads it for that arm.
   *
   * @param body The body.
   * @param posture The posture the goal is solved on.
   * @param side The arm.
   * @param goal The arm's goal.
   * @param source Optional same-body FK metadata borrowed by the posture solve.
   * @param projection Optional genuine same-body ROM metadata borrowed by the posture solve.
   * @param fitted Optional: the pose of this posture with a goal of this arm fitted, from a caller that holds the posture's pose without the arm and fits the arm alone on it where that equals the posture's own solve (`AutoMovieMotionHumanDrinkingArm.read`); absent, the posture is solved here.
   * @returns The reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, the margin, who reads it and what a lent fit replaces.
   * @evidence contracts/development/implementation.md#principled-implementation Solved by the posture resolver itself, so the reference is an arm the fit can return; its forearm twist is then kept `MARGIN` inside the forearm's range, since a reference at a range's end asks the fit to hold the joint at its limit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture solve, one read and one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A forearm whose range is narrower than twice the margin keeps the solved twist.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the posture resolver and reference reading; a synchronous parent may lend same-body FK/genuine ROM metadata to this actual complete fit, without retaining or substituting its solution.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per call, or the caller's one arm fit on the pose it already holds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function reference(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    goal: IAutoMovieHumanLimbGoal,
    source?: Parameters<typeof resolveHumanPosture.seeded>[4],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    fitted?: (
      goal: IAutoMovieHumanLimbGoal,
    ) => Parameters<typeof resolveHumanPosture.reference>[0],
  ): NonNullable<IAutoMovieHumanLimbGoal["reference"]> {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const solved: IAutoMovieHumanLimbReference = resolveHumanPosture.reference(
      fitted !== undefined
        ? fitted(goal)
        : resolveHumanPosture.seeded(
            body,
            {
              ...posture,
              limbs: { ...posture.limbs, [limb]: goal },
            },
            undefined,
            undefined,
            source,
            undefined,
            projection,
          ).pose,
      limb,
    );

    return boundedReference(body, side, solved);
  }

  /** Apply the laid arm's forearm twist margin to its actual solved joint angles. */
  export function boundedReference(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    solved: IAutoMovieHumanLimbReference,
  ): IAutoMovieHumanLimbReference {
    // A law does not ask a joint at the end of its range: the forearm's
    // twist is kept `MARGIN` degrees inside the forearm's own range.
    const range: IAutoMovieAngleRange | null =
      getConstraint(
        `${side}LowerArm`,
        readHumanBone(body, `${side}LowerArm`)?.constraint ?? null,
      )?.twist ?? null;
    if (range === null || range.max - range.min <= 2 * MARGIN) return solved;
    return {
      ...solved,
      lower: [
        solved.lower[0],
        solved.lower[1],
        Math.min(
          range.max - MARGIN,
          Math.max(range.min + MARGIN, solved.lower[2]),
        ),
      ],
    };
  }

  /** How far inside the forearm's twist range a laid arm's reference keeps it, degrees (provisional). */
  export const MARGIN: number = 5;
}
