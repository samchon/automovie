import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyPelvifemoral } from "./assertHumanBodyPelvifemoral";
import { assertHumanBodyRigCorrectives } from "./admission/rig/assertHumanBodyRigCorrectives";
import { assertHumanBodyRigCouplings } from "./admission/rig/assertHumanBodyRigCouplings";
import { assertHumanBodyRigJoints } from "./admission/rig/assertHumanBodyRigJoints";
import { assertHumanBodyRigSkin } from "./admission/rig/assertHumanBodyRigSkin";

/**
 * Admit the body's public rig after its skin and endpoint rows are valid.
 *
 * Landmark-defined joints precede their corrective drivers, joint
 * couplings, pelvic rhythm and finally skin weights, as the builder
 * evaluates them. Each stage owns its exact representation checks.
 * A valid public rig remains a kinematic authoring contract rather than
 * a registered internal bone, muscle or contact model.
 */
export function assertHumanBodyRig(basis: IAutoMovieHumanBodyBasis): void {
  const declared = assertHumanBodyRigJoints(basis);
  const joints = assertHumanBodyRigCorrectives(basis);
  assertHumanBodyRigCouplings(basis, joints);
  assertHumanBodyPelvifemoral(basis);
  assertHumanBodyRigSkin(basis, declared);
}
