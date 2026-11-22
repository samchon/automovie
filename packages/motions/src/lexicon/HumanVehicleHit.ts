import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanVehicleHit,
} from "@automovie/interface";

import { planVehicleDive } from "../reaction/planVehicleDive";
import { planVehicleHit } from "../reaction/planVehicleHit";

/**
 * A pedestrian and a moving car: struck and thrown along one of the
 * frontal impact trajectories (`planVehicleHit`), or diving clear of it at
 * the last moment (`planVehicleDive`). Register `HumanVehicleHit.vehicleHit`
 * and `HumanVehicleHit.vehicleDive` to use them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both laws and the registration.
 * @evidence contracts/development/design.md#principled-representation Law records whose parameters name the car; the planners read its front and course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two registered laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No car model is special-cased; each is read from its prop.
 */
export namespace HumanVehicleHit {
  /** Be struck by a moving car and thrown. It cancels no other action and leaves no channel to overlays. */
  export const vehicleHit: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanVehicleHit.IParams> =
    {
      name: "vehicleHit",
      interrupts: {},
      yields: [],
      plan: planVehicleHit,
    };

  /** Dive clear of a moving car. It cancels no other action and leaves no channel to overlays. */
  export const vehicleDive: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanVehicleHit.IDive> =
    {
      name: "vehicleDive",
      interrupts: {},
      yields: [],
      plan: planVehicleDive,
    };
}
