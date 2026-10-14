import { reachableBoneNames } from "../../../../packages/engine/src/kinematics/reachableBoneNames";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { makePose } from "../internal/makePose";
const rest: { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; } = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * `resolvePose` walks from null-parent roots. When no bone is a root, nothing
 * is walked: the result is an empty array, the load-bearing "partial return"
 * contract graceful consumers (`retargetHumanoidMotion`'s rest-height measure,
 * the FK-reachability gate a validator uses) rely on to report a malformed rig
 * instead of crashing. {@link reachableBoneNames} answers the same "nothing is
 * reachable" without a separate FK pass, and a cyclic parent chain resolves to
 * the same empty result (every member has a non-null parent, so none is entered
 * from a root, and because a bone is reached only through its single parent,
 * the walk cannot recurse infinitely).
 *
 * Scenario A (rootless): `spine`→`hips` and `chest`→`spine`, but no `hips`
 * root. Scenario B (cycle): `spine`→`chest` and `chest`→`spine`.
 */
/**
 * @evidence contracts/testing.md#behavioral-verification Resolves and indexes rootless and cyclic parent graphs, asserting empty outputs rather than a crash or fabricated pose; entering an unreachable component or infinitely traversing a cycle fails.
 * @evidence contracts/testing.md#independent-expectations Every declared bone has a nonnull parent and neither fixture has an entry root, so the root-seeded traversal reaches no bones. Literal zero cardinality is independent of both product traversals, whose agreement alone would be a weaker oracle.
 * @evidence contracts/testing.md#distinguishing-cases Keeps unresolved-parent rootlessness and a two-node cycle; valid complete hierarchies and a valid-root-plus-orphan mixture are owned by resolve_rest/resolve_orphan. This checks partial-return semantics, not validation acceptance of malformed rigs.
 * @evidence contracts/testing.md#execution-ownership This discoverable exported CPU entry directly invokes FK and reachability source on local malformed records, without an external graph service, process or graphical host.
 */
export function test_kinematics_resolve_rootless(): void {
  const rootless: IAutoMovieSkeleton = {
    id: "rootless",
    bones: [
      { bone: "spine", parent: "hips", rest, constraint: null },
      { bone: "chest", parent: "spine", rest, constraint: null },
    ],
  };
  TestValidator.equals(
    "rootless skeleton resolves to nothing",
    resolvePose(makePose([]), rootless).length,
    0,
  );
  TestValidator.equals(
    "reachableBoneNames agrees: nothing reachable",
    reachableBoneNames(rootless).size,
    0,
  );

  const cyclic: IAutoMovieSkeleton = {
    id: "cyclic",
    bones: [
      { bone: "spine", parent: "chest", rest, constraint: null },
      { bone: "chest", parent: "spine", rest, constraint: null },
    ],
  };
  TestValidator.equals(
    "cyclic parent chain resolves to nothing (never enters from a root)",
    resolvePose(makePose([]), cyclic).length,
    0,
  );
  TestValidator.equals(
    "cyclic chain reaches nothing",
    reachableBoneNames(cyclic).size,
    0,
  );
}
