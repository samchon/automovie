import type {
  IAutoMovieMotionWeaponPath,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  StrikingWeaponSample
} from "../../../../../packages/motions/src/striking/internal/StrikingWeaponSample";
import { TestValidator } from "@nestia/e2e";

/**
 * Sampling striking weapons (`StrikingWeaponSample`): a weapon without a chain
 * reads its own path and tail; weapons on one chain read adjacent ends of that
 * chain, posed once for all of them at a second.
 *
 * Scenario: at 2 s a fist travelling along +X with no tail reads (2, 0, 0) and
 * none; a shin and a foot on one leg chain read its first and second, and its
 * second and third ends, the chain posed once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes sampling standalone and shared-chain virtual collision geometry at one time.
 * @evidence contracts/development/testing.md#behavioral-verification Samples an independent moving point and two adjacent colliders that share one typed limb pose callback.
 * @evidence contracts/development/testing.md#independent-expectations The free path is x = t with no tail. A shared three-joint chain yields spans [0, 1] and [1, 2] and the callback is invoked once.
 */
export function test_motions_striking_weapon_sample(): void {
  let posed: number = 0;
  const ends = (seconds: number): readonly IAutoMovieVector3[] => {
    ++posed;
    return [
      { x: 0, y: seconds, z: 0 },
      { x: 1, y: seconds, z: 0 },
      { x: 2, y: seconds, z: 0 },
    ];
  };
  const base: Omit<IAutoMovieMotionWeaponPath, "id" | "path" | "chain"> = {
    limb: "rightLeg",
    radius: 0.05,
    from: 0,
    to: 3,
  };
  const fist: IAutoMovieMotionWeaponPath = {
    ...base,
    id: "fist",
    limb: "rightArm",
    path: (seconds: number): IAutoMovieVector3 => ({ x: seconds, y: 0, z: 0 }),
  };
  const shin: IAutoMovieMotionWeaponPath = {
    ...base,
    id: "shin",
    path: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0 }),
    chain: { ends, index: 0 },
  };
  const foot: IAutoMovieMotionWeaponPath = {
    ...base,
    id: "foot",
    path: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0 }),
    chain: { ends, index: 1 },
  };
  TestValidator.equals("a free weapon", StrikingWeaponSample.read(fist, 2), [
    { x: 2, y: 0, z: 0 },
    undefined,
  ]);
  posed = 0;
  const axes: ReadonlyMap<IAutoMovieMotionWeaponPath, unknown> =
    StrikingWeaponSample.sample([fist, shin, foot], 2);
  TestValidator.equals(
    "a shared chain",
    [axes.get(shin), axes.get(foot), posed],
    [
      [
        { x: 0, y: 2, z: 0 },
        { x: 1, y: 2, z: 0 },
      ],
      [
        { x: 1, y: 2, z: 0 },
        { x: 2, y: 2, z: 0 },
      ],
      1,
    ],
  );
}
