import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

/**
 * The contacts the support rows share: the feet bearing on the floor, and a
 * part laid on the action's surface.
 */
export namespace HumanSupportContacts {
  /** The feet, bearing anywhere on the floor the stance's solve lays them. */
  export const FEET: readonly IAutoMovieMotionHumanSupport.IContact[] = [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ];

  /**
   * A part on the action's surface (`support.IParams.on`), on its own side, in
   * from the edge by an inset in forearm-and-hand lengths
   * (`IAutoMovieMotionHumanSupport.IContact.inset`).
   *
   * @param part The part that bears.
   * @param inset The inset from the edge, in forearm-and-hand lengths; 0 when
   *   absent.
   * @returns The contact.
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
