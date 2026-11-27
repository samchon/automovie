import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

export namespace SupportAssistData {
  /*
   * Contacts and instants of a paired support.
   */
  export const ROLES: readonly IAutoMovieMotionHumanSupport.AssistRole[] = [
    "helper",
    "helped",
  ];

  /*
   * Taking the lying palm, sitting under it, and transferring to the squat.
   */
  export const CONTACTS: readonly ["take", "seat", "lift"] = ["take", "seat", "lift"];
}
