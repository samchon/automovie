import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A paired screen transfer between two named scene seats.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the real source and destination, common world grip and timed phases.
 * @evidence contracts/development/design.md#principled-representation The seat references identify staged rigid contacts. A separate grip point is in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two actors share one meeting point and phase time. The support law handles ordinary contact fitting.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The supports and hands retain their own identities and each actor's anatomical solve.
 */
export interface IAutoMovieMotionHumanAssistedTransfer {
  /** The staged seat the receiver already sits on. */
  from: IAutoMovieMotionHumanAssistedTransfer.ISeatReference;

  /** The destination seat to bear on before the final release. */
  to: IAutoMovieMotionHumanAssistedTransfer.ISeatReference;

  /** Desired clasp point in world metres. The helper follows the reached palm. */
  clasp: IAutoMovieVector3;

  /** The facing hand of each performer. Defaults to right. */
  hand?: AutoMovieHumanSide;

  /** Seconds for each authored contact phase. */
  seconds?: number;
}

/** The staged supports and role-specific parameters of the paired transfer. */
export namespace IAutoMovieMotionHumanAssistedTransfer {
  /**
   * Which actor contributes the standing support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the helper and the actor departing the source seat.
   * @evidence contracts/development/design.md#principled-representation The two distinct roles add to the same mutual cast.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each value is used to choose one law's support sequence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each role names a performer in the actual cast.
   */
  export type Role = "helper" | "helped";

  /**
   * A bounded seat affordance on an existing prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the seat and the optional distance along its front edge.
   * @evidence contracts/development/design.md#principled-representation The names resolve to one placed seat frame and the offset stays within its width.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the named prop and contact plus an optional station along that contact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law refuses a missing seat or a point past the edge.
   */
  export interface ISeatReference {
    /** Staged prop identity. */
    prop: string;

    /** Seat affordance id on that prop. */
    point: string;

    /** Offset along the seat front edge in model metres. Defaults to its middle. */
    along?: number;
  }

  /**
   * One of the two configured bodies in the same transfer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names one role and the other actor of the cast.
   * @evidence contracts/development/design.md#principled-representation Both in-progress role plans share the same source, destination and timing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The mutual law only adds the actor's role and the other's identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner identifies an actual performer, whose pose the helper reads.
   */
  export interface IRoleParams extends IAutoMovieMotionHumanAssistedTransfer {
    /** Role received from the mutual cast. */
    role: Role;

    /** Subject of the other actor. */
    partner: string;
  }
}
