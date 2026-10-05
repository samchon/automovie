import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceComponentTree,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * What the connected face controls read and call: the admitted basis, the
 * optional simple map and component tree, the current draft, and the panel's
 * transaction and refusal owners.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Carries the basis, control map, component tree and draft the face controls edit.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Names the transaction and refusal owners face control edits go through.
 * @author Samchon
 */
export interface IConnectedFaceControlsProps {
  /** The admitted face basis whose channels the controls list. */
  basis: IAutoMovieHumanFaceBasis;

  /** The simple coordinate map, when the basis has one. */
  map?: IAutoMovieHumanFaceControlMap;

  /** The component tree that groups fine controls for navigation. */
  components?: IAutoMovieHumanFaceComponentTree;

  /** The current draft face document. */
  document: () => IAutoMovieHumanFaceBasisDocument;

  /** Commit a face document through the panel's transaction. */
  change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
