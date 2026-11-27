import type {
  IAutoMovieMotionWeaponPath,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { StrikingWeapon } from "./StrikingWeapon";

/*
 * A plan weapon's axis read at a film second: its centre and its capsule's
 * other end. The capsules a chain builds (`StrikingWeapon.capsules`) declare
 * their chain (`IAutoMovieMotionWeaponPath.chain`), so the two ends of one
 * capsule, and the shared ends of neighbouring capsules read together, come
 * from one posing of the course within one sample.
 */
export namespace StrikingWeaponSample {
  /*
   * Read one weapon's axis at an exact film second.
   * Parameter weapon: The plan weapon.
   * Parameter seconds: The film second.
   * Returns: Its world-metre centre and, for a capsule, its other end.
   */
  export function read(
    weapon: IAutoMovieMotionWeaponPath,
    seconds: number,
  ): StrikingWeapon.IAxis {
    const chain: IAutoMovieMotionWeaponPath.IChain | undefined = weapon.chain;
    if (chain === undefined)
      return [weapon.path(seconds), weapon.tail?.(seconds)];
    const ends: readonly IAutoMovieVector3[] = chain.ends(seconds);
    return [ends[chain.index]!, ends[chain.index + 1]];
  }

  /*
   * Read several weapons' axes at one exact film second.
   * Parameter weapons: The consumer's ordered demand.
   * Parameter seconds: The film second.
   * Returns: One axis per weapon, keyed by the weapon.
   */
  export function sample(
    weapons: readonly IAutoMovieMotionWeaponPath[],
    seconds: number,
  ): ReadonlyMap<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> {
    // The capsules of one chain read the chain's ends once for the second.
    const axes: Map<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> =
      new Map();
    const posed: Map<
      IAutoMovieMotionWeaponPath.IChain["ends"],
      readonly IAutoMovieVector3[]
    > = new Map();
    for (const weapon of weapons) {
      const chain: IAutoMovieMotionWeaponPath.IChain | undefined =
        weapon.chain;
      if (chain === undefined) {
        axes.set(weapon, read(weapon, seconds));
        continue;
      }
      let ends: readonly IAutoMovieVector3[] | undefined = posed.get(
        chain.ends,
      );
      if (ends === undefined) {
        ends = chain.ends(seconds);
        posed.set(chain.ends, ends);
      }
      axes.set(weapon, [ends[chain.index]!, ends[chain.index + 1]]);
    }
    return axes;
  }
}
