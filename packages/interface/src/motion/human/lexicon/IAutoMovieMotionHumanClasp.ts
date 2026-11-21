import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * Hold on to a partner or another carrier with the hands while keeping one's own support (#3951): a passenger on the pillion holding the rider's waist, a rider leading a second horse by its lead rope (ponying), a helper on the ground cupping a rider's lower leg for a leg-up. The body is carried by its own carrier's contact when `on` is named, and stays where it stands otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The carrier the body rides. frame: Its contact the body is carried by. seconds: How long the hold lasts. left, right: What each hand holds.
 * @evidence contracts/development/design.md#principled-representation Subject, contact and bone ids and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanClasp` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The held points are the partner's displayed bones and the other carrier's own contacts.
 */
export interface IAutoMovieMotionHumanClasp {
  /** The carrier the body rides; it stands on the ground when absent. */
  on?: string;

  /** The carrier contact the body is carried by; required with `on`. */
  frame?: string;

  /** How long the hold lasts, seconds. */
  seconds: number;

  /** What the left hand holds; nothing when absent. */
  left?: IAutoMovieMotionHumanClasp.IHold;

  /** What the right hand holds; nothing when absent. */
  right?: IAutoMovieMotionHumanClasp.IHold;
}
export namespace IAutoMovieMotionHumanClasp {
  /**
   * What a hand holds: a partner's bone, or another prop's contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation subject: The partner's or the prop's subject id. bone: The partner's bone. contact: The prop's contact.
   * @evidence contracts/development/design.md#principled-representation A subject and either a bone or a contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanClasp`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHold {
    /** The partner's or the prop's subject id. */
    subject: string;

    /** The partner's bone held, as the hips for a waist or a lower leg for a leg-up. */
    bone?: AutoMovieHumanoidBone;

    /** The prop's contact held, as a led horse's `lead`. */
    contact?: string;
  }
}
