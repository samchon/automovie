import type { IAutoMovieMotionHumanDive } from "../floor/IAutoMovieMotionHumanDive";
import type { IAutoMovieMotionHumanCollapse } from "../reaction/IAutoMovieMotionHumanCollapse";
import type { IAutoMovieMotionHumanThrown } from "../reaction/IAutoMovieMotionHumanThrown";
import type { IAutoMovieMotionHumanVehicleHit } from "../reaction/IAutoMovieMotionHumanVehicleHit";
import type { IAutoMovieMotionHumanWireFlight } from "../reaction/IAutoMovieMotionHumanWireFlight";
import type { IAutoMovieMotionHumanFirefight } from "../tasks/IAutoMovieMotionHumanFirefight";

/**
 * Open parameters of the floorFall lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconFloorFallParams {
  /**
   * A goalkeeper's dive to the left: off the feet to the side, landing on the
   * side with the hip and the lower hand on the floor.
   */
  goalkeeperDiveLeft: Omit<IAutoMovieMotionHumanDive.IParams, "kind" | "side">;

  /** A goalkeeper's dive to the right. */
  goalkeeperDiveRight: Omit<IAutoMovieMotionHumanDive.IParams, "kind" | "side">;

  /**
   * A sliding tackle: leaning back onto the hip and sliding forward with the
   * lead leg reaching ahead.
   */
  slidingTackle: Omit<IAutoMovieMotionHumanDive.IParams, "kind">;

  /**
   * A staged collapse forward, sideways, backward or in place, limp or
   * protective, for a faint or a fatal hit.
   */
  collapse: IAutoMovieMotionHumanCollapse.IParams;

  /**
   * A struck body thrown clear of the floor by a blast or a jerk-back, landing
   * on its back.
   */
  thrown: IAutoMovieMotionHumanThrown.IParams;

  /**
   * A pedestrian struck by a moving car, thrown along the frontal impact
   * trajectory its front and speed give, landing on the back.
   */
  vehicleHit: IAutoMovieMotionHumanVehicleHit.IParams;

  /** A near-miss dive to the side, clear of a moving car's width as it arrives. */
  vehicleDive: IAutoMovieMotionHumanVehicleHit.IDive;

  /** A body flown on wires along an authored path in a flight shape. */
  wireFlight: IAutoMovieMotionHumanWireFlight.IParams;

  /**
   * Stop, drop and roll: a protective drop to prone with the hands over the
   * face, then rolls onto each side and back.
   */
  stopDropRoll: IAutoMovieMotionHumanFirefight.IStopDropRoll;

  /**
   * An arrested fall on a wire: a free drop, a bounded uniform braking to a
   * stop above the floor, a hold and a lowering to stand.
   */
  wireArrest: IAutoMovieMotionHumanWireFlight.IArrest;
}
