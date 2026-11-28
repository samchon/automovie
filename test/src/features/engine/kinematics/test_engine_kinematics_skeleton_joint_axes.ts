import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `skeletonJointAxes(skeleton, jointAxes?)` reads a rig's clinical axes: each
 * bone's own declared axes win over the host table, other bones keep the
 * table's entry.
 *
 * Fixture: hips and spine bones; the host table gives the spine axes A; the
 * hips may declare axes B.
 *
 * Scenarios:
 *
 * 1. No bone declares axes: the host table itself is returned, and without one an
 *    empty table.
 * 2. The hips declare B: a new table with hips B and spine A, the host table
 *    unchanged.
 * 3. The spine declares B over the table's A: spine B.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers an absent host table, the original table, merging missing axes and an explicit bone override.
 * @evidence contracts/development/testing.md#behavioral-verification Calls skeletonJointAxes on a small hips-and-spine rig while varying its declared axes and the supplied table.
 * @evidence contracts/development/testing.md#independent-expectations The host provides the spine axis only when the bone has no declaration. The hips declaration adds its own entry without replacing the host, and a local spine declaration wins over its named default.
 */
export function test_engine_kinematics_skeleton_joint_axes(): void {
  const axes = (x: number): IAutoMovieJointAxes => ({
    flexion: { x, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: x },
  });
  const A: IAutoMovieJointAxes = axes(1);
  const B: IAutoMovieJointAxes = axes(-1);
  const bone = (
    name: "hips" | "spine",
    declared?: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({
    bone: name,
    parent: name === "hips" ? null : "hips",
    rest: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
    ...(declared === undefined ? {} : { axes: declared }),
  });
  const skeleton = (bones: IAutoMovieBone[]): IAutoMovieSkeleton => ({
    id: "rig",
    bones,
  });
  const host = { spine: A };

  // 1.
  TestValidator.predicate(
    "host table",
    AutoMovieEngineKinematics.skeletonJointAxes(skeleton([bone("hips"), bone("spine")]), host) === host,
  );
  // The JSON forms are compared whole: an equality that walks one side's keys
  // would not see a key missing from that side.
  const same = (x: unknown, y: unknown): boolean =>
    JSON.stringify(x) === JSON.stringify(y);
  TestValidator.predicate(
    "empty",
    same(AutoMovieEngineKinematics.skeletonJointAxes(skeleton([bone("hips"), bone("spine")])), {}),
  );

  // 2.
  const merged = AutoMovieEngineKinematics.skeletonJointAxes(
    skeleton([bone("hips", B), bone("spine")]),
    host,
  );
  TestValidator.predicate("merged", same(merged, { spine: A, hips: B }));
  TestValidator.predicate("host kept", same(host, { spine: A }));

  // 3.
  TestValidator.equals(
    "declared wins",
    AutoMovieEngineKinematics.skeletonJointAxes(skeleton([bone("hips"), bone("spine", B)]), host).spine,
    B,
  );
}
