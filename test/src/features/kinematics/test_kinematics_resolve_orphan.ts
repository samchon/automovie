import { IAutoMovieTransform, AutoMovieHumanoidBone, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "../../../../packages/engine/src/kinematics/IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "../../../../packages/engine/src/kinematics/indexSkeletonTopology";
import { reachableBoneNames } from "../../../../packages/engine/src/kinematics/reachableBoneNames";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { TestValidator } from "@nestia/e2e";
import { makePose } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";
const rest: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * The core #730 scenario: a skeleton with a real root and a reachable sub-tree,
 * plus ONE orphaned bone whose parent names a bone absent from the skeleton.
 * `resolvePose` resolves the reachable bones and **omits the orphan** (the
 * partial-return contract), so a consumer that reads a specific bone must gate
 * on {@link reachableBoneNames} to notice the orphan rather than trusting the
 * `skeleton.bones` declared set. This pins that the reachable-set query and the
 * FK walk agree exactly on which bones are present.
 *
 * `hips`(root)→`spine`→`chest` are reachable; `leftHand`→`leftLowerArm` is
 * orphaned (`leftLowerArm` is not declared).
  *
 * @evidence contracts/testing.md#behavioral-verification Exercises topology indexing, reachableBoneNames and resolvePose, asserting root-only reachability, snapshot behavior and a named duplicate-bone refusal before recursion.
 * @evidence contracts/testing.md#independent-expectations Declared parent links independently imply exactly chest, hips and spine are reachable; mutation adds spine only to a rebuilt topology, and repeated hips violates unique identity.
 * @evidence contracts/testing.md#distinguishing-cases Covers orphaned and fully reachable skeletons, explicit versus rebuilt topology, caller mutation and a duplicate identity cycle; rootless/cycle tests own detached hierarchies.
 * @evidence contracts/testing.md#execution-ownership The exported kinematics entry owns all local hierarchy cases and directly reaches CPU source without native build, installed consumer or real host.
 */
export function test_kinematics_resolve_orphan(): void {
  const skeleton: IAutoMovieSkeleton = {
    id: "orphan",
    bones: [
      { bone: "hips", parent: null, rest, constraint: null },
      { bone: "spine", parent: "hips", rest, constraint: null },
      { bone: "chest", parent: "spine", rest, constraint: null },
      { bone: "leftHand", parent: "leftLowerArm", rest, constraint: null },
    ],
  };

  const resolved: AutoMovieHumanoidBone[] = resolvePose(makePose([]), skeleton)
    .map((r: IAutoMovieResolvedBone): AutoMovieHumanoidBone => r.bone)
    .sort((a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): number => a.localeCompare(b));
  TestValidator.equals(
    "resolvePose returns exactly the root-anchored sub-tree, omitting the orphan",
    resolved,
    ["chest", "hips", "spine"],
  );

  const reachable: Set<AutoMovieHumanoidBone> = reachableBoneNames(skeleton);
  TestValidator.equals(
    "reachableBoneNames agrees with the FK walk, bone-for-bone",
    [...reachable].sort((a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): number => a.localeCompare(b)),
    ["chest", "hips", "spine"],
  );
  TestValidator.predicate(
    "the orphan is absent from the reachable set (a validator would flag it)",
    !reachable.has("leftHand"),
  );

  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton);
  const resolvedFromTopology: AutoMovieHumanoidBone[] = resolvePose(
    makePose([]),
    skeleton,
    undefined,
    undefined,
    topology,
  )
    .map((r: IAutoMovieResolvedBone): AutoMovieHumanoidBone => r.bone)
    .sort((a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): number => a.localeCompare(b));
  TestValidator.equals(
    "explicit topology drives the same FK walk as the default path",
    resolvedFromTopology,
    resolved,
  );
  TestValidator.equals(
    "reachableBoneNames can reuse the same topology source as resolvePose",
    [...reachableBoneNames(skeleton, topology)].sort((a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): number =>
      a.localeCompare(b),
    ),
    resolved,
  );

  const mutable: IAutoMovieSkeleton = {
    id: "mutable",
    bones: [{ bone: "hips", parent: null, rest, constraint: null }],
  };
  const oldTopology: IAutoMovieSkeletonTopology = indexSkeletonTopology(mutable);
  mutable.bones.push({ bone: "spine", parent: "hips", rest, constraint: null });
  TestValidator.equals(
    "default resolvePose rebuilds topology after skeleton mutation",
    resolvePose(makePose([]), mutable)
      .map((r: IAutoMovieResolvedBone): AutoMovieHumanoidBone => r.bone)
      .sort((a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): number => a.localeCompare(b)),
    ["hips", "spine"],
  );
  TestValidator.equals(
    "an explicit topology is a caller-owned snapshot for repeated FK work",
    resolvePose(makePose([]), mutable, undefined, undefined, oldTopology).map(
      (r: IAutoMovieResolvedBone): AutoMovieHumanoidBone => r.bone,
    ),
    ["hips"],
  );

  // A fully-reachable skeleton resolves every bone (regression guard).
  const wellFormed: IAutoMovieSkeleton = {
    id: "well-formed",
    bones: [
      { bone: "hips", parent: null, rest, constraint: null },
      { bone: "spine", parent: "hips", rest, constraint: null },
    ],
  };
  TestValidator.equals(
    "well-formed skeleton resolves every bone",
    resolvePose(makePose([]), wellFormed).length,
    2,
  );
  const duplicated: IAutoMovieSkeleton = {
    id: "duplicate-name",
    bones: [
      { bone: "hips", parent: null, rest, constraint: null },
      { bone: "hips", parent: "hips", rest, constraint: null },
    ],
  };
  TestValidator.predicate(
    "ambiguous identities refuse before recursive topology traversal",
    throwsError((): IAutoMovieSkeletonTopology => indexSkeletonTopology(duplicated), 'duplicate bone "hips"'),
  );
}
