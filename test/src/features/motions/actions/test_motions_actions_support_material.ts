import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { prepareSupportInterval } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

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
    rotation: Quaternion.identity(),
  };
  const end: IAutoMovieRigidTransform = {
    position: { x: 6, y: 2, z: 9 },
    rotation: Quaternion.fromAxisAngle(up, 180),
  };
  const a: IAutoMovieVector3 = { x: 2, y: 2, z: 3 };
  const b: IAutoMovieVector3 = { x: 4, y: 2, z: 9 };
  const read: ReturnType<typeof prepareSupportInterval.materialPoint> =
    prepareSupportInterval.materialPoint([start, end], [a, b]);
  const between: IAutoMovieRigidTransform = {
    position: { x: 20, y: 4, z: 30 },
    rotation: Quaternion.fromAxisAngle(up, 90),
  };
  TestValidator.predicate(
    "the destination retains the achieved endpoint",
    Vector3.distance(read(end, 1), b) <= ROUNDING,
  );
  TestValidator.predicate(
    "the local interval follows the intermediate material frame",
    Vector3.distance(read(between, 0.25), { x: 20, y: 4, z: 28.75 }) <= ROUNDING,
  );
  TestValidator.predicate(
    "reading backwards retains the achieved start",
    Vector3.distance(read(start, 0), a) <= ROUNDING,
  );
}
