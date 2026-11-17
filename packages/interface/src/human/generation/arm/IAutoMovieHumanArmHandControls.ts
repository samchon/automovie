import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanArmWalk } from "./IAutoMovieHumanArmWalk";

/** Type contracts exchanged by AutoMovieHumanArmHandControls; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmHandControls {
  /** Arm publication and digit contacts consume the same complete distal field.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Arm publication and digit contacts consume the same complete distal field.
   * @evidence contracts/development/design.md#principled-representation `hand`: Wrist-to-cap contact domain, with forearm support for the shared scalar jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmHandControls.create. Also types AutoMovieHumanArmSources.shared, AutoMovieHumanArmWalk.handControls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `hand`; callers supply the complete record.
   */
  export interface IOutput {
    /** Wrist-to-cap contact domain, with forearm support for the shared scalar jets. */
    hand: IAutoMovieHumanArmWalk.IPrepared;

    /** Attach the original shared parameter, control values and jets to the arm input. */
    connect(
      input: IAutoMovieHumanSiteViewPart.IInput,
    ): IAutoMovieHumanSiteViewPart.IInput;

    /** Explicit arm scalar demand reuses identical local tape constraints. */
    prepare(
      input: IAutoMovieHumanSiteViewPart.IInput,
    ): IAutoMovieHumanArmWalk.IPrepared;
  }
}
