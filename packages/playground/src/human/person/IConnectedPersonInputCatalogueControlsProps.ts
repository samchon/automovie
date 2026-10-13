import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";
import type { IConnectedPersonUndescribedInput } from "./IConnectedPersonUndescribedInput";

/**
 * Inputs of `mountConnectedPersonInputCatalogue`: the person transaction, the listed inputs and the families that have no owner descriptor. A supplied getter refreshes descriptors from the current document's populations. Owner default preparation runs for explicit writes, including null disabling; removal skips preparation and follows the descriptor's removal path. Complete-person admission remains the inherited transaction owner's decision.
 *
 * @evidence contracts/common.md#principled-implementation Current descriptor authority and shared person intent govern scalar/closed-choice edits, while owner preparation and separate removal/null paths preserve omission semantics.
 * @evidence contracts/common.md#clear-and-simple-design The extension carries descriptor supply and optional default preparation on the existing section transaction contract rather than duplicating admission/history ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unpublished ranges remain named absent, changed populations are reread through a getter and removing an overlay does not silently seed an owner default.
 * @evidence contracts/common.md#meaningful-documentation The comment explains descriptor refresh, explicit-write versus removal preparation and distinct null-disable semantics before inherited admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input contract implements no catalogue traversal, DOM grouping or document-copy algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Descriptor supply chooses no cached catalogue equivalence across person populations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed descriptors and hooks allocate no listener, worker request or rendered frame in the type.
 *
 * @author Samchon
 */
export interface IConnectedPersonInputCatalogueControlsProps extends IConnectedPersonEyeControlsProps {
  /** Inputs with an owner descriptor in display order, or a getter reread whenever controls refresh. */
  inputs:
    | IConnectedPersonInputDescriptor[]
    | (() => IConnectedPersonInputDescriptor[]);

  /** Input families whose owner publishes no descriptor. */
  undescribed: IConnectedPersonUndescribedInput[];

  /**
   * Materialize the registered owner's omitted record before an explicit write, including null; removal skips this hook.
   *
   * @evidence contracts/common.md#principled-implementation Owner preparation preserves dependent default fields before editing one literal document path, with omission removal handled independently.
   * @evidence contracts/common.md#clear-and-simple-design A synchronous document handoff lets the owning default producer prepare records while the catalogue writer and panel own path copying and admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Catalogue controls do not infer a missing anatomical population or invoke preparation merely to remove an overlay.
   * @evidence contracts/common.md#meaningful-documentation The member specifies owner default provenance, explicit/null write timing and removal exclusion.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The hook type chooses no default materialization or document copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparing an authored candidate declares no numerical cache or shared mutable default identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned candidate data acquires no model handle or independently owned task in this signature.
   */
  prepare?: (
    document: IAutoMovieHumanPersonDocument,
    path: readonly string[],
  ) => IAutoMovieHumanPersonDocument;
}
