import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { handToFace } from "../daily/handToFace";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Which surfaces a round kick can land on. Its shin arrives across the line
 * from its own side ({@link KickForm.TRAVEL}), so it lands only on a surface
 * that faces that travel. A surface that faces away is the far side of the
 * body, which the leg would have to pass through to reach: measured on a
 * lead (left) round kick staged at the left ribs of a partner who faces the
 * kicker, the foot's capsule was arrested on the near flank 0.105 s before
 * the contact, with the knee still folded 75 degrees.
 *
 * The scene named the surface, so such a kick is refused with the surface it
 * can land on (the region of the other side, as a sided limb's region is
 * mirrored by {@link handToFace.mirrored}), never moved there: the outcome
 * belongs to whoever decided the scene.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the measurement behind it and why the kick is refused instead of re-aimed.
 * @evidence contracts/development/design.md#principled-representation One admission over the travel and the surface's outward normal, both world unit vectors.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the kick's geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rule reads the surface's normal on the partner as perceived, not the region's name, so a partner turned away is judged as turned.
 */
export namespace KickFacing {
  /**
   * Refuse a round kick aimed at a surface that faces away from its travel.
   *
   * @param side The kicking side.
   * @param at The person and the region aimed at.
   * @param direction The shin's unit travel at contact, world.
   * @param normal The surface's outward unit normal as perceived at the launch, world.
   * @throws {HumanRefusal} When the travel leaves the surface instead of entering it, with the mirrored region as the feasible value when the region is one of a pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every input's frame and the refusal's feasible value.
   * @evidence contracts/development/implementation.md#principled-implementation A weapon enters a surface when its travel opposes the outward normal; a positive projection is travel out of the surface, which only a path through the body gives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is re-aimed or clamped; a midline region has no mirror and is refused with no alternative.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function admit(
    side: "left" | "right",
    at: Extract<AutoMovieMotionTarget, { kind: "person" }>,
    direction: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): void {
    const away: number = Vector3.dot(direction, normal);
    if (!(away > 0)) return;
    const mirror: AutoMovieHumanoidRegion = handToFace.mirrored(
      at.region,
      "left",
    );
    const support: "left" | "right" = side === "left" ? "right" : "left";
    throw new HumanRefusal({
      kind: "reach",
      axis: "at",
      value: at.region,
      feasible: {
        kind: "alternatives",
        values: mirror === at.region ? [] : [mirror],
      },
      reason: `a round kick with the ${side} leg travels across toward the ${support} side, and ${at.subject}'s ${at.region} faces away from that travel (its outward normal lies ${((Math.acos(Math.min(1, away)) * 180) / Math.PI).toFixed(0)} degrees from it), so the leg would meet the near side of the body first`,
      fix: `aim the ${side} leg at the surface on its own side${mirror === at.region ? "" : ` (${mirror})`}, or kick with the other leg`,
    });
  }
}
