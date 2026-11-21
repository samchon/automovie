import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountRider } from "./HumanMountRider";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * Close each holding hand's fingers once on the support's own colliders where the hold begins (`HumanMountRider.closed`), for the ride's hands (`HumanRideHands`).
 *
 * A round articulated handle measured to the palm, and any rigid handle, is closed on with its grip read from its own model frame under the support's frame, so the hand meets the rest shapes it closes on even when the support was posed away from rest when the hold began, as a surcingle on a cantering horse is.
 *
 * @param body The body.
 * @param on The support's subject id, for the refusal.
 * @param support The support.
 * @param posture The rider's posture holding, the lean included.
 * @param grips Each holding hand's grip where the hold begins.
 * @param ids Each holding hand's contact id.
 * @param affordances Each holding hand's contact declaration, when published.
 * @param origin The support's frame where the hold begins.
 * @returns Each holding hand's closed finger joints.
 * @throws {HumanRefusal} When the support declares no colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is closed, on which shapes, when the grip is read from the model frame, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The grasp closure on the support's colliders at rest under its frame; a rigid handle's grip is that handle's own model frame under the same frame, so the hand and the shapes describe one rigid grasp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Kept apart from the ride's hands so that owner stays within its size; one refusal check and one closure per hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fingers with nothing to close on are refused rather than left open.
 * @evidence contracts/development/implementation.md#efficient-algorithms One closure solve per holding hand per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The closures are solved once and blended to at every instant.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function closeRideHandGrips(
  body: IAutoMovieMotionHumanBody,
  on: string,
  support: IAutoMovieMotionHumanPropReader,
  posture: IAutoMovieMotionHumanPosture,
  grips: Partial<Record<AutoMovieHumanSide, HumanRideHands.IMaterialGrip>>,
  ids: Partial<Record<AutoMovieHumanSide, string>>,
  affordances: Partial<Record<AutoMovieHumanSide, IAutoMovieAffordance>>,
  origin: IAutoMovieRigidTransform,
): Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>> {
  const closures: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
  > = {};
  for (const side of ["left", "right"] as const) {
    const id: string | undefined = ids[side];
    const grip: HumanRideHands.IMaterialGrip | undefined = grips[side];
    if (id === undefined || grip === undefined) continue;
    if ((support.prop.shapes ?? []).length === 0)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "hands",
        value: id,
        feasible: null,
        reason: `${on} declares no colliders; a hand that holds closes its fingers on them`,
        fix: "give the support the shapes the fingers close on, or leave the hands free",
      });
    const handle: IAutoMovieAffordance | undefined = affordances[side];
    let closureGrip: HumanRideHands.IMaterialGrip = grip;
    if (
      handle !== undefined &&
      (grip.palmDepth !== undefined || handle.kind === "handle")
    ) {
      // Rest shapes and the moving hand describe one rigid grasp: bring the grip back to those shapes before selecting and closing on its material.
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        origin.rotation,
        handle.frame.rotation,
      );
      closureGrip = {
        ...grip,
        point: Vector3.add(
          origin.position,
          Quaternion.rotateVector(origin.rotation, handle.frame.translation),
        ),
        normal: Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
        axis: Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 }),
      };
    }
    closures[side] = HumanMountRider.closed(
      body,
      side,
      posture,
      closureGrip,
      support.prop.shapes!,
      origin,
    );
  }
  return closures;
}
