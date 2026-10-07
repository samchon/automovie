import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Inputs of `mountBodyJointControls`: the joint picker and the selected
 * joint's controls bound to the latest body draft.
 *
 * `current` reads the latest draft; `change` publishes an edited document and
 * `refuse` returns an unsupported pending shape to the panel's transaction
 * owner. Bone selection stays outside the document.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Binds named joint inputs to the latest body draft and hands refusals back to the panel.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Leaves draft publication and last-valid recovery with the injected change and refusal owners.
 * @author Samchon
 */
export interface IBodyJointControlsProps {
  /** Document the controls are created in. */
  dom: Document;

  /** Element whose children the controls replace. */
  container: HTMLElement;

  /** Admitted basis declaring the joints. */
  basis: IAutoMovieHumanBodyBasis;

  /** Initially selected bone. */
  bone: AutoMovieHumanoidBone;

  /** Joint filter text. */
  query: string;

  /** Read the latest draft document. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** Record a new bone selection outside the document. */
  select: (bone: AutoMovieHumanoidBone) => void;

  /** Ask the panel to redraw the controls. */
  redraw: () => void;

  /** Publish an edited draft document. */
  change: (document: IAutoMovieHumanBodyBasisDocument) => void;

  /** Return a refused pending shape to the transaction owner. */
  refuse: (error: unknown) => void;
}
