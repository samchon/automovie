import { HUMANOID_JOINT_AXES, resolvePose } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations and sums. */
const ROUNDING: number = 1e-12;

/** A rest transform of the given offset. */
const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/** A bone with no authored constraint. */
const bone: (
  name: IAutoMovieBone["bone"],
  parent: IAutoMovieBone["parent"],
  rest: IAutoMovieTransform,
) => IAutoMovieBone = (
  name: IAutoMovieBone["bone"],
  parent: IAutoMovieBone["parent"],
  rest: IAutoMovieTransform,
): IAutoMovieBone => ({ bone: name, parent, rest, constraint: null });

/** Hips at 1 m, a spine 0.5 m above, an upper arm 0.2 m to its side. */
const SKELETON: IAutoMovieSkeleton = {
  id: "skeleton",
  bones: [
    bone("hips", null, restAt(0, 1, 0)),
    bone("spine", "hips", restAt(0, 0.5, 0)),
    bone("leftUpperArm", "spine", restAt(0.2, 0, 0)),
  ],
};

/** The world position of one resolved bone. */
const position: (
  bones: IAutoMovieResolvedBone[],
  name: IAutoMovieBone["bone"],
) => IAutoMovieResolvedBone["worldPosition"] = (
  bones: IAutoMovieResolvedBone[],
  name: IAutoMovieBone["bone"],
): IAutoMovieResolvedBone["worldPosition"] =>
  bones.find((entry: IAutoMovieResolvedBone): boolean => entry.bone === name)!
    .worldPosition;

/** A pose of the skeleton with the given root and joints. */
const pose: (
  root: IAutoMovieTransform | null,
  joints: IAutoMoviePose["joints"],
) => IAutoMoviePose = (
  root: IAutoMovieTransform | null,
  joints: IAutoMoviePose["joints"],
): IAutoMoviePose => ({ skeleton: "skeleton", root, joints });

/**
 * `resolvePose` walks a skeleton from its root, composing each bone's rest
 * offset with its pose rotation, to the world position of every bone.
 *
 * Scenarios:
 *
 * 1. At rest the offsets add: hips (0, 1, 0), spine (0, 1.5, 0), arm (0.2, 1.5,
 *    0).
 * 2. A root translation of (1, 0, 0) shifts every bone by +1 in X.
 * 3. A bone whose parent is undeclared is left out, and a skeleton with no root
 *    resolves to nothing.
 * 4. With the humanoid axis table, 40 degrees of upper-arm flexion is a rotation
 *    about +Y, (0, sin 20, 0, cos 20); without it, about +X.
 * 5. A 90 degree twist of the spine about +Y carries its child's offset (0.2, 0,
 *    0) to (0, 0, -0.2), so the arm sits at (0, 1.5, -0.2).
 */
export function test_engine_kinematics_resolve_pose(): void {
  const rest: IAutoMovieResolvedBone[] = resolvePose(pose(null, []), SKELETON);
  TestValidator.predicate(
    "rest offsets add",
    vclose(position(rest, "hips"), { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(position(rest, "spine"), { x: 0, y: 1.5, z: 0 }, ROUNDING) &&
      vclose(
        position(rest, "leftUpperArm"),
        { x: 0.2, y: 1.5, z: 0 },
        ROUNDING,
      ),
  );
  const shifted: IAutoMovieResolvedBone[] = resolvePose(
    pose(
      {
        translation: { x: 1, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      [],
    ),
    SKELETON,
  );
  TestValidator.predicate(
    "a root translation",
    vclose(position(shifted, "hips"), { x: 1, y: 1, z: 0 }, ROUNDING) &&
      vclose(
        position(shifted, "leftUpperArm"),
        { x: 1.2, y: 1.5, z: 0 },
        ROUNDING,
      ),
  );
  const twisted: IAutoMovieResolvedBone[] = resolvePose(
    pose(null, [{ bone: "spine", flexion: null, abduction: null, twist: 90 }]),
    SKELETON,
  );
  TestValidator.predicate(
    "a parent twist swings its child",
    vclose(
      position(twisted, "leftUpperArm"),
      { x: 0, y: 1.5, z: -0.2 },
      ROUNDING,
    ),
  );
  TestValidator.equals(
    "an orphan and a rootless skeleton",
    [
      resolvePose(pose(null, []), {
        id: "orphan",
        bones: [
          bone("hips", null, restAt(0, 0, 0)),
          bone("leftHand", "leftLowerArm", restAt(0, 0, 0)),
        ],
      }).map((entry: IAutoMovieResolvedBone): string => entry.bone),
      resolvePose(pose(null, []), {
        id: "rootless",
        bones: [bone("spine", "hips", restAt(0, 0, 0))],
      }).length,
    ],
    [["hips"], 0],
  );
  const arm: IAutoMoviePose = pose(null, [
    { bone: "leftUpperArm", flexion: 40, abduction: null, twist: null },
  ]);
  const localOf: (
    axes: typeof HUMANOID_JOINT_AXES | undefined,
  ) => IAutoMovieResolvedBone["localRotation"] = (
    axes: typeof HUMANOID_JOINT_AXES | undefined,
  ): IAutoMovieResolvedBone["localRotation"] =>
    resolvePose(arm, SKELETON, axes).find(
      (entry: IAutoMovieResolvedBone): boolean => entry.bone === "leftUpperArm",
    )!.localRotation;
  TestValidator.predicate(
    "axes about Y with the table, about X without",
    qclose(
      localOf(HUMANOID_JOINT_AXES),
      { x: 0, y: Math.sin(Math.PI / 9), z: 0, w: Math.cos(Math.PI / 9) },
      ROUNDING,
    ) &&
      qclose(
        localOf(undefined),
        { x: Math.sin(Math.PI / 9), y: 0, z: 0, w: Math.cos(Math.PI / 9) },
        ROUNDING,
      ),
  );
}
