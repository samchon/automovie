import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { assertHumanBodyPelvifemoral } from "./admission/rig/assertHumanBodyPelvifemoral";
import { assertHumanBodyRigCorrectives } from "./admission/rig/assertHumanBodyRigCorrectives";
import { assertHumanBodyRigCouplings } from "./admission/rig/assertHumanBodyRigCouplings";
import { assertHumanBodyRigJoints } from "./admission/rig/assertHumanBodyRigJoints";
import { assertHumanBodyRigSkin } from "./admission/rig/assertHumanBodyRigSkin";
import { assertHumanBodySourceReferenceGoals } from "./admission/rig/assertHumanBodySourceReferenceGoals";
import { assertHumanBodyToeRays } from "./admission/rig/assertHumanBodyToeRays";

/**
 * Admit the body's public rig after its skin and endpoint rows are valid.
 *
 * Landmark-defined joints precede their corrective drivers, joint couplings, pelvic rhythm, source-reference independence, skin weights and toe-ray/split admission. Each stage owns its exact representation checks. A valid public rig remains a kinematic authoring contract rather than a registered internal bone, muscle or contact model.
 *
 * @evidence contracts/common.md#principled-implementation Admitted joints precede corrective reach, coupling, rhythm, independent reference, skin influences and toe splits so every stage reads validated structural dependencies.
 * @evidence contracts/common.md#clear-and-simple-design One rig admission boundary coordinates existing specialized guards while final FK and internal anatomy retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid public kinematic contract cannot stand in for registered internal bone/tissue geometry or contact validation.
 * @evidence contracts/common.md#meaningful-documentation The prose gives prerequisite source admission, guard order and kinematic-versus-anatomical scope.
 * @evidence contracts/performance.md#efficient-algorithms Joint/frame admission, corrective kernel pairs, curve scans and per-vertex four-slot skin checks dominate; the coordinator adds only constant sequencing work.
 * @evidence contracts/performance.md#reuse-equivalent-work Declared bones feed skin validation and the corrective stage's joint map feeds coupling checks without rebuilding those populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Joint maps and declared sets are local to synchronous admission, acquiring no posed output, cache or worker lifetime.
 */
export function assertHumanBodyRig(basis: IAutoMovieHumanBodyBasis): void {
  const declared: ReturnType<typeof assertHumanBodyRigJoints> =
    assertHumanBodyRigJoints(basis);
  const joints: ReturnType<typeof assertHumanBodyRigCorrectives> =
    assertHumanBodyRigCorrectives(basis);
  assertHumanBodyRigCouplings(basis, joints);
  assertHumanBodyPelvifemoral(basis);
  assertHumanBodySourceReferenceGoals(basis);
  assertHumanBodyRigSkin(basis, declared);
  assertHumanBodyToeRays(basis);
}
