import { AutoMovieHumanRigControls } from "@automovie/human";

import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Canonical anatomical arm ownership for the movie's body/arm adapters.
 * @evidence contracts/common.md#implementation-and-ownership One public-joint predicate recognizes shoulder girdle, arm, wrist carriers and canonical finger segments. Human remains the identity authority; no new bone or rig taxonomy is introduced.
 * @evidence contracts/common.md#authoring-interface Anatomical side is optional for either-arm exclusion. Feet, eyes, unknown names and the opposite side never acquire an arm writer's ownership.
 */
export namespace LabArmAnatomy {
  /**
   * Classify an existing public Human joint by its actual arm region.
   * @evidence contracts/common.md#implementation-and-ownership Canonical Intermediate finger carriers agree with Human's public Joint union. A name must also pass the public joint validator, preventing a prefix or invented suffix from admitting geometry.
   * @evidence contracts/common.md#authoring-interface Omitted side matches either anatomical arm. This classifies ownership only; final pose, source task, WORLD goals and native fitting remain independent checks.
   */
  export function contains(bone: string, side?: MotionAction.Side): boolean {
    if (!AutoMovieHumanRigControls.isJoint(bone)) return false;
    return (side ? [side] : ["left", "right"]).some(
      (candidate: string): boolean =>
        bone.startsWith(candidate) &&
        /^(Shoulder|Scapula|UpperArm|LowerArm|Hand|(?:Thumb|Index|Middle|Ring|Little)(?:Metacarpal|Proximal|Intermediate|Distal))$/u.test(
          bone.slice(candidate.length),
        ),
    );
  }
}
