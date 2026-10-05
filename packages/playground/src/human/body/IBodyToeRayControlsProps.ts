import type { IAutoMovieHumanBodyBasis, IAutoMovieHumanBodyToePose } from "@automovie/human";

/**
 * Inputs of `renderBodyToeRayControls`.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the basis, side and document toe rows the toe ray controls edit.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the toe pose transaction of the joint panel.
 * @author Samchon
 */
export interface IBodyToeRayControlsProps {
  /** The panel's document. */
  dom: Document;

  /** Where the rows are appended. */
  container: HTMLElement;

  /** The compiled body basis. */
  basis: IAutoMovieHumanBodyBasis;

  /** The foot whose rays are shown. */
  side: "left" | "right";

  /** The current document's toe rows. */
  toes: () => readonly IAutoMovieHumanBodyToePose[];

  /** Commit a new set of toe rows. */
  onChange: (toes: IAutoMovieHumanBodyToePose[]) => void;
}
