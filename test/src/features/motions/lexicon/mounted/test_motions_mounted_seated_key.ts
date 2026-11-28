import { AutoMovieArchetypeHorse } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import {
  HumanColliders
} from "../../../../../../packages/motions/src/posture/internal/HumanColliders";
import {
  HumanFoot
} from "../../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  HumanPropFrame
} from "../../../../../../packages/motions/src/perform/internal/HumanPropFrame";
import {
  poseBones
} from "../../../../../../packages/motions/src/posture/internal/poseBones";
import {
  prepareCoupledMount
} from "../../../../../../packages/motions/src/lexicon/internal/prepareCoupledMount";
import {
  prepareMountMaterialSeat
} from "../../../../../../packages/motions/src/lexicon/internal/prepareMountMaterialSeat";
import {
  resolveHumanPosture
} from "../../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import {
  seated
} from "../../../../../../packages/motions/src/everyday/internal/seated";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * Fit the stored rider on the actual connected saddle and both stock irons.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes actual seated pelvis support, bilateral plate support and room for each articulated collider against the mount.
 * @evidence contracts/development/testing.md#behavioral-verification Solves the stored rider on the real tack, poses its body and queries pelvis manifold, toe basis and every body-obstacle shape pair.
 * @evidence contracts/development/testing.md#independent-expectations Physical deck contact witnesses and authored plate half-extents independently bound support. The forefoot stays on foot skin and signed body clearances meet the tolerance.
 */
export async function test_motions_mounted_seated_key(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const horse = AutoMovieArchetypeHorse.create(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    1028,
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const seat = AutoMovieMotionHumanObject.seat(horse, frame, "seat", "horse");
  const prop = AutoMovieMotionHumanObject.prop("horse", horse, frame);
  const reader: IAutoMovieMotionHumanPropReader = {
    prop,
    frame: () => frame,
    snapshot: () => ({
      frame,
      posed: { affordances: horse.affordances, shapes: horse.shapes() },
    }),
  };
  const neutral: IAutoMovieMotionHumanPosture = {
    root: frame.position,
    yaw: seat.yaw,
    pitch: seat.pitch ?? 0,
    roll: seat.roll ?? 0,
    joints: {},
    limbs: {},
  };
  const material = prepareMountMaterialSeat.context(
    { body, start: 0, prop: () => reader },
    seat,
    () => neutral,
  );
  if (material === undefined) throw new Error("Missing material saddle");
  const result = prepareCoupledMount(body, material, {
    ...neutral,
    root: seated.root(body, material.goal, neutral),
  });
  if (result.key === undefined) throw new Error(result.reason);
  const key = result.key;
  const bones = poseBones(
    body,
    resolveHumanPosture(body, key.posture),
    undefined,
    new Set<AutoMovieHumanoidBone>([
      "hips",
      "leftUpperLeg",
      "leftLowerLeg",
      "leftFoot",
      "leftToes",
      "rightUpperLeg",
      "rightLowerLeg",
      "rightFoot",
      "rightToes",
    ]),
  );
  const precision = 0.002;
  const placedBody = HumanColliders.placed(body, bones);
  const hips = placedBody.filter((part) => part.bone === "hips");
  const seatGap = Math.min(
    ...hips.flatMap((part) =>
      part.shapes.map((skin) =>
        AutoMovieEnginePhysics.physicalShapePairDistance(
          part.pose,
          skin,
          material.frame,
          material.seat.deck,
        ),
      ),
    ),
  );
  const down = AutoMovieEngineQuaternion.rotateVector(material.seat.frame.rotation, {
    x: 0,
    y: -1,
    z: 0,
  });
  const witness = hips.some((part) =>
    part.shapes.some((skin) =>
      AutoMovieEnginePhysics.physicalShapeContactManifold(
        part.pose,
        skin,
        material.frame,
        material.seat.deck,
        down,
        precision,
      ).some(
        ({ pointA, pointB }) =>
          AutoMovieEngineVector3.distance(pointA, pointB) <= precision &&
          Math.abs(
            AutoMovieEngineVector3.dot(
              down,
              AutoMovieEngineVector3.subtract(pointB, material.seat.frame.position),
            ),
          ) <= precision,
      ),
    ),
  );
  TestValidator.predicate(
    "the actual pelvis carries on the physical deck",
    witness && Math.abs(seatGap) <= precision,
  );
  for (const side of ["left", "right"] as const) {
    const { point, rotation, contact } = key.feet[side];
    const ball = AutoMovieEngineVector3.add(
      point,
      AutoMovieEngineQuaternion.rotateVector(rotation!, contact!),
    );
    const tread = material.treads[side];
    const placed = HumanPropFrame.relative(tread.frame, {
      ...frame,
      position: ball,
    }).position;
    const skinGap = Math.min(
      ...placedBody
        .filter(({ bone }) => bone === `${side}Foot` || bone === `${side}Toes`)
        .flatMap(({ pose, shapes }) =>
          shapes.map((skin) =>
            Math.abs(AutoMovieEnginePhysics.physicalShapeNearest(pose, skin, ball, ball).distance),
          ),
        ),
    );
    const roundoff = 64 * Number.EPSILON;
    TestValidator.predicate(
      `the ${side} forefoot bears inside its actual finite plate (${placed.x}, ${placed.y}, ${placed.z}; skin gap ${skinGap} m)`,
      Math.abs(placed.y) <= precision &&
        Math.abs(placed.x) <= tread.affordance.width! / 2 + roundoff &&
        Math.abs(placed.z) <= tread.affordance.depth! / 2 + roundoff &&
        skinGap <= HumanFoot.BEARING,
    );
  }
  for (const part of placedBody)
    for (const actor of part.shapes)
      TestValidator.predicate(
        `${part.bone} clears the posed horse and its tack`,
        material.shapes.every(
          (obstacle: IAutoMoviePhysicalShape) =>
            AutoMovieEnginePhysics.physicalShapePairDistance(
              part.pose,
              actor,
              material.frame,
              obstacle,
            ) >= -precision,
        ),
      );
}
