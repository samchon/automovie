import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * A prepared hinge source supplies independent exact geometry for each target
 * without replacing the target by its reachable-shell endpoint.
 *
 * Scenarios:
 * 1. Two unit links have span squared 2+2cos(theta). Distances sqrt(2)
 *    and 1 therefore require the ordered branches +/-pi/2 and +/-2pi/3.
 *    Every tested swivel reaches its own target under a nonidentity root frame.
 * 2. Holding the hinge at pi/3 fixes span sqrt(3); toward distance sqrt(2)
 *    its shortfall is sqrt(3)-sqrt(2). Distance 3 straightens the links
 *    at span 2 and reports shortfall 1, preserving the original asked point.
 * 3. A target at the root and a hinge parallel to both links remain
 *    degenerate when queried through the prepared geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines radian hinge versus degree swivel units, rooted metre geometry, independent target lifetimes, shell residual and three geometric scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Runs actual prepared target branches and pose readers, reconstructs the resulting two-link endpoint, and checks independent law-of-cosines roots, exact contact, bounded-shell endpoint/shortfall and unchanged asked targets.
 * @evidence contracts/development/testing.md#independent-expectations Equal unit links give d squared=2+2cos(theta), independently fixing +/-pi/2 and +/-2pi/3, a pi/3 shell radius sqrt(3), straight radius2 and far residual1. Forward composition is used only to observe the achieved endpoint against these separately defined points, never as an expected solver output.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers alternating independent targets, both bend branches, nonidentity root orientation/translation, four swivel angles, exact fixed range, far shell, root target and parallel hinge. Search/scoring/clinical ROM policy remains with articulation and full-chain tests.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit owns the fixed source and unchanged target records. It starts no Human producer, process, renderer or compiler, replaces no method and changes no existing range or acceptance bound.
 */
export function test_kinematics_prepared_hinged_geometry(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const source: Omit<IAutoMovieHingedChainGeometry, "target" | "range"> = {
    upper: { worldPosition: { x: 2, y: 3, z: 4 },
      worldRotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 } },
    midOffset: { x: 1, y: 0, z: 0 }, midRest: identity,
    endOffset: { x: 1, y: 0, z: 0 }, hinge: { x: 0, y: 0, z: 1 },
  };
  const prepared: hingedArmSwivel.IPrepared = hingedArmSwivel.prepare(source);
  const a: IAutoMovieVector3 = { x: 2 + Math.SQRT2, y: 3, z: 4 };
  const b: IAutoMovieVector3 = { x: 2, y: 4, z: 4 };
  const first: hingedArmSwivel.IPreparedTarget = prepared.target(a);
  const second: hingedArmSwivel.IPreparedTarget = prepared.target(b);
  for (const [target, point, theta] of [
    [first, a, Math.PI / 2], [second, b, 2 * Math.PI / 3], [first, a, Math.PI / 2],
  ] as const) {
    const branches: IAutoMovieHingedArmSwivel.IStop[] | null = target.branches();
    TestValidator.predicate("law-of-cosines branches retain independent target distance",
      branches !== null && branches.length === 2 &&
      nclose(branches[0]!.theta, theta, 1e-12) &&
      nclose(branches[1]!.theta, -theta, 1e-12) &&
      branches.every((branch: IAutoMovieHingedArmSwivel.IStop): boolean => nclose(branch.shortfall, 0, 1e-12)),
    );
    if (branches === null) continue;
    for (const branch of branches) {
      const pose: ReturnType<typeof hingedArmSwivel.pose> = target.pose(branch.theta);
      for (const swivel of [0, 37, -80, 180])
        TestValidator.predicate("every swivel of either branch reaches its own target",
          vclose(endpoint(source, pose(swivel)), point, 1e-12),
        );
    }
  }

  const stopped: hingedArmSwivel.IPreparedTarget = prepared.target(a, { min: Math.PI / 3, max: Math.PI / 3 });
  const limits: IAutoMovieHingedArmSwivel.IStop[] | null = stopped.branches();
  TestValidator.predicate("fixed hinge reports the actual shell and its residual",
    limits !== null && limits.length === 2 && limits.every((branch: IAutoMovieHingedArmSwivel.IStop): boolean =>
      nclose(branch.theta, Math.PI / 3, 1e-12) &&
      nclose(branch.shortfall, Math.sqrt(3) - Math.SQRT2, 1e-12) &&
      vclose(endpoint(source, stopped.pose(branch.theta)(29)),
        { x: 2 + Math.sqrt(3), y: 3, z: 4 }, 1e-12)),
  );
  const farPoint: IAutoMovieVector3 = { x: 5, y: 3, z: 4 };
  const far: hingedArmSwivel.IPreparedTarget = prepared.target(farPoint);
  const extended: IAutoMovieHingedArmSwivel.IStop[] | null = far.branches();
  TestValidator.predicate("far demand stays original while pose lands on the shell",
    extended !== null && extended.every((branch: IAutoMovieHingedArmSwivel.IStop): boolean =>
      nclose(branch.theta, 0, 1e-12) && nclose(branch.shortfall, 1, 1e-12) &&
      vclose(endpoint(source, far.pose(branch.theta)(-15)), { x: 4, y: 3, z: 4 }, 1e-12)) &&
      vclose(farPoint, { x: 5, y: 3, z: 4 }, 0),
  );
  TestValidator.equals("prepared root target retains degenerate refusal",
    prepared.target({ ...source.upper.worldPosition }).branches(), null,
  );
  TestValidator.equals("prepared parallel hinge retains degenerate refusal",
    hingedArmSwivel.prepare({ ...source, hinge: { x: 1, y: 0, z: 0 } }).target(a).branches(), null,
  );
}

/** Reconstruct the actual two-link endpoint from returned local articulations. */
function endpoint(source: Omit<IAutoMovieHingedChainGeometry, "target" | "range">,
  pose: { upper: IAutoMovieQuaternion; lower: IAutoMovieQuaternion }): IAutoMovieVector3 {
  const upper: IAutoMovieQuaternion = Quaternion.multiply(source.upper.worldRotation, pose.upper);
  const lower: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.multiply(upper, source.midRest), pose.lower);
  return Vector3.add(Vector3.add(source.upper.worldPosition,
    Quaternion.rotateVector(upper, source.midOffset)), Quaternion.rotateVector(lower, source.endOffset));
}
