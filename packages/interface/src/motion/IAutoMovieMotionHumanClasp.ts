import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Hold on to a partner or another carrier with the hands while keeping one's
 * own support: a passenger on the pillion holding the rider's waist, a rider
 * leading a second horse by its lead rope (ponying), a helper on the ground
 * cupping a rider's lower leg for a leg-up. The body is carried by its own
 * carrier's contact when `on` is named, and stays where it stands otherwise.
 */
export interface IAutoMovieMotionHumanClasp {
  /** The carrier the body rides; it stands on the ground when absent. */
  on?: string;

  /** The carrier contact the body is carried by; required with `on`. */
  frame?: string;

  /** How long the hold lasts, seconds. */
  duration: number;

  /** What the left hand holds; nothing when absent. */
  left?: IAutoMovieMotionHumanClasp.IHold;

  /** What the right hand holds; nothing when absent. */
  right?: IAutoMovieMotionHumanClasp.IHold;
}
export namespace IAutoMovieMotionHumanClasp {
  /** What a hand holds: a partner's bone, or another prop's contact. */
  export interface IHold {
    /** The partner's or the prop's subject id. */
    subject: string;

    /**
     * The partner's bone held, as the hips for a waist or a lower leg for a
     * leg-up.
     */
    bone?: AutoMovieHumanoidBone;

    /** The prop's contact held, as a led horse's `lead`. */
    contact?: string;
  }
}
