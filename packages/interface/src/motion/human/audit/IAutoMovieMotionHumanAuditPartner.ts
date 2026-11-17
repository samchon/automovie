import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * How deep two people's bodies pass into one another: the hand that sinks
 * into a partner's shoulder, the fist that ends inside a head, the two
 * trunks of an embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins
 * meet, never that one body may enter the other. How much a pressed skin
 * gives is the caller's limit to state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation depth: How deep, metres, positive. worst: The deepest pair, named `<subject> <part> in <other> <into>`; zero and `none` when the bodies never pass into each other.
 * @evidence contracts/development/design.md#principled-representation depth: How deep, metres, positive. worst: The deepest pair, named `<subject> <part> in <other> <into>`; zero and `none` when the bodies never pass into each other.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure, one); audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure, other); audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure.read, from); audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure.read, to); audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure, return); audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure.pairs, x).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAuditPartner {
  /**
   * One of the two people.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names.
   * @evidence contracts/development/design.md#principled-representation A subject of the motion with the body its bones belong to.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both needed to place the person's colliders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IPerson {
    /** The person's subject in the motion. */
    subject: string;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;
  }

  /**
   * One segment of one person inside one segment of the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit or whose it is.
   * @evidence contracts/development/design.md#principled-representation The entering part, the entered part, the depth and its instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, each needed to find the defect in a film.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bones keep their rig type; no optional member.
   */
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

  /**
   * The reading of {@link measure}.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its order or its empty value.
   * @evidence contracts/development/design.md#principled-representation The deepest pair as a measure, and every pair for diagnosis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, as the self-penetration reading has.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member; no pair reads as a zero measure named `none`.
   */
  export interface IResult {
    /** The deepest pair, named `<subject> <part> in <other> <into>`; zero and `none` when the bodies never pass into each other. */
    worst: IAutoMovieMotionHumanAuditMeasure;

    /** Every directed pair that passed into each other at some instant, at its deepest instant, deepest first. */
    pairs: IAutoMovieMotionHumanAuditPartner.IPair[];
  }
}
