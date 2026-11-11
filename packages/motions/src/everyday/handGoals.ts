import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Arm goals that put hand surfaces on their points, the contact first and
 * the hand's turn as close as the arm allows.
 *
 * A hand goal names a surface, a point and a hand rotation. Each wrist is
 * placed for the asked rotation and the surface is declared as the goal's
 * contact (`AutoMovieMotionHumanArm.goal`), so where the arm cannot turn the
 * hand as asked the posture resolver re-aims the wrist until the surface
 * stays on its point and the rotation gives way.
 *
 * @param body The body.
 * @param posture The posture the arms are added to.
 * @param requests One target per moving hand; a target's `curl` is not read here.
 * @returns The posture with the arm goals set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a hand goal names and which of the contact and the rotation gives way.
 * @evidence contracts/development/implementation.md#principled-implementation The surface is the goal's contact, so the one resolver that fits the arm also keeps the surface on its point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal per request.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No correction pass of its own: the resolver owns the re-aim, so the two cannot disagree.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per request and no posture solve.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArm.goal`, the owner of arm goals built from a hand surface.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function handGoals(
  body: IHumanBody,
  posture: IHumanPosture,
  requests: readonly AutoMovieMotionHumanArm.ISided[],
): IHumanPosture {
  if (requests.length === 0) return posture;
  const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
  for (const r of requests)
    limbs[`${r.side}Arm`] = AutoMovieMotionHumanArm.goal(body, r.side, r);
  return { ...posture, limbs };
}
