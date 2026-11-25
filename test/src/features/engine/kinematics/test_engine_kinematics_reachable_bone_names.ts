import { compareCodeUnits, indexSkeletonTopology, reachableBoneNames } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A transform at rest. */
const REST: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** A bone with no authored constraint. */
const bone: (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
): IAutoMovieBone => ({ bone: name, parent, rest: REST, constraint: null });

/** The reachable names, sorted. */
const names: (skeleton: IAutoMovieSkeleton) => string[] = (
  skeleton: IAutoMovieSkeleton,
): string[] => [...reachableBoneNames(skeleton)].sort(compareCodeUnits);

/**
 * `reachableBoneNames` is the set of bones a walk from the null-parent roots
 * reaches.
 *
 * Scenarios:
 *
 * 1. In hips -> spine -> chest with an orphan leftHand whose parent leftLowerArm
 *    is undeclared, the orphan is not reachable.
 * 2. With no root, or with a parent cycle, nothing is reachable.
 * 3. A topology passed in is read instead of the skeleton, so a bone added
 *    afterwards is absent from that snapshot.
 * 4. A bone declared twice is refused by the topology index.
 */
export function test_engine_kinematics_reachable_bone_names(): void {
  TestValidator.equals(
    "an orphan is unreachable",
    names({
      id: "orphan",
      bones: [
        bone("hips", null),
        bone("spine", "hips"),
        bone("chest", "spine"),
        bone("leftHand", "leftLowerArm"),
      ],
    }),
    ["chest", "hips", "spine"],
  );
  TestValidator.equals(
    "no root and a cycle",
    [
      names({
        id: "rootless",
        bones: [bone("spine", "hips"), bone("chest", "spine")],
      }),
      names({
        id: "cycle",
        bones: [bone("spine", "chest"), bone("chest", "spine")],
      }),
    ],
    [[], []],
  );
  const grown: IAutoMovieSkeleton = {
    id: "grown",
    bones: [bone("hips", null)],
  };
  const snapshot = indexSkeletonTopology(grown);
  grown.bones.push(bone("spine", "hips"));
  TestValidator.equals(
    "a snapshot and a fresh read",
    [[...reachableBoneNames(grown, snapshot)], names(grown)],
    [["hips"], ["hips", "spine"]],
  );
  TestValidator.predicate(
    "a repeated bone",
    throwsError(
      () =>
        indexSkeletonTopology({
          id: "twice",
          bones: [bone("hips", null), bone("hips", "hips")],
        }),
      'duplicate bone "hips"',
    ),
  );
}
