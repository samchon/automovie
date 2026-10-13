import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceChannelScale,
} from "@automovie/human";

/**
 * What a fine channel control is built from.
 *
 * @author Samchon
 */
export interface ICreateConnectedFaceChannelControlProps {
  /** The admitted face basis. */
  basis: IAutoMovieHumanFaceBasis;

  /** The channel the control edits. */
  channel: IAutoMovieHumanFaceBasis["channels"][number];

  /** The channel's measured endpoint displacement. */
  scale: IAutoMovieHumanFaceChannelScale;

  /** The channel's component path, joined for search, when grouped. */
  group: string | undefined;

  /** The current draft document. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Reads the latest draft when a value is entered. */
  latest: () => IAutoMovieHumanFaceBasisDocument;
}
