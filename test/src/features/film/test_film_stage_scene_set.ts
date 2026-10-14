import { Quaternion, Vector3, stageScene } from "@automovie/engine";
import type {
  IAutoMovieScene,
  IAutoMovieSceneNode,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import {
  hasViolation,
  namedFacts,
  qclose,
  vclose,
} from "../internal/predicates";

/**
 * Set pieces (#1173): staging may drop environment geometry (a floor slab, a
 * wall) as static scene nodes realising skeleton-less models, so the guide
 * passes describe a world instead of actors floating in a void.
 *
 * Scenarios:
 *
 * 1. A floor (no `facingDeg`) and a turned wall stage as scene nodes after the
 *    cast: the floor model id is kept verbatim, the floor unrotated (identity), the wall's
 *    yaw encoded exactly like an actor's facing, motion/pose null.
 * 2. A camera may `lookAt` a set piece: its −Z aims at the piece's position.
 * 3. Full quaternion rotation stages sloped or vertical architecture.
 * 4. The gates: a set node colliding with a cast id, a blank node id, a blank
 *    model id, a non-finite position, and a non-finite `facingDeg` are all
 *    refused in one round at their `$input.set[i]` paths; an omitted
 *    `facingDeg` is not a violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages static set nodes, yaw and full rotations, and a camera aimed at a set piece; then requires the seven malformed node/model/position/rotation refusals.
 * @evidence contracts/testing.md#independent-expectations Literal node order, floor model id, null floor motion/pose and authored rotations define expectations; qclose and vclose observe orientation and aim without deep float equality. Camera displacement comes from authored placement geometry; product normalization/rotation helpers participate in the observation, so their shared faults are not independently excluded.
 * @evidence contracts/testing.md#distinguishing-cases Retains omitted yaw, ninety-degree yaw, full quaternion, cast-id collision, blank ids, nonfinite position/yaw/rotation and conflicting rotation spellings; scale and logical ground admission belong to their separate entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns these portable scene-record and quaternion assertions through engine staging/math and existing fixtures; it does not display or certify architecture.
 */
export function test_film_stage_scene_set(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      set: [
        { node: "floor", model: "slab", position: { x: 0, y: 0, z: 0 } },
        {
          node: "wall-east",
          model: "wall",
          position: { x: 3, y: 0, z: 0 },
          facingDeg: 90,
        },
        {
          node: "sloped-roof",
          model: "roof",
          position: { x: 0, y: 3, z: 0 },
          rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
        },
      ],
      cameras: [
        {
          node: "cam-main",
          position: { x: 2, y: 1.5, z: 3 },
          lookAt: { kind: "node", node: "wall-east" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  TestValidator.equals("staging with set succeeds", staged.success, true);
  if (staged.success !== true) return;

  TestValidator.equals(
    "set nodes follow the cast in the scene",
    staged.scene.nodes.map((n: IAutoMovieSceneNode): string => n.id),
    ["knightA", "knightB", "floor", "wall-east", "sloped-roof"],
  );
  const floor: IAutoMovieSceneNode = staged.scene.nodes[2]!;
  const wall: IAutoMovieSceneNode = staged.scene.nodes[3]!;
  TestValidator.equals("set model ids are kept verbatim", floor.model, "slab");
  TestValidator.predicate(
    "an omitted facingDeg stages unrotated",
    qclose(floor.transform.rotation, { x: 0, y: 0, z: 0, w: 1 }),
  );
  TestValidator.equals(
    "a set piece is static scenery",
    namedFacts([
      ["refused", (): boolean => floor.motion === null],
      ["violated", (): boolean => floor.motion === null && floor.pose === null],
    ]),
    { refused: true, violated: true },
  );
  // facingDeg 90 turns +Z onto +X: the same encoding actors use.
  TestValidator.predicate(
    "the wall's yaw is encoded like an actor's facing",
    vclose(
      Quaternion.rotateVector(wall.transform.rotation, { x: 0, y: 0, z: 1 }),
      { x: 1, y: 0, z: 0 },
    ),
  );
  TestValidator.predicate(
    "a full set rotation is kept for non-yaw architecture",
    qclose(staged.scene.nodes[4]!.transform.rotation, {
      x: 0,
      y: 0,
      z: Math.SQRT1_2,
      w: Math.SQRT1_2,
    }),
  );

  // 2. the camera aims its −Z from its position at the piece.
  const camera: IAutoMovieScene["cameras"][number] = staged.scene.cameras[0]!;
  const minusZ: IAutoMovieVector3 = Quaternion.rotateVector(
    camera.transform.rotation,
    {
      x: 0,
      y: 0,
      z: -1,
    },
  );
  // Authored wall (3,0,0) minus camera (2,1.5,3), independent of lowered TRS.
  const toWall: IAutoMovieVector3 = Vector3.normalize({ x: 1, y: -1.5, z: -3 });
  TestValidator.predicate(
    "a camera may frame a set piece",
    vclose(minusZ, toWall),
  );

  // 3. the gates, all in one refused round.
  const refused: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      set: [
        { node: "knightA", model: "slab", position: { x: 0, y: 0, z: 0 } },
        { node: " ", model: "slab", position: { x: 0, y: 0, z: 0 } },
        { node: "wall", model: " ", position: { x: 0, y: 0, z: 0 } },
        {
          node: "pit",
          model: "hole",
          position: { x: Number.NaN, y: 0, z: 0 },
        },
        {
          node: "gate",
          model: "arch",
          position: { x: 0, y: 0, z: 0 },
          facingDeg: Number.POSITIVE_INFINITY,
        },
        {
          node: "conflicted",
          model: "roof",
          position: { x: 0, y: 0, z: 0 },
          facingDeg: 0,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        {
          node: "bad-rotation",
          model: "roof",
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: Number.NaN, y: 0, z: 0, w: 2 },
        },
      ],
    }),
  );
  TestValidator.equals(
    "every malformed piece is refused at its own path in one round",
    namedFacts([
      ["refusedSuccess", (): boolean => refused.success === false],
      [
        "hasViolationRefusedType",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "type", "$input.set[0].node"),
      ],
      [
        "hasViolationRefusedType2",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "type", "$input.set[1].node"),
      ],
      [
        "hasViolationRefusedType3",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "type", "$input.set[2].model"),
      ],
      [
        "hasViolationRefusedRange",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[3].position"),
      ],
      [
        "hasViolationRefusedRange2",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[4].facingDeg"),
      ],
      [
        "hasRotationConflict",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "type", "$input.set[5].rotation"),
      ],
      [
        "hasInvalidRotation",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[6].rotation"),
      ],
    ]),
    {
      refusedSuccess: true,
      hasViolationRefusedType: true,
      hasViolationRefusedType2: true,
      hasViolationRefusedType3: true,
      hasViolationRefusedRange: true,
      hasViolationRefusedRange2: true,
      hasRotationConflict: true,
      hasInvalidRotation: true,
    },
  );
}
