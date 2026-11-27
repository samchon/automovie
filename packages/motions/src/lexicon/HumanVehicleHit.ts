import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanVehicleHit,
} from "@automovie/interface";

import { planVehicleDive } from "../reaction/internal/planVehicleDive";
import { planVehicleHit } from "../reaction/internal/planVehicleHit";

/**
 * A pedestrian and a moving car: struck and thrown along one of the frontal
 * impact trajectories (`planVehicleHit`), or diving clear of it at the last
 * moment (`planVehicleDive`). Register `HumanVehicleHit.vehicleHit` and
 * `HumanVehicleHit.vehicleDive` to use them.
 */
export namespace HumanVehicleHit {
  /**
   * Be struck by a moving car and thrown. It cancels no other action and leaves
   * no channel to overlays.
   */
  export const vehicleHit: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanVehicleHit.IParams> =
    {
      name: "vehicleHit",
      interrupts: {},
      yields: [],
      plan: planVehicleHit,
    };

  /**
   * Dive clear of a moving car. It cancels no other action and leaves no
   * channel to overlays.
   */
  export const vehicleDive: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanVehicleHit.IDive> =
    {
      name: "vehicleDive",
      interrupts: {},
      yields: [],
      plan: planVehicleDive,
    };
}
