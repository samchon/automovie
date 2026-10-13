import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";

/**
 * Inputs of `mountConnectedPersonSections`: the mounted panel root, the
 * panel's own inputs, the one transaction every section edits through, and
 * whether the displayed person is a draft.
 *
 * @author Samchon
 */
export interface IConnectedPersonSectionsProps<
  Model extends IConnectedPersonModel,
> {
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
