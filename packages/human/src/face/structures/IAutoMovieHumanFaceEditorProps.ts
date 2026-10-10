import type { IAutoMovieHumanFaceDocument } from "./IAutoMovieHumanFaceDocument";

/**
 * A validated initial document/model pair and its asynchronous rebuild owner.
 *
 * The editor copies documents and treats models as opaque immutable results.
 * The caller owns worker cancellation and renderer resources. An optional
 * synchronous, nonreentrant publisher runs inside the generation-checked
 * commit before its pair/history assignment, with no intervening await. It
 * must finish refusal checks before mutating the displayed result; the editor
 * cannot roll back arbitrary external effects. Omission leaves publication
 * with the caller after a successful request. An optional disposer releases a
 * successfully returned candidate that is superseded or refused by publication
 * before commit; it must preserve resources shared with the displayed or
 * newer model. Omission leaves that
 * release with the caller, as in existing editor integrations.
 *
 * @evidence contracts/common.md#principled-implementation The injected builder admits each candidate; a synchronous nonreentrant publisher can join display publication to the same commit, while the caller retains resource ownership and obsolete-candidate release.
 * @evidence contracts/common.md#clear-and-simple-design One initial pair and explicit rebuild, optional publication and obsolete-candidate release effects supply the transaction owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same injected builder serves edits and restoration; no document-specific construction route is supplied.
 * @evidence contracts/common.md#meaningful-documentation The initial validation precondition, publication's synchronous/nonreentrant and refusal-before-mutation limits and disposal's shared-resource ownership are stated with the supplied effects.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props transport a document/model pair and define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The supplied document's owner defines its channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The injected builder owns emitted geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The props preserve the supplied document and model frames without conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The injected builder owns shared boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The caller publishes and observes renderer results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The supplied document and builder own anatomical quantities.
 * @evidenceExclude contracts/anatomy.md#permitted-range The injected builder admits each candidate's supported values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props introduce no anatomical authoring input or conversion.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEditorProps<
  Model,
  Document = IAutoMovieHumanFaceDocument,
> {
  /** Initially validated settings; the editor keeps its own copy. */
  document: Document;

  /** Immutable renderer-owned result of the initial settings. */
  model: Model;

  /** Admit and rebuild an owned document copy without publishing it. */
  build: (document: Document) => Promise<Model>;

  /** Publish synchronously without reentering the editor; finish refusal checks before live mutation. */
  publish?: (model: Model) => void;

  /** Release a superseded or publication-refused result while retaining shared live resources. */
  dispose?: (model: Model) => void;
}
