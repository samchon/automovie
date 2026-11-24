import type { IAutoMovieHumanSectionSource } from "../limb/IAutoMovieHumanSectionSource";
import type { IAutoMovieHumanSiteControls } from "../limb/IAutoMovieHumanSiteControls";
import type { IAutoMovieHumanArmWalk } from "./IAutoMovieHumanArmWalk";

/**
 * Shared distal arm controls used by hand contacts and explicit whole-arm
 * preparation. Runtime construction and admission remain with
 * AutoMovieHumanArmHandControls in Human.
 */
export namespace IAutoMovieHumanArmHandControls {
  /** Arm publication and digit contacts consume the same complete distal field. */
  export interface IOutput {
    /**
     * Wrist-to-cap contact domain, with forearm support for the shared scalar
     * jets.
     */
    hand: IAutoMovieHumanArmWalk.IPrepared;

    /** Admitted forearm-to-cap coefficients of this same hand declaration. */
    field: IAutoMovieHumanSiteControls.IField | null;

    /**
     * Attach the original shared parameter, control values and jets to the arm
     * input.
     */
    connect(input: IAutoMovieHumanSectionSource): IAutoMovieHumanSectionSource;

    /** Explicit arm scalar demand reuses identical local tape constraints. */
    prepare(
      input: IAutoMovieHumanSectionSource,
    ): IAutoMovieHumanArmWalk.IPrepared;
  }
}
