/**
 * Data and callback contracts shared by the ClassifyLocomoteGroundDisplacement operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Ground distance is the XZ norm and travel distance the XYZ norm, both metres; alreadyThere and verticalOnly classify those distances using the shared locomotion epsilon after the caller admits finite displacement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieClassifyLocomoteGroundDisplacement contracts used by packages/engine/src/motion/classifyLocomoteGroundDisplacement.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Ground distance is the XZ norm and travel distance the XYZ norm, both metres; alreadyThere and verticalOnly classify those distances using the shared locomotion epsilon after the caller admits finite displacement. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieClassifyLocomoteGroundDisplacement contract belongs to interface; packages/engine/src/motion/classifyLocomoteGroundDisplacement.ts and packages/engine/src/film/gatePerformShotStageAction.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieClassifyLocomoteGroundDisplacement {
  /**
   * Classify an admitted finite root displacement in metres into no travel, vertical-only travel or ground-plan travel using the shared locomotion epsilon.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Ground distance is the XZ norm and travel distance the XYZ norm, both metres; alreadyThere and verticalOnly classify those distances using the shared locomotion epsilon after the caller admits finite displacement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieClassifyLocomoteGroundDisplacement.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Ground distance is the XZ norm and travel distance the XYZ norm, both metres; alreadyThere and verticalOnly classify those distances using the shared locomotion epsilon after the caller admits finite displacement. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieClassifyLocomoteGroundDisplacement.IResult contract belongs to interface; packages/engine/src/motion/classifyLocomoteGroundDisplacement.ts and packages/engine/src/film/gatePerformShotStageAction.ts use this boundary. Runtime computation remains with those consumers.
   */
  export type IResult = {
    /** Horizontal XZ displacement length, metres. */
    groundDistance: number;

    /** Full XYZ displacement length, metres. */
    travelDistance: number;

    /** Full displacement is strictly below the shared epsilon. */
    alreadyThere: boolean;

    /** Meaningful full travel with horizontal travel strictly below epsilon. */
    verticalOnly: boolean;
  };
}
