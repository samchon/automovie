import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanMaterialContact
} from "../../../../../packages/motions/src/posture/internal/HumanMaterialContact";
import {
  prepareSupportInterval
} from "../../../../../packages/motions/src/actions/internal/prepareSupportInterval";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Roundoff of composing the tested rigid frames, metres. */
const ROUNDING: number = 1e-12;

/**
 * Two achieved contacts preserve their local endpoint coordinates on the same
 * material. A point on its local +X ray turns to the world's −Z ray when the
 * material turns 90 degrees about +Y, even when the local progress is only a
 * quarter. Translating the material by (20, 4, 30) carries both that offset and
 * the material's origin. Endpoint reads keep the original achieved points.
 */
export async function test_motions_actions_support_material(): Promise<void> {
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const start: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const end: IAutoMovieRigidTransform = {
    position: { x: 6, y: 2, z: 9 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(up, 180),
  };
  const a: IAutoMovieVector3 = { x: 2, y: 2, z: 3 };
  const b: IAutoMovieVector3 = { x: 4, y: 2, z: 9 };
  const read: ReturnType<typeof prepareSupportInterval.materialPoint> =
    prepareSupportInterval.materialPoint([start, end], [a, b]);
  const between: IAutoMovieRigidTransform = {
    position: { x: 20, y: 4, z: 30 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(up, 90),
  };
  TestValidator.predicate(
    "the destination retains the achieved endpoint",
    AutoMovieEngineVector3.distance(read(end, 1), b) <= ROUNDING,
  );
  TestValidator.predicate(
    "the local interval follows the intermediate material frame",
    AutoMovieEngineVector3.distance(read(between, 0.25), { x: 20, y: 4, z: 28.75 }) <=
      ROUNDING,
  );
  TestValidator.predicate(
    "reading backwards retains the achieved start",
    AutoMovieEngineVector3.distance(read(start, 0), a) <= ROUNDING,
  );

  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const radius: number = 0.125;
  const ball: IAutoMoviePhysicalShape = {
    id: "ball",
    material: "test",
    kind: "sphere",
    radius,
    transform: origin,
  };
  const square: readonly IAutoMovieVector3[] = [
    { x: -0.5, y: 0, z: -0.5 },
    { x: 0.5, y: 0, z: -0.5 },
    { x: 0.5, y: 0, z: 0.5 },
    { x: -0.5, y: 0, z: 0.5 },
  ];
  const raised: IAutoMovieRigidTransform = {
    position: { x: 3, y: 8, z: 5 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 37),
  };
  const local: IAutoMovieVector3 = { x: 0.2, y: 0.176, z: -0.35 };
  const world: IAutoMovieVector3 = HumanMaterialContact.world(
    { frame: raised, outline: square },
    local,
  );
  const tilted: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      { ...origin, position: world },
      ball,
      raised,
      square,
    );
  TestValidator.predicate(
    "rotating the paired frames retains local witness and radius-adjusted clearance",
    tilted !== undefined &&
      nclose(tilted.clearance, local.y - radius, ROUNDING) &&
      vclose(tilted.point, { ...local, y: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "a hovering or penetrating exterior does not convert a nominal off-edge point into contact",
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      { ...origin, position: { ...local, x: 1 } },
      ball,
      origin,
      square,
    ) === undefined &&
      nclose(
        AutoMovieEnginePhysics.physicalShapeFaceContact(
          {
            ...origin,
            position: { x: 0, y: 0.1, z: 0 },
          },
          ball,
          origin,
          square,
        )!.clearance,
        -0.025,
        ROUNDING,
      ),
  );
  const box: IAutoMoviePhysicalShape = {
    id: "box",
    material: "test",
    kind: "box",
    halfExtents: { x: 0.8, y: 0.1, z: 0.3 },
    transform: origin,
  };
  const flat: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
    AutoMovieEnginePhysics.physicalShapeFaceContact(
      { ...origin, position: { x: 0.45, y: 0.1, z: 0 } },
      box,
      origin,
      square,
    );
  TestValidator.predicate(
    "a broad flat support keeps the clipped outline rather than a point",
    flat?.patch?.length === 4 &&
      nclose(flat.clearance, 0, ROUNDING) &&
      nclose(
        Math.min(
          ...flat.patch.map((point: IAutoMovieVector3): number => point.x),
        ),
        -0.35,
        ROUNDING,
      ) &&
      nclose(
        Math.max(
          ...flat.patch.map((point: IAutoMovieVector3): number => point.x),
        ),
        0.5,
        ROUNDING,
      ),
  );
}
