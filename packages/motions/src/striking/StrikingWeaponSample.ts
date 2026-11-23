import type { IAutoMovieMotionWeaponPath } from "@automovie/interface";

import type { StrikingWeapon } from "./StrikingWeapon";

/**
 * A plan weapon's axis read at a film second: its centre and its capsule's
 * other end. The capsules a chain builds (`StrikingWeapon.capsules`) read
 * their ends off the chain posed once per second, so the two ends of one
 * capsule, and the shared ends of neighbouring capsules, come from one
 * posing of the course without any registry beside the weapons.
 */
export namespace StrikingWeaponSample {
  /**
   * Read one weapon's axis at an exact film second.
   *
   * @param weapon The plan weapon.
   * @param seconds The film second.
   * @returns Its world-metre centre and, for a capsule, its other end.
   */
  export function read(weapon: IAutoMovieMotionWeaponPath, seconds: number): StrikingWeapon.IAxis {
    return [weapon.path(seconds), weapon.tail?.(seconds)];
  }

  /**
   * Read several weapons' axes at one exact film second.
   *
   * @param weapons The consumer's ordered demand.
   * @param seconds The film second.
   * @returns One axis per weapon, keyed by the weapon.
   */
  export function sample(weapons: readonly IAutoMovieMotionWeaponPath[], seconds: number): ReadonlyMap<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> {
    const axes: Map<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> = new Map();
    for (const weapon of weapons) axes.set(weapon, read(weapon, seconds));
    return axes;
  }
}
