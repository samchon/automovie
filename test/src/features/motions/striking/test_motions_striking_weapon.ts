import type {
  IAutoMovieMotionWeaponContact,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  StrikingWeapon
} from "../../../../../packages/motions/src/striking/internal/StrikingWeapon";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A leg's three ends at a second: hip, knee and ankle. */
const ends = (seconds: number): readonly IAutoMovieVector3[] => [
  { x: 0, y: 1, z: seconds },
  { x: 0, y: 0.5, z: seconds },
  { x: 0, y: 0.1, z: seconds },
];

/** A thigh and a shank, the thigh tapering. */
const CHAIN: StrikingWeapon.IChain = {
  ids: ["thigh", "shank"],
  limb: "rightLeg",
  radii: [
    [0.08, 0.05],
    [0.05, 0.05],
  ],
  from: 0,
  to: 1,
  on: () => ({}),
  ends,
};

/**
 * A striking limb's weapons (`StrikingWeapon.capsules`, `first`, `axis`): one
 * capsule per segment between adjacent ends, tapering when its radii differ;
 * the earliest contact; and a named capsule's ends.
 *
 * Scenarios:
 *
 * 1. The thigh runs hip to knee, 0.08 tapering to 0.05; the shank knee to ankle,
 *    0.05 without a taper; both on the one chain.
 * 2. Radii that miss a capsule are refused.
 * 3. Of contacts at 0.4, 0.2 and 0.3 s, the first is at 0.2 s; of none, none.
 * 4. The shank's axis at 2 s is its knee and ankle; an unknown capsule is refused.
 */
export function test_motions_striking_weapon(): void {
  const [thigh, shank] = StrikingWeapon.capsules(CHAIN);
  TestValidator.predicate(
    "the capsules",
    thigh!.radius === 0.08 &&
      thigh!.tailRadius === 0.05 &&
      shank!.radius === 0.05 &&
      shank!.tailRadius === undefined &&
      thigh!.path(1).y === 1 &&
      thigh!.tail!(1).y === 0.5 &&
      shank!.chain!.index === 1 &&
      throwsError(() =>
        StrikingWeapon.capsules({ ...CHAIN, radii: [[0.08, 0.05]] }),
      ),
  );
  const contact = (seconds: number): IAutoMovieMotionWeaponContact => ({
    weapon: "shank",
    against: "pad",
    seconds,
  });
  TestValidator.equals(
    "the first contact",
    [
      StrikingWeapon.first([contact(0.4), contact(0.2), contact(0.3)]),
      StrikingWeapon.first([]),
    ],
    [contact(0.2), null],
  );
  TestValidator.equals("an axis", StrikingWeapon.axis(CHAIN, "shank", 2), [
    { x: 0, y: 0.5, z: 2 },
    { x: 0, y: 0.1, z: 2 },
  ]);
  TestValidator.predicate(
    "an unknown capsule",
    throwsError(() => StrikingWeapon.axis(CHAIN, "foot", 2)),
  );
}
