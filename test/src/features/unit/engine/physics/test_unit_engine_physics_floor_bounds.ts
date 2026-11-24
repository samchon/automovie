import { inPhysicalFloorBounds } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `inPhysicalFloorBounds` tells whether a placed shape stays within the floor's
 * x and z extent.
 *
 * Floor: x and z in [-2, 2]. Shape: a sphere of radius 1.
 *
 * Scenarios:
 *
 * 1. At the origin the sphere spans [-1, 1]: inside.
 * 2. At x = 1 it touches the edge exactly (spans [0, 2]): inside.
 * 3. At x = 1.5 it reaches 2.5: outside. At z = -1.5 it reaches -2.5: outside.
 */
export function test_unit_engine_physics_floor_bounds(): void {
  const shape: IAutoMoviePhysicalShape = {
    id: "ball",
    material: "m",
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    kind: "sphere",
    radius: 1,
  };
  const floor: IAutoMoviePhysicalSimulationInput.IInput["floorBounds"] = {
    min: { x: -2, z: -2 },
    max: { x: 2, z: 2 },
    thickness: 1,
  };
  const at = (x: number, z: number): IAutoMovieRigidTransform => ({
    position: { x, y: 0, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  TestValidator.equals(
    "origin",
    inPhysicalFloorBounds(at(0, 0), shape, floor),
    true,
  );
  TestValidator.equals(
    "edge",
    inPhysicalFloorBounds(at(1, 0), shape, floor),
    true,
  );
  TestValidator.equals(
    "past x",
    inPhysicalFloorBounds(at(1.5, 0), shape, floor),
    false,
  );
  TestValidator.equals(
    "past z",
    inPhysicalFloorBounds(at(0, -1.5), shape, floor),
    false,
  );
}
