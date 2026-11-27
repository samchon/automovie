import {
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeRide } from "../core";
import type { AutoMovieArchetypeEquineLunge } from "./AutoMovieArchetypeEquineLunge";
import { EquineLine } from "./EquineLine";

/**
 * The lunge line of a lunged equid (`AutoMovieArchetypeEquineLunge`): its own
 * lead paid out from the halter to the handler's line hand at the circle's
 * centre, and carried from one hand to the other at a change of rein.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeEquineLungeLine {
  /**
   * The handler's line hand: where the lunge line leaves it, in the frame of
   * the handler at the centre facing the equid.
   */
  export interface IHand {
    /** Height above the floor, metres. */
    height: number;

    /** Distance out from the centre toward the equid, metres. */
    reach: number;

    /**
     * Distance aside toward the rein's side, the side the equid's head is on,
     * metres.
     */
    spread: number;
  }

  /**
   * A change of the line from one hand to the other at a change of rein, on the
   * film clock.
   */
  export interface IChange {
    /** Film second the line hand starts in to the middle. */
    from: number;

    /** Seconds each of the three phases takes, positive. */
    phase: number;
  }

  /**
   * Lay the equid's lead out as the lunge line to the handler's line hand at
   * the centre.
   *
   * @param ride The lunge, after any layer that moves the head's contacts.
   * @param lead The lead's held-run contact.
   * @param centre Where the handler stands.
   * @param side The side of the handler the line hand is on at the start.
   * @param hand Where the line leaves the hand.
   * @param length The line's whole length, metres.
   * @param change When the line passes to the other hand at a change of rein;
   *   kept in the one hand when absent.
   * @returns The ride with the line laid.
   * @throws {AutoMovieArchetypeRefusal} As `EquineLine.layer` refuses a
   *   stretched line.
   */
  export function layer<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    lead: Id,
    centre: AutoMovieArchetypeEquineLunge.IPoint,
    side: AutoMovieArchetypeEquineLunge.Side,
    hand: IHand,
    length: number,
    change?: IChange,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    const sign: number = side === "left" ? 1 : -1;
    const aside = (seconds: number): number => {
      if (change === undefined) return sign;
      const local: number = (seconds - change.from) / change.phase;
      if (local <= 0) return sign;
      if (local < 1) return sign * (1 - AutoMovieEngineMotionSampling.minimumJerkShare(local));
      if (local < 2) return 0;
      return -sign * AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, local - 2));
    };
    return EquineLine.layer(
      ride,
      lead,
      (
        seconds: number,
        sample: AutoMovieArchetypeRide.ISample<Id, D>,
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
