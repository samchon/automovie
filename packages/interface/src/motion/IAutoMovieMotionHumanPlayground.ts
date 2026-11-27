import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Authoring inputs for riding playground equipment whose motion the rider
 * drives: a pumped swing, a seesaw, a pushed roundabout and the leap off a
 * swing.
 */
export namespace IAutoMovieMotionHumanPlayground {
  /**
   * A seated rider pumping a swing: leaning back with the legs extended while
   * the seat swings forward along the rider's facing, and sitting up with the
   * knees bent while it swings back.
   */
  export interface ISwingPumpParams {
    /** Scene subject id of the hanging seat. */
    on: string;

    /** The seat's sitting point id. */
    seat: string;

    /** The chain point each hand holds, by point id. */
    hands: Partial<Record<AutoMovieHumanSide, string>>;

    /** Duration in seconds, positive. */
    duration: number;

    /** The trunk's lean back from upright at full pump, degrees in [0, 45]. */
    lean: number;
  }

  /**
   * A seated seesaw rider: the seat carried on the beam, the hands on the
   * handles, and the feet on the ground while that end of the beam is low.
   */
  export interface ISeesawRideParams {
    /** Scene subject id of the beam. */
    on: string;

    /** The rider's seat point id on the beam. */
    seat: string;

    /** The handle point each hand holds, by point id. */
    hands: Partial<Record<AutoMovieHumanSide, string>>;

    /** Duration in seconds, positive. */
    duration: number;

    /** Ground height in metres; zero when absent. */
    ground?: number;
  }

  /**
   * Running alongside a roundabout with one hand on a grab bar: a walk on the
   * ground whose hand holds the bar as the disc turns with it.
   */
  export interface IRoundaboutPushParams {
    /** World target of the walk, metres. */
    to: IAutoMovieVector3;

    /** World points the walk passes on the way, metres. */
    via?: IAutoMovieVector3[];

    /** Scene subject id of the disc. */
    on: string;

    /** The grab bar's point id on the disc. */
    bar: string;

    /** The hand on the bar. */
    hand: AutoMovieHumanSide;
  }

  /**
   * A leap off a moving swing seat to the ground: the body leaves the seat with
   * the seat's velocity and lands standing.
   */
  export interface ISwingLeapParams {
    /** Scene subject id of the hanging seat left. */
    on: string;

    /** Ground height in metres; zero when absent. */
    ground?: number;
  }
}
