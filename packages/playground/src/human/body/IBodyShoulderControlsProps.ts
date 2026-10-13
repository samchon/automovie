import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyShoulderPose,
} from "@automovie/human";

/**
 * Inputs of `renderBodyShoulderControls`: one humerus's thorax-relative goal.
 *
 * `rest` and `shoulders` paint the current document while `currentRest` and
 * `currentShoulders` read the latest draft at event time, so newer pending
 * edits are retained.
 *
 * @author Samchon
 */
export interface IBodyShoulderControlsProps {
  /** Document the controls are created in. */
  dom: Document;

  /** Element whose children the controls replace. */
  container: HTMLElement;

  /** Humerus whose goal is shown. */
  bone: IAutoMovieHumanBodyShoulderPose["bone"];

  /** The basis joint's shoulder declaration: ranges and rest conventions. */
  shoulder: NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]>;

  /** Shape-only source-rig rest paired with the painted document. */
  rest: IAutoMovieHumanBodyShoulderPose;

  /** Latest draft rest, or unavailable after the transaction owner refused it. */
  currentRest: () => IAutoMovieHumanBodyShoulderPose | undefined;

  /** Shoulder goals painted into the inputs. */
  shoulders: readonly IAutoMovieHumanBodyShoulderPose[];

  /** Read the latest draft's shoulder goals at event time. */
  currentShoulders: () => readonly IAutoMovieHumanBodyShoulderPose[];

  /** Receive the new shoulder goals after an edit. */
  onChange: (shoulders: IAutoMovieHumanBodyShoulderPose[]) => void;
}
