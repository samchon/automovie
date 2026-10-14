import { blendPoses } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

const rootAt: (x: number) => IAutoMovieTransform = (
  x: number,
): IAutoMovieTransform => ({
  translation: { x, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const axis: (
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  which: "flexion" | "abduction" | "twist",
) => number | null = (
  pose: ReturnType<typeof makePose>,
  bone: AutoMovieHumanoidBone,
  which: "flexion" | "abduction" | "twist",
): number | null =>
  pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone)![
    which
  ];

/**
 * Observe per-axis weighted means, sparse null semantics, joint population/order and root selection in blendPoses. These authored scalar fixtures do not establish equivalence to every historical mergePoses case or byte serialization.
 *
 * Scenarios:
 *
 * 1. A single layer at weight 1 reproduces its own axes exactly; unset axes stay
 *    null.
 * 2. Two equal-weight layers on the same axis average; a 3:1 weighting biases
 *    toward the heavier layer.
 * 3. A null axis in one layer does not dilute the other: each axis is the weighted
 *    mean of only the layers that set it, and an axis no layer sets is null.
 * 4. Disjoint layers combine their joints (order = first appearance) and the root
 *    comes from the rooted layer at the checked X value.
 * 5. An `ownsRoot` layer's root wins even when a later layer is also rooted.
 * 6. With no owning layer the root is the last non-null one (a null-root first
 *    layer does not clear it).
 * 7. An empty layer list is rejected.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blending for identity, equal/biased means, disjoint axes/joints and root-authority twins, then observes scalar/null results, first bone/count/skeleton and root X; an empty list must refuse.
 * @evidence contracts/testing.md#independent-expectations Authored 20/60 values average to 40 or (3*20+60)/4=30, while per-axis missing values must not dilute 20/40. Literal root X values 5/2/7, first bone and skeleton identity are independent expectations; existing tolerances remain and full root object identity is not asserted.
 * @evidence contracts/testing.md#distinguishing-cases Retains single versus equal/biased layers, unset axes, disjoint joints, an explicit owner before a later rooted layer and null-first/no-owner fallback, plus empty input. Multiple root owners, bad weights and ROM admission belong to other boundaries.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all direct blend calls with existing fixture constructors. Private root/axis readers register no extra cases and start no viewer, process or native artifact.
 */
export function test_perform_blend_poses(): void {
  // 1. identity at weight 1
  const identity: IAutoMoviePose = blendPoses([
    {
      pose: makePose([joint("leftUpperArm", { flexion: 30, abduction: 45 })]),
      weight: 1,
    },
  ]);
  TestValidator.predicate(
    "flexion reproduced",
    nclose(axis(identity, "leftUpperArm", "flexion")!, 30),
  );
  TestValidator.predicate(
    "abduction reproduced",
    nclose(axis(identity, "leftUpperArm", "abduction")!, 45),
  );
  TestValidator.equals(
    "unset twist stays null",
    axis(identity, "leftUpperArm", "twist"),
    null,
  );

  // 2. equal average, then a weighted (3:1) mean
  const mean: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("leftUpperArm", { flexion: 20 })]), weight: 1 },
    { pose: makePose([joint("leftUpperArm", { flexion: 60 })]), weight: 1 },
  ]);
  TestValidator.predicate(
    "50/50 averages to 40",
    nclose(axis(mean, "leftUpperArm", "flexion")!, 40),
  );
  const biased: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("leftUpperArm", { flexion: 20 })]), weight: 3 },
    { pose: makePose([joint("leftUpperArm", { flexion: 60 })]), weight: 1 },
  ]);
  TestValidator.predicate(
    "3:1 weighting biases to 30",
    nclose(axis(biased, "leftUpperArm", "flexion")!, 30),
  );

  // 3. a null axis does not dilute the other
  const noDilute: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("leftUpperArm", { flexion: 20 })]), weight: 1 },
    { pose: makePose([joint("leftUpperArm", { abduction: 40 })]), weight: 1 },
  ]);
  TestValidator.predicate(
    "flexion from the only layer that set it",
    nclose(axis(noDilute, "leftUpperArm", "flexion")!, 20),
  );
  TestValidator.predicate(
    "abduction from the only layer that set it",
    nclose(axis(noDilute, "leftUpperArm", "abduction")!, 40),
  );
  TestValidator.equals(
    "twist set by nobody is null",
    axis(noDilute, "leftUpperArm", "twist"),
    null,
  );

  // 4. disjoint union + root from the rooted layer
  const disjoint: IAutoMoviePose = blendPoses([
    {
      pose: makePose([joint("leftUpperLeg", { flexion: 20 })], rootAt(5)),
      weight: 1,
    },
    { pose: makePose([joint("leftUpperArm", { flexion: 30 })]), weight: 1 },
  ]);
  TestValidator.equals("disjoint joints combine", disjoint.joints.length, 2);
  TestValidator.equals(
    "joint order is first appearance",
    disjoint.joints[0]!.bone,
    "leftUpperLeg",
  );
  TestValidator.predicate(
    "leg survives",
    nclose(axis(disjoint, "leftUpperLeg", "flexion")!, 20),
  );
  TestValidator.predicate(
    "arm survives",
    nclose(axis(disjoint, "leftUpperArm", "flexion")!, 30),
  );
  TestValidator.equals(
    "root from the rooted layer",
    namedFacts([
      ["disjointRoot", (): boolean => disjoint.root !== null],
      [
        "ncloseDisjointRoot",
        (): boolean =>
          disjoint.root !== null && nclose(disjoint.root.translation.x, 5),
      ],
    ]),
    { disjointRoot: true, ncloseDisjointRoot: true },
  );
  TestValidator.equals(
    "skeleton from the first layer",
    disjoint.skeleton,
    "skeleton-1",
  );

  // 5. ownsRoot wins over a later rooted layer
  const owned: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("hips")], rootAt(2)), weight: 1, ownsRoot: true },
    { pose: makePose([joint("chest")], rootAt(9)), weight: 1 },
  ]);
  TestValidator.equals(
    "owning layer's root wins",
    namedFacts([
      ["ownedRoot", (): boolean => owned.root !== null],
      [
        "ncloseOwnedRoot",
        (): boolean =>
          owned.root !== null && nclose(owned.root.translation.x, 2),
      ],
    ]),
    { ownedRoot: true, ncloseOwnedRoot: true },
  );

  // 6. no owning layer → last non-null root (null-first does not clear it)
  const lastRoot: IAutoMoviePose = blendPoses([
    { pose: makePose([joint("hips")]), weight: 1 },
    { pose: makePose([joint("chest")], rootAt(7)), weight: 1 },
  ]);
  TestValidator.equals(
    "last non-null root wins",
    namedFacts([
      ["lastRootRoot", (): boolean => lastRoot.root !== null],
      [
        "ncloseLastRootRoot",
        (): boolean =>
          lastRoot.root !== null && nclose(lastRoot.root.translation.x, 7),
      ],
    ]),
    { lastRootRoot: true, ncloseLastRootRoot: true },
  );

  // 7. empty rejected
  TestValidator.predicate(
    "empty layer list rejected",
    throwsError(
      (): IAutoMoviePose => blendPoses([]),
      "blend poses must not be empty",
    ),
  );
}
