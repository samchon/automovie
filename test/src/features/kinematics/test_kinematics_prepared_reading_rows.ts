import { prepareSkeletonPoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { throwsError } from "../internal/throwsError";

/**
 * A reading's bone rows give, into the caller's storage, the very numbers
 * its name map's fresh records hold.
 *
 * Scenarios:
 * 1. A chest twisted 90 degrees and a left upper arm abducted 90, under a
 *    translated root: for every bone the map returns, its row reads the same
 *    position and world rotation component for component, and the row's
 *    fresh record equals the map's record.
 * 2. The target the caller passes is the one written and returned.
 * 3. A bone the rig does not reach has row -1, and a row outside the rig is
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the equivalence checked, the caller-storage rule and the unreached and refused rows in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the genuine public rig's read and every row reader on a posed rig, comparing each against the same reading's name map.
 * @evidence contracts/development/testing.md#independent-expectations The map's fresh records are the established reading of the same admission; the rows must reproduce them bit for bit (Object.is), and the unreached row is the documented -1.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rotated and translated ancestry, every reachable bone, the caller's own target, an unreached name and out-of-range and fractional rows.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable kernel unit owns its skeleton and pose and calls public preparation and reading only.
 */
export function test_kinematics_prepared_reading_rows(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const rig: ReturnType<typeof prepareSkeletonPoseResolution> = prepareSkeletonPoseResolution(skeleton);
  const reading: ReturnType<typeof rig.read> = rig.read(makePose(
    [joint("chest", { twist: 90 }), joint("leftUpperArm", { abduction: 90 })],
    { translation: { x: 2, y: 3, z: 4 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } },
  ));
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = reading.map();
  const position: IAutoMovieVector3 = { x: NaN, y: NaN, z: NaN };
  const rotation: IAutoMovieQuaternion = { x: NaN, y: NaN, z: NaN, w: NaN };
  const differing: string[] = [];
  for (const [name, record] of map) {
    const index: number = reading.index(name);
    const written: IAutoMovieVector3 = reading.position(index, position);
    const turned: IAutoMovieQuaternion = reading.rotation(index, rotation);
    const fresh: IAutoMovieResolvedBone = reading.bone(index);
    const same: boolean = written === position && turned === rotation &&
      Object.is(position.x, record.worldPosition.x) && Object.is(position.y, record.worldPosition.y) &&
      Object.is(position.z, record.worldPosition.z) && Object.is(rotation.x, record.worldRotation.x) &&
      Object.is(rotation.y, record.worldRotation.y) && Object.is(rotation.z, record.worldRotation.z) &&
      Object.is(rotation.w, record.worldRotation.w) && fresh !== record &&
      JSON.stringify(fresh) === JSON.stringify(record);
    if (!same) differing.push(name);
  }
  TestValidator.equals("every row reads the numbers of the map's record", differing, []);
  TestValidator.predicate("the rig reaches the bones the map holds", map.size > 0);
  TestValidator.equals("an unreached bone has no row", reading.index("jaw"), -1);
  TestValidator.predicate("a row outside the rig is refused",
    throwsError((): unknown => reading.position(-1, position)) &&
    throwsError((): unknown => reading.rotation(map.size, rotation)) &&
    throwsError((): unknown => reading.bone(0.5)));
}
