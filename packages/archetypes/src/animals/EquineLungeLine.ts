import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeRide } from "../core";
import { EquineLine } from "./EquineLine";
import type { EquineLunge } from "./EquineLunge";

/**
 * The lunge line of a lunged equid (`EquineLunge`): its own lead paid out from the halter to the handler's line hand at the circle's centre, and carried from one hand to the other at a change of rein.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid and where the hand is.
 * @evidence contracts/development/design.md#principled-representation The hand in the handler's frame, a change on the film clock and one layer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The line's hand, change and layer; the line itself is `EquineLine`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineLungeLine {
  /**
   * The handler's line hand: where the lunge line leaves it, in the frame of the handler at the centre facing the equid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres: up from the floor, out toward the equid and aside toward the rein's side.
   * @evidence contracts/development/design.md#principled-representation Three distances.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `layer` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHand {
    /** Height above the floor, metres. */
    height: number;

    /** Distance out from the centre toward the equid, metres. */
    reach: number;

    /** Distance aside toward the rein's side, the side the equid's head is on, metres. */
    spread: number;
  }

  /**
   * A change of the line from one hand to the other at a change of rein, on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds; three phases of equal seconds: in to the middle, held there while the other hand takes it, out to the other side.
   * @evidence contracts/development/design.md#principled-representation A start and a phase length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `layer` reads; the handler's law changes hands on the same clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IChange {
    /** Film second the line hand starts in to the middle. */
    from: number;

    /** Seconds each of the three phases takes, positive. */
    phase: number;
  }

  /**
   * Lay the equid's lead out as the lunge line to the handler's line hand at the centre.
   *
   * @param ride The lunge, after any layer that moves the head's contacts.
   * @param lead The lead's held-run contact.
   * @param centre Where the handler stands.
   * @param side The side of the handler the line hand is on at the start.
   * @param hand Where the line leaves the hand.
   * @param length The line's whole length, metres.
   * @param change When the line passes to the other hand at a change of rein; kept in the one hand when absent.
   * @returns The ride with the line laid.
   * @throws {ArchetypeRefusal} As `EquineLine.layer` refuses a stretched line.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame the hand is read in.
   * @evidence contracts/development/implementation.md#principled-implementation The hand stands out from the centre toward the equid's root, aside toward the line hand's side and up by its height; across a change it comes in to the middle over one phase on a minimum-jerk share, stays there through the second while the other hand takes it, and goes out to the other side over the third; the line runs from there to the halter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One held point per sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One placement read per sample beyond the layer's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `EquineLine`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the ride and the hand.
   */
  export function layer<Id extends string, D extends string>(
    ride: ArchetypeRide.IRide<Id, D>,
    lead: Id,
    centre: EquineLunge.IPoint,
    side: EquineLunge.Side,
    hand: IHand,
    length: number,
    change?: IChange,
  ): ArchetypeRide.IRide<Id, D> {
    const sign: number = side === "left" ? 1 : -1;
    const aside = (seconds: number): number => {
      if (change === undefined) return sign;
      const local: number = (seconds - change.from) / change.phase;
      if (local <= 0) return sign;
      if (local < 1) return sign * (1 - minimumJerk.share(local));
      if (local < 2) return 0;
      return -sign * minimumJerk.share(Math.min(1, local - 2));
    };
    return EquineLine.layer(
      ride,
      lead,
      (
        seconds: number,
        sample: ArchetypeRide.ISample<Id, D>,
      ): IAutoMovieVector3 => {
        const root: IAutoMovieVector3 = sample.placement.translation;
        const out: IAutoMovieVector3 = Vector3.normalize({
          x: root.x - centre.x,
          y: 0,
          z: root.z - centre.z,
        });
        const across: number = hand.spread * aside(seconds);
        return {
          x: centre.x + out.x * hand.reach + out.z * across,
          y: hand.height,
          z: centre.z + out.z * hand.reach - out.x * across,
        };
      },
      length,
    );
  }
}
