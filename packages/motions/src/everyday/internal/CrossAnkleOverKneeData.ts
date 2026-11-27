import type { IAutoMovieMotionHumanEntryState, IAutoMovieMotionHumanContactWindow } from "@automovie/interface";

export namespace CrossAnkleOverKneeData {
  /*
   * Provisional seconds for lifting or returning the leg.
   */
  export const TRAVEL: number = 0.85;

  /*
   * Fitted ankle tolerance, metres, for accepting the staged contact.
   */
  export const FIT_GAP: number = 0.01;

  /*
   * Make a full-length contact window from the support already under the
   * performer.
   */
  export const continueContact = (
    contact: IAutoMovieMotionHumanEntryState.ISupport,
  ): IAutoMovieMotionHumanContactWindow => ({ ...contact, from: 0, to: 1 });
}
