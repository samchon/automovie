import { AutoMovieArchetypeHorse } from "@automovie/archetypes";
import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanColliders,
  HumanFoot,
  HumanPropFrame,
  poseBones,
  prepareCoupledMount,
  prepareMountMaterialSeat,
  resolveHumanPosture,
  seated,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** Fit the stored rider on the actual connected saddle and both stock irons. */
export async function test_motions_mounted_seated_key(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const horse = AutoMovieArchetypeHorse.create(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    1028,
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const seat = HumanObject.seat(horse, frame, "seat", "horse");
  const prop = HumanObject.prop("horse", horse, frame);
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
  const down = Quaternion.rotateVector(material.seat.frame.rotation, {
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
          Vector3.distance(pointA, pointB) <= precision &&
          Math.abs(
            Vector3.dot(
              down,
              Vector3.subtract(pointB, material.seat.frame.position),
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
    const ball = Vector3.add(
      point,
      Quaternion.rotateVector(rotation!, contact!),
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
