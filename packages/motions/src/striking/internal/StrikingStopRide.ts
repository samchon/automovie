import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionWeaponContact,
} from "@automovie/interface";

import { StrikingRide } from "./StrikingRide";
import { StrikingWeapon } from "./StrikingWeapon";

/*
 * A strike's committed stop and the stopped limb's ride on the body it met
 * (`StrikingRide`): the performance commits the first contact the weapon made
 * (`IAutoMovieMotionHumanActionPlan.stop`), and the plan's preparation solves
 * the ride on it; before that, and on a strike that met nothing, a posture is
 * shown as the strike's own course gives it.
 * Parameter ride: Solves the ride on a committed contact, from the strike's
 * prepared geometry.
 * Returns: The stop.
 */
export function StrikingStopRide(
  ride: (met: IAutoMovieMotionWeaponContact) => StrikingRide.IRide,
): StrikingStopRide.IStop {
  let met: IAutoMovieMotionWeaponContact | null = null;
  let rode: StrikingRide.IRide | undefined;
  return {
    met: (): IAutoMovieMotionWeaponContact | null => met,
    stop: (found: readonly IAutoMovieMotionWeaponContact[]): number | null => {
      met = StrikingWeapon.first(found);
      // The ride is solved on the stop it was given: a stop committed now
      // makes it another, which the next preparation solves.
      rode = undefined;
      return met === null ? null : met.seconds;
    },
    prepare: (): void => {
      rode = met === null ? undefined : ride(met);
    },
    carry: (
      posture: IAutoMovieMotionHumanPosture,
      limb: AutoMovieHumanLimb,
      seconds: number,
    ): IAutoMovieMotionHumanPosture =>
      rode === undefined ? posture : rode.carry(posture, limb, seconds),
  };
}

/*
 * Companion types of StrikingStopRide.
 */
export namespace StrikingStopRide {
  /*
   * A strike's stop and ride.
   */
  export interface IStop {
    /*
     * The contact the performance committed.
     * Returns: The contact, or null when the weapon met nothing.
     */
    met(): IAutoMovieMotionWeaponContact | null;

    /*
     * Commit the weapon's contacts: the first is the stop.
     * Parameter found: The contacts the performance resolved.
     * Returns: The stop's film second, or null when the weapon met nothing.
     */
    stop(found: readonly IAutoMovieMotionWeaponContact[]): number | null;

    /*
     * Solve the ride on the committed stop, after the geometry is prepared.
     */
    prepare(): void;

    /*
     * A posture carried by the ride, or as given before it is solved.
     * Parameter posture: The strike's posture.
     * Parameter limb: The stopped limb.
     * Parameter seconds: Film seconds.
     * Returns: The posture.
     */
    carry(
      posture: IAutoMovieMotionHumanPosture,
      limb: AutoMovieHumanLimb,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;
  }
}
