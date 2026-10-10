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
