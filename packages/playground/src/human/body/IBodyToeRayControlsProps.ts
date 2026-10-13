import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyToePose,
} from "@automovie/human";

/**
 * Inputs of `renderBodyToeRayControls`.
 *
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
