import {
  type IAutoMovieInspectionPath,
  autoMovieInspectionPathOf,
  listAutoMovieInspectionPaths,
  matchAutoMovieInspectionPath,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * An inspection names an object by the names between a root and it, lists
 * every drawn object of a tree under that name, and selects names with a
 * pattern of names, `*` and `**`.
 *
 * Scenarios:
 *
 * 1. In a tree of named and unnamed groups, meshes, a line, points, a sprite,
 *    a light, a bone and a camera, each object's path joins the names below
 *    the root, an unnamed object adds none, the root's own path is empty, a
 *    deeper root shortens the path, and an object outside the root is
 *    refused.
 * 2. The same tree lists its meshes, line, points and sprite in scene order
 *    with their paths and objects, hidden ones included, two meshes sharing
 *    one path listed twice, and no group, light, bone or camera.
 * 3. A bare name matches that name at any depth and everything beneath it, a
 *    pattern with a slash is anchored at the root, `*` stays inside one name,
 *    `**` spans any number of names, punctuation and case are literal, the
 *    empty path is matched by `**` alone and not by a name or by `*`, and an
 *    empty pattern is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the three public path functions on an actual three.js tree and on written paths and reads their returned paths, objects and verdicts.
 * @evidence contracts/development/testing.md#independent-expectations Expected paths are the names the test gave its own objects, expected order is the order it attached them, and expected verdicts follow from the documented pattern rules.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts named against unnamed objects, drawn against undrawn kinds, a bare name against an anchored pattern, `*` against `**`, a literal dot and plus against any character, and each match against a near miss.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own object tree and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: In a tree of named and unnamed groups, meshes, a line, points, a sprite, a light, a bone and a camera).
 */
export function test_viewer_inspection_paths(): void {
  const named = <T extends THREE.Object3D>(object: T, name: string): T => {
    object.name = name;
    return object;
  };
  const world: THREE.Scene = named(new THREE.Scene(), "world");
  const stage: THREE.Group = named(new THREE.Group(), "stage");
  const hero: THREE.Group = named(new THREE.Group(), "hero");
  const torso: THREE.Mesh = named(new THREE.Mesh(), "torso");
  const armA: THREE.Mesh = named(new THREE.Mesh(), "arm.L");
  const armB: THREE.Mesh = named(new THREE.Mesh(), "arm.L");
  const anonymous: THREE.Mesh = new THREE.Mesh();
  const hidden: THREE.Mesh = named(new THREE.Mesh(), "hidden");
  hidden.visible = false;
  const trail: THREE.Line = named(new THREE.Line(), "trail");
  const dust: THREE.Points = named(new THREE.Points(), "dust");
  const tag: THREE.Sprite = named(new THREE.Sprite(), "tag");
  const lamp: THREE.PointLight = named(new THREE.PointLight(), "lamp");
  const bone: THREE.Bone = named(new THREE.Bone(), "bone");
  const lens: THREE.PerspectiveCamera = named(
    new THREE.PerspectiveCamera(),
    "lens",
  );
  const slashed: THREE.Mesh = named(new THREE.Mesh(), "a/b");
  const rootless: THREE.Mesh = new THREE.Mesh();
  torso.add(armA, armB);
  hero.add(torso, anonymous, hidden);
  stage.add(hero);
  world.add(stage, trail, dust, tag, lamp, bone, lens, slashed, rootless);

  // 1. Paths of objects.
  TestValidator.equals(
    "a path joins the names below the root",
    autoMovieInspectionPathOf(world, armA),
    "stage/hero/torso/arm.L",
  );
  TestValidator.equals(
    "an unnamed object adds no name",
    autoMovieInspectionPathOf(world, anonymous),
    "stage/hero",
  );
  TestValidator.equals(
    "an unnamed object under the root has the empty path",
    autoMovieInspectionPathOf(world, rootless),
    "",
  );
  TestValidator.equals(
    "the root's own path is empty",
    autoMovieInspectionPathOf(world, world),
    "",
  );
  TestValidator.equals(
    "an undrawn object has a path too",
    autoMovieInspectionPathOf(world, lamp),
    "lamp",
  );
  TestValidator.equals(
    "a name holding a slash is written as it is",
    autoMovieInspectionPathOf(world, slashed),
    "a/b",
  );
  TestValidator.equals(
    "a deeper root shortens the path",
    autoMovieInspectionPathOf(hero, armB),
    "torso/arm.L",
  );
  TestValidator.error("an object outside the root is refused", (): void => {
    autoMovieInspectionPathOf(hero, trail);
  });

  // 2. Listing the drawn objects.
  const listed: IAutoMovieInspectionPath[] =
    listAutoMovieInspectionPaths(world);
  TestValidator.equals(
    "drawn objects are listed in scene order under their paths",
    listed.map((entry: IAutoMovieInspectionPath): string => entry.path),
    [
      "stage/hero/torso",
      "stage/hero/torso/arm.L",
      "stage/hero/torso/arm.L",
      "stage/hero",
      "stage/hero/hidden",
      "trail",
      "dust",
      "tag",
      "a/b",
      "",
    ],
  );
  const expected: THREE.Object3D[] = [
    torso,
    armA,
    armB,
    anonymous,
    hidden,
    trail,
    dust,
    tag,
    slashed,
    rootless,
  ];
  TestValidator.predicate(
    "each entry holds the object its path names",
    listed.length === expected.length &&
      listed.every(
        (entry: IAutoMovieInspectionPath, i: number): boolean =>
          entry.object === expected[i],
      ),
  );
  TestValidator.equals(
    "a deeper root lists only what is beneath it",
    listAutoMovieInspectionPaths(torso).map(
      (entry: IAutoMovieInspectionPath): string => entry.path,
    ),
    ["", "arm.L", "arm.L"],
  );
  TestValidator.equals(
    "a tree of groups lists nothing",
    listAutoMovieInspectionPaths(new THREE.Group().add(new THREE.Group())),
    [],
  );

  // 3. Matching a pattern.
  const verdicts: [pattern: string, path: string, matches: boolean][] = [
    ["hero", "hero", true],
    ["hero", "hero/torso", true],
    ["hero", "stage/hero/torso", true],
    ["hero", "heroine", false],
    ["hero", "stage/heroine/torso", false],
    ["*arm*", "hero/arm.L", true],
    ["*arm*", "hero/forearm/hand", true],
    ["*arm*", "hero/leg", false],
    ["hero/torso", "hero/torso", true],
    ["hero/torso", "hero/torso/arm.L", true],
    ["hero/torso", "stage/hero/torso", false],
    ["hero/torso", "hero", false],
    ["hero/*", "hero/torso", true],
    ["hero/*", "hero/torso/arm.L", true],
    ["hero/*", "hero", false],
    ["*/torso", "hero/torso", true],
    ["*/torso", "stage/hero/torso", false],
    ["**/torso", "torso", true],
    ["**/torso", "stage/hero/torso", true],
    ["**/torso", "stage/hero", false],
    ["stage/**/arm.L", "stage/hero/torso/arm.L", true],
    ["stage/**/arm.L", "stage/arm.L", true],
    ["stage/**/arm.L", "arm.L", false],
    ["Hero", "hero", false],
    ["arm.L", "arm.L", true],
    ["arm.L", "armXL", false],
    ["a+b", "a+b", true],
    ["a+b", "aab", false],
    ["hero", "", false],
    ["*", "", false],
    ["*", "hero", true],
    ["**", "", true],
    ["**", "hero/torso", true],
  ];
  for (const [pattern, path, matches] of verdicts)
    TestValidator.equals(
      `pattern "${pattern}" ${matches ? "matches" : "does not match"} "${path}"`,
      matchAutoMovieInspectionPath(path, pattern),
      matches,
    );
  TestValidator.error("an empty pattern is refused", (): void => {
    matchAutoMovieInspectionPath("hero", "");
  });
}
