import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceChannelScale,
} from "@automovie/human";

/**
 * What a fine channel control is built from.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Carries what one fine face channel control is built from.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Names the channel, its scale and the transaction the control edits through.
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
