import type {
  IAutoMovieMeshPlaneContour,
  IAutoMoviePlaneFrame,
  IAutoMovieRecoveryIndexedMesh,
} from "../../index";

/**
 * Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours. An explicit registered sign bypasses global-volume inference and retains the supplied material-side convention for open or independently oriented source shells.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours. An explicit registered sign bypasses global-volume inference and retains the supplied
 * @evidence contracts/development/design.md#principled-representation Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours. An explicit registered sign bypasses global-volume inference and retains the supplied
 * @evidence contracts/development/design.md#minimal-and-owned-surface bindRecoveryOrderedFits, extractRecoveryMeshSections, sourceOrientation share IAutoMovieMeshSectionOrientation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieMeshSectionOrientation {
  /**
   * Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours. An explicit registered sign bypasses global-volume inference and retains the supplied material-side convention for open or independently oriented source shells.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours. An explicit registered sign bypasses global-volume inference and retains the supplied
   * @evidence contracts/development/design.md#principled-representation Builds a private supporting-face orientation witness; its result distinguishes outer from cavity contours. An explicit registered sign bypasses global-volume inference and retains the supplied
   * @evidence contracts/development/design.md#minimal-and-owned-surface bindRecoveryOrderedFits, extractRecoveryMeshSections, sourceOrientation share IAutoMovieMeshSectionOrientation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    orientation?: "signed-volume" | 1 | -1,
  ) => (
    plane: IAutoMoviePlaneFrame,
    polyline: IAutoMovieMeshPlaneContour,
  ) => number;
}
