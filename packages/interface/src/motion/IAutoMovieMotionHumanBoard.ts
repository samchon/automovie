import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Board a moving carrier's seat at speed: from running beside a cantering
 * horse, from a balcony above a passing one, from another galloping horse's
 * saddle, or from the ground behind a rider's saddle, the performer leaves its
 * support moving with the carrier and lands astride the named seat, optionally
 * holding the carrier's horn or a partner's forearm on the way.
 */
export interface IAutoMovieMotionHumanBoard {
  /** The carrier's subject id. */
  on: string;

  /** The carrier's seat contact the performer lands astride on. */
  seat: string;

  /** The flight's time, seconds; 0.6 when absent. */
  duration?: number;

  /**
   * How far the flight rises above the straight way from the take-off to the
   * seat, metres; 0.3 when absent.
   */
  height?: number;

  /**
   * What a hand holds from the take-off until just before the landing: the
   * carrier's horn or a partner's forearm; nothing when absent.
   */
  hand?: IAutoMovieMotionHumanBoard.IHand;

  /**
   * The carrier's declared load: what it may carry and what it carries already,
   * kilograms; unchecked when absent.
   */
  load?: IAutoMovieMotionHumanBoard.ILoad;
}
export namespace IAutoMovieMotionHumanBoard {
  /** A carrier's declared load. */
  export interface ILoad {
    /** The most the carrier may carry, kilograms. */
    capacity: number;

    /** What it carries already, kilograms, as a rider in the saddle. */
    carried: number;
  }

  /** A hand's hold on the way: a carrier contact, or a partner's bone. */
  export interface IHand {
    /** The holding hand. */
    side: AutoMovieHumanSide;

    /** The carrier contact held; absent when a partner is held. */
    contact?: string;

    /** The partner's subject id; absent when a carrier contact is held. */
    partner?: string;

    /** The partner's bone held. */
    bone?: AutoMovieHumanoidBone;
  }
}
