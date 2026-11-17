import { ArmourHelmet } from "./ArmourHelmet";
import { ArmourLimb } from "./ArmourLimb";
import type { ArmourProfile } from "./ArmourProfile";
import { ArmourTorso } from "./ArmourTorso";

/**
 * Emit every actual identifying armour wall from one prepared source profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the complete eight-kind dispatch and independent model-metre closed convex wall output, with source form owners' refusals propagated.
 * @evidence contracts/development/implementation.md#principled-implementation Helmet bowls/openings/brim, torso/shirt cavities and cuff/limb/hand regions each use their shared generating owner; core consumes the resulting actual cells for rendering, mass and collision.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Dispatch by the three geometric families already represented by the public kinds, without adapting geometry in the viewer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No kind returns a filled bounding box, sphere or cylinder, and no default fixture or Human dependency supplies missing geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch overhead; the chosen form owns its bounded linear or angular-lattice population.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All kinds consume the same prepared profile and common actual-cell contract rather than duplicating fit, hull, collider or mass arithmetic.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Transfers fresh cell records from the selected form and retains no input, completed output, model or external handle.
 */
export function ArmourForm(
  profile: ArmourProfile.IProfile,
): readonly ArmourProfile.ICell[] {
  if (profile.kind.endsWith("Helmet")) return ArmourHelmet(profile);
  if (profile.kind === "cuirass" || profile.kind === "mail")
    return ArmourTorso(profile);
  return ArmourLimb(profile);
}
