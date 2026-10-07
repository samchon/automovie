import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";

/**
 * Inputs of `mountConnectedPersonSections`: the mounted panel root, the
 * panel's own inputs, the one transaction every section edits through, and
 * whether the displayed person is a draft.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Hands the body sections the body view and the person transaction.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Hands the face sections the head view and the same transaction.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Gives every section the one intent order and refusal path of the panel.
 * @author Samchon
 */
export interface IConnectedPersonSectionsProps<Model extends IConnectedPersonModel> {
  /** The element holding the mounted panel markup. */
  app: HTMLElement;

  /** The panel's inputs: both partition views and the measurement readers and solvers. */
  panel: IConnectedPersonPanelProps<Model>;

  /** The working document and the transaction that edits it. */
  controls: Omit<IConnectedPersonEyeControlsProps, "container">;

  /** Whether the displayed person is a draft its owner did not accept. */
  isDraft: () => boolean;

  /** Current whole-person intent ticket, also used by the shared simple-tier controls. */
  currentIntent: () => number;

  /** A typed numerical draft retired its in-flight solve; restore settled status. */
  draftChanged: () => void;
}
