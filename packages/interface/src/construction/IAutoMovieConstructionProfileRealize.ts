import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/** Profile leaf selected by the construction walk for source-backed realization. */
export namespace IAutoMovieConstructionProfileRealize {
  /**
   * Resolve one pure profile leaf to its actual invocation-owned original
   * family.
   *
   * A detached declaration is compared structurally without property-order or
   * object-identity assumptions. Actual curve/frame functions then prepare the
   * retained atlas, physical2 grids and shared mesh boundaries once. Initial
   * source/preparation failures become a named leaf diagnostic, matching source
   * leaf admission; appended body/list changes roll back to the same
   * checkpoint. Exceptions from later retained readers keep their existing
   * operator policy.
   */
  export type INode = IAutoMovieConstructionProfile & {
    /** Selects the profile-source leaf handler in the construction walk. */
    type: "profile";
  };
}
