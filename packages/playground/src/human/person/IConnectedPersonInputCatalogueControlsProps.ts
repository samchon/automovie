import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";
import type { IConnectedPersonUndescribedInput } from "./IConnectedPersonUndescribedInput";

/**
 * Inputs of `mountConnectedPersonInputCatalogue`: the person transaction, the
 * listed inputs and the families that have no owner descriptor.
 *
 * @author Samchon
 */
export interface IConnectedPersonInputCatalogueControlsProps extends IConnectedPersonEyeControlsProps {
  /** Inputs with an owner descriptor, in display order. */
  inputs:
    | IConnectedPersonInputDescriptor[]
    | (() => IConnectedPersonInputDescriptor[]);

  /** Input families whose owner publishes no descriptor. */
  undescribed: IConnectedPersonUndescribedInput[];

  /** Materialize an owning default before applying a scalar; removal skips this preparation. */
  prepare?: (
    document: IAutoMovieHumanPersonDocument,
    path: readonly string[],
  ) => IAutoMovieHumanPersonDocument;
}
