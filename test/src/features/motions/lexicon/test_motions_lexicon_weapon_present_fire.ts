import { AutoMovieEngineQuaternion } from "@automovie/engine";
import {
  humanWeaponFireRecoil
} from "../../../../../packages/motions/src/lexicon/internal/humanWeaponFireRecoil";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * The `HumanWeaponPresentFire` law's recoil (`humanWeaponFireRecoil`): the held
 * hand turns about the horizontal axis square to the bore, the muzzle rising by
 * the shot's rise; a vertical bore rises about the tool's own side.
 *
 * Scenarios:
 *
 * 1. A level bore along +Z rising 10 degrees points `(0, sin 10, cos 10)` at the
 *    peak and no further after it, about -X.
 * 2. A bore held straight up rises about the hand's `axis × edge`.
 */
export function test_motions_lexicon_weapon_present_fire(): void {
  const level: humanWeaponFireRecoil.IRecoil = humanWeaponFireRecoil(
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 1, z: 0 },
    10,
  );
  const r: number = (10 * Math.PI) / 180;
  TestValidator.predicate(
    "the muzzle rises",
    vclose(level.about, { x: -1, y: 0, z: 0 }, 1e-12) &&
      vclose(
        AutoMovieEngineQuaternion.rotateVector(level.turned(1), { x: 0, y: 0, z: 1 }),
        { x: 0, y: Math.sin(r), z: Math.cos(r) },
        1e-12,
      ) &&
      vclose(
        AutoMovieEngineQuaternion.rotateVector(level.turned(2), { x: 0, y: 0, z: 1 }),
        { x: 0, y: Math.sin(r), z: Math.cos(r) },
        1e-12,
      ),
  );
  const upright: humanWeaponFireRecoil.IRecoil = humanWeaponFireRecoil(
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    10,
  );
  TestValidator.predicate(
    "a vertical bore",
    vclose(upright.about, { x: 1, y: 0, z: 0 }, 1e-12),
  );
}
