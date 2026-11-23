import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

/**
 * The contacts the support rows share: the feet bearing on the floor, and a
 * part laid on the action's surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each contact is and where an inset is measured from.
 * @evidence contracts/development/design.md#principled-representation Contacts are the support planner's own `IContact` records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two contacts the scramble and the slide read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No place is written here; the composition's surface gives it.
 */
export namespace HumanSupportContacts {
  /** The feet, bearing anywhere on the floor the stance's solve lays them. */
  export const FEET: readonly IAutoMovieMotionHumanSupport.IContact[] = [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ];

  /**
   * A part on the action's surface (`support.IParams.on`), on its own side,
   * in from the edge by an inset in forearm-and-hand lengths
   * (`IAutoMovieMotionHumanSupport.IContact.inset`).
   *
   * @param part The part that bears.
   * @param inset The inset from the edge, in forearm-and-hand lengths; 0 when absent.
   * @returns The contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the part, the inset and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation A bearing contact on the surface, the inset left out when zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export const on = (
    part: IAutoMovieMotionHumanSupport.Part,
    inset: number = 0,
  ): IAutoMovieMotionHumanSupport.IContact => ({
    part,
    kind: "bear",
    target: "on",
    ...(inset === 0 ? {} : { inset }),
  });
}
