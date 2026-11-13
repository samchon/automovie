import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import type { HumanCarried } from "./HumanCarried";

/**
 * The carrier's lean against the load of a carried person (#3349): a load
 * on the back brings the trunk forward, a load before the chest or pulled
 * from ahead brings it back, so the carrier's and the load's common centre
 * of mass stays over the feet.
 *
 * The direction is the mechanics' and the load-carriage literature's: the
 * trunk's forward lean grows with a load carried on the back (Knapik,
 * Harman and Reynolds 1996, "Load carriage using packs", Applied Ergonomics
 * 27, a review). The sizes are provisional: no study of carrying a whole
 * person was read for them. A piggyback leans 20 degrees forward, a load
 * over the shoulder 10; a cradle and the drags lean back 10. The lean is
 * written in the spine and the chest, half each, so the pelvis and the legs
 * the carrier's own action places are left alone.
 *
 * First pass: the lean is a constant of the carry, taken up with the hold;
 * it does not follow the carried body's mass or the carrier's stride, and a
 * supported walk's sideways lean toward the supported person is not
 * written.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the cited direction, which sizes are provisional and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One angle per carry as data and one joint primitive over the carrier's own action.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and the primitive `bearing` adds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lean is added to what the carrier's action holds, never set over it.
 */
export namespace HumanCarriedLean {
  /** The carrier's trunk flexion against each carry's load, degrees; positive leans forward. */
  export const LEANS: Readonly<Record<HumanCarried.Carry, number>> = {
    piggyback: 20,
    cradle: -10,
    overShoulder: 10,
    supported: 0,
    supportedLeft: 0,
    armpitDrag: -10,
    collarDrag: -10,
    ankleDrag: -10,
  };

  /**
   * The lean of a carry, taken up as the hands take their hold.
   *
   * @param carry The carry.
   * @param clock The hold's clock, with its `held` instant.
   * @param seconds The hold's length, seconds.
   * @returns The trunk's primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Half the carry's angle is added to the spine's flexion and half to the chest's, growing with the clock's progress to `held`, so the trunk leans while the hands arrive.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint addition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A carry with no lean still returns a primitive that adds nothing, so every carry composes the same way.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the joint addition every trunk overlay uses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over the clock and one angle.
   */
  export function of(
    carry: HumanCarried.Carry,
    clock: AutoMovieMotionClock.IClock,
    seconds: number,
  ): IAutoMovieMotionHumanPrimitive {
    const half: number = LEANS[carry] / 2;
    return AutoMovieMotionHumanJoints.add({
      channels: ["trunk"],
      from: 0,
      to: seconds,
      delta: (at: number): AutoMovieMotionHumanJoints.Angles => {
        const taken: number = clock.progress("start", "held", at);
        return {
          spine: [half * taken, 0, 0],
          chest: [half * taken, 0, 0],
        };
      },
    });
  }
}
