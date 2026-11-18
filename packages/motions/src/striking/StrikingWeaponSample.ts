import type { IAutoMovieMotionWeaponPath } from "@automovie/interface";

import type { StrikingWeapon } from "./StrikingWeapon";

/**
 * A plan weapon's axis read at a film second: its centre and its capsule's
 * other end. The capsules a chain builds (`StrikingWeapon.capsules`) read
 * their ends off the chain posed once per second, so the two ends of one
 * capsule, and the shared ends of neighbouring capsules, come from one
 * posing of the course without any registry beside the weapons.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, where the sharing between a capsule's two ends comes from and that nothing is registered.
 * @evidence contracts/development/design.md#principled-representation The axis is StrikingWeapon's canonical readonly pair of a centre and an optional end.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The single and grouped readers the StrikingWeapon facades delegate to.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no body, pose, time or weapon store; the chain's own per-second posing is the only sharing.
 */
export namespace StrikingWeaponSample {
  /**
   * Read one weapon's axis at an exact film second.
   *
   * @param weapon The plan weapon.
   * @param seconds The film second.
   * @returns Its world-metre centre and, for a capsule, its other end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the time, the endpoint order and the absent end of a sphere.
   * @evidence contracts/development/implementation.md#principled-implementation The weapon's own path and tail callbacks; a chain's capsules answer both from the chain posed at that second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two callback reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every read runs the weapon's own callbacks at the asked second.
   * @evidence contracts/development/implementation.md#efficient-algorithms A chain capsule's second read is served by the chain's posing of that second; a weapon of another producer pays its callbacks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The posing of a second is shared by the chain that owns it (`StrikingWeapon.capsules`), keyed by the exact second on one built geometry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh pair and retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the ordered demand, the time and the keyed result.
   * @evidence contracts/development/implementation.md#principled-implementation One `read` per weapon in the demand's order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal and one result map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every weapon is read at the asked second.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the weapons; capsules of one chain share that chain's single posing of the second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The sharing is the chain's own per-second posing; this reader keeps none.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned map is the caller's; nothing is retained here.
   */
  export function sample(weapons: readonly IAutoMovieMotionWeaponPath[], seconds: number): ReadonlyMap<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> {
    const axes: Map<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> = new Map();
    for (const weapon of weapons) axes.set(weapon, read(weapon, seconds));
    return axes;
  }
}
