import { mergePoses } from "@automovie/engine";
import {
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../../../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../../../internal/predicates";

const rootAt: (x: number) => IAutoMovieTransform = (
  x: number,
): IAutoMovieTransform => ({
  translation: { x, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const flexionOf: (
  pose: ReturnType<typeof makePose>,
  bone: Parameters<typeof joint>[0],
) => number = (
  pose: ReturnType<typeof makePose>,
  bone: Parameters<typeof joint>[0],
): number =>
  pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone)!
    .flexion!;

/**
 * Observe ordered pose composition through mergePoses: disjoint joints survive, repeated bones and non-null roots use the later owner, and empty input rejects the absent base pose.
 *
 * Scenarios:
 *
 * 1. Disjoint leg 20/arm 30 produce two joints, keep root X 5 through a later null root and retain skeleton-1.
 * 2. A repeated spine produces one joint with later flexion 50 rather than 10.
 * 3. Later non-null root X 9 replaces X 2; the final empty-input assertion requires the documented error.
 */
export function test_unit_engine_perform_merge_poses(): void {
  // 1. disjoint join, root from the rooted (covers root non-null and null)
  const merged: IAutoMoviePose = mergePoses([
    makePose([joint("leftUpperLeg", { flexion: 20 })], rootAt(5)),
    makePose([joint("leftUpperArm", { flexion: 30 })]),
  ]);
  TestValidator.equals("disjoint joints combine", merged.joints.length, 2);
  TestValidator.predicate(
    "the leg's flexion survives",
    nclose(flexionOf(merged, "leftUpperLeg"), 20),
  );
  TestValidator.predicate(
    "the arm's flexion survives",
    nclose(flexionOf(merged, "leftUpperArm"), 30),
  );
  TestValidator.equals(
    "root taken from the rooted pose, not cleared by the null one",
    namedFacts([
      ["mergedRoot", (): boolean => merged.root !== null],
      [
        "ncloseMergedRoot",
        (): boolean =>
          merged.root !== null && nclose(merged.root.translation.x, 5),
      ],
    ]),
    { mergedRoot: true, ncloseMergedRoot: true },
  );
  TestValidator.equals(
    "skeleton from the first pose",
    merged.skeleton,
    "skeleton-1",
  );

  // 2. same bone → later wins
  const overridden: IAutoMoviePose = mergePoses([
    makePose([joint("spine", { flexion: 10 })]),
    makePose([joint("spine", { flexion: 50 })]),
  ]);
  TestValidator.equals(
    "same-bone merge keeps one joint",
    overridden.joints.length,
    1,
  );
  TestValidator.predicate(
    "the later joint wins",
    nclose(flexionOf(overridden, "spine"), 50),
  );

  // 3. two roots → last wins
  const twoRoots: IAutoMoviePose = mergePoses([
    makePose([joint("hips")], rootAt(2)),
    makePose([joint("chest")], rootAt(9)),
  ]);
  TestValidator.equals(
    "the last non-null root wins",
    namedFacts([
      ["twoRootsRoot", (): boolean => twoRoots.root !== null],
      [
        "ncloseTwoRootsRoot",
        (): boolean =>
          twoRoots.root !== null && nclose(twoRoots.root.translation.x, 9),
      ],
    ]),
    { twoRootsRoot: true, ncloseTwoRootsRoot: true },
  );

  TestValidator.predicate(
    "empty pose merge rejects missing base pose",
    throwsError(
      (): IAutoMoviePose => mergePoses([]),
      "merge poses must not be empty",
    ),
  );
}
