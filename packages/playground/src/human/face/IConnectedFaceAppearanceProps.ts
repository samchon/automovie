import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";

/**
 * What the face appearance controls read and call: the admitted basis's
 * materials, the current draft and the panel's transaction and refusal owners.
 *
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
