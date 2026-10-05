import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";

/**
 * What the face appearance controls read and call: the admitted basis's
 * materials, the current draft and the panel's transaction and refusal owners.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Carries the materials and draft the face appearance controls edit.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Names the transaction and refusal owners appearance edits go through.
 * @author Samchon
 */
export interface IConnectedFaceAppearanceProps {
  /** The admitted face basis whose materials the controls list. */
  basis: IAutoMovieHumanFaceBasis;

  /** The current draft face document. */
  document: () => IAutoMovieHumanFaceBasisDocument;

  /** Commit a face document through the panel's transaction. */
  change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
