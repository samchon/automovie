import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { bowViolinGrip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** A half turn about +Z: (x, y, z) goes to (-x, -y, z). */
const HALF: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };

/**
 * `bowViolinGrip` places the held bow's grip so the hair point at a share from
 * frog to tip, turned by the stroke rotation, lies on the sounding point lifted
 * along the string's outward normal: `contact + lift outward - R (frog + share
 * hair)`.
 *
 * The sounding point is (1, 1, 0), the outward normal +Y; the frog lies 0.1 m
 * below the grip and the hair runs 0.6 m along -X in the bow's held frame.
 *
 * Scenarios:
 *
 * 1. Unturned, at the frog and on the string, the grip is 0.1 m above the sounding
 *    point.
 * 2. At half the hair and lifted 0.05 m, it moves 0.3 m along +X and 0.05 m up.
 * 3. Turned a half turn about +Z, the frog's offset and the hair reverse.
 */
export function test_unit_motions_music_bow_violin_grip(): void {
  const contact: IAutoMovieVector3 = { x: 1, y: 1, z: 0 };
  const frog: IAutoMovieVector3 = { x: 0, y: -0.1, z: 0 };
  const hair: IAutoMovieVector3 = { x: -0.6, y: 0, z: 0 };
  const plain: (share: number, lift: number) => IAutoMovieVector3 =
    bowViolinGrip(
      contact,
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 0, w: 1 },
      frog,
      hair,
    );
  const turned: (share: number, lift: number) => IAutoMovieVector3 =
    bowViolinGrip(contact, { x: 0, y: 1, z: 0 }, HALF, frog, hair);
  TestValidator.predicate(
    "the grip that lays the hair on the string",
    vclose(plain(0, 0), { x: 1, y: 1.1, z: 0 }, 1e-12) &&
      vclose(plain(0.5, 0.05), { x: 1.3, y: 1.15, z: 0 }, 1e-12) &&
      vclose(turned(0.5, 0), { x: 0.7, y: 0.9, z: 0 }, 1e-12),
  );
}
