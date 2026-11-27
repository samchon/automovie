import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace IAutoMovieMotionHumanAuditPartner {
  /** One of the two people. */
  export interface IPerson {
    /** The person's subject in the motion. */
    subject: string;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;
  }

  /** One segment of one person inside one segment of the other. */
  export interface IPair {
    /** The person whose segment lies inside. */
    subject: string;

    /** That segment. */
    part: AutoMovieHumanoidBone;

    /** The person it lies in. */
    other: string;

    /** The segment it lies in. */
    into: AutoMovieHumanoidBone;

    /** How deep, metres, positive. */
    depth: number;

    /** The film second of that depth. */
    seconds: number;
  }

  /** The reading of {@link measure}. */
  export interface IResult {
    /**
     * The deepest pair, named `<subject> <part> in <other> <into>`; zero and
     * `none` when the bodies never pass into each other.
     */
    worst: IAutoMovieMotionHumanAuditMeasure;

    /**
     * Every directed pair that passed into each other at some instant, at its
     * deepest instant, deepest first.
     */
    pairs: IAutoMovieMotionHumanAuditPartner.IPair[];
  }
}
