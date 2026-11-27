import type { AutoMovieArchetype } from "../../core";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { PrepareQuadrupedPose } from "./PrepareQuadrupedPose";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";

/**
 * Prepare one animal for shared solved-world-chain pose emission.
 *
 * @param animal Source geometry and original contact identities; never changed.
 * @param parts Carrier of every non-bone part.
 * @param contacts Carrier of every source affordance.
 * @returns Reusable root/axial preview, exact non-limb floor support and
 *   complete-limb sampling.
 * @throws {RangeError} For invalid models, non-rigid frames, incomplete
 *   carriers, broken neutral chains or a current solved chain the source cannot
 *   close.
 */
export function QuadrupedPose<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
): QuadrupedPosePlan.IPrepared<Id, Dimension> {
  return PrepareQuadrupedPose.ordinary(animal, parts, contacts);
}
