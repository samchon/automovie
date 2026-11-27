import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** The alternatives of `ReferenceLimb`'s site. */
type ReferenceLimb = "leftArm" | "rightArm";

/** The joint reference for a hand laid on a region, from an actual arm fit. */
export namespace HumanTouchArmReference {
  /**
   * The reference of an arm goal: the arm the posture resolver solves for it on
   * a posture, its forearm twist kept `MARGIN` degrees inside the forearm's
   * range. `laid` reads it for the arm laid on a region, and a touch that keeps
   * a held tool's rotation reads it for that arm.
   *
   * @param body The body.
   * @param posture The posture the goal is solved on.
   * @param side The arm.
   * @param goal The arm's goal.
   * @param source Optional same-body FK metadata borrowed by the posture solve.
   * @param projection Optional genuine same-body ROM metadata borrowed by the
   *   posture solve.
   * @param fitted Optional: the pose of this posture with a goal of this arm
   *   fitted, from a caller that holds the posture's pose without the arm and
   *   fits the arm alone on it where that equals the posture's own solve
   *   (`AutoMovieMotionHumanDrinkingArm.read`); absent, the posture is solved
   *   here.
   * @returns The reference.
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
    ) => Parameters<typeof HumanLimbFit.reference>[0],
  ): NonNullable<IAutoMovieHumanLimbGoal["reference"]> {
    const limb: ReferenceLimb = `${side}Arm`;
    const solved: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
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

  /**
   * Keep the fitted forearm twist inside its anatomical range. All other angles
   * come directly from the selected arm's actual fit, in degrees.
   *
   * @param body Body supplying the chosen side's lower-arm twist constraint.
   * @param side The fitted arm's side.
   * @param solved Upper and lower arm joint angles of the actual unreferred
   *   fit.
   * @returns The original angles for a missing or narrow range, or a reference
   *   with only its forearm twist bounded.
   */
  export function boundedReference(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    solved: IAutoMovieHumanLimbReference,
  ): IAutoMovieHumanLimbReference {
    // A law does not ask a joint at the end of its range: the forearm's
    // twist is kept `MARGIN` degrees inside the forearm's own range.
    const range: IAutoMovieAngleRange | null =
      AutoMovieEngineKinematics.getConstraint(
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

  /**
   * How far inside the forearm's twist range a laid arm's reference keeps it,
   * degrees (provisional).
   */
  export const MARGIN: number = 5;
}
