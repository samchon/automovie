import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceChannelScale,
} from "@automovie/human";

/**
 * What a fine channel control is built from.
 *
 * The painted document supplies initial values, while `latest` supplies the event-time draft used to preserve unrelated newer edits. Endpoint displacement statistics describe source responses; they are not measurement targets or universal clinical limits.
 *
 * @evidence contracts/common.md#principled-implementation Admitted channel metadata and endpoint scales determine row presentation, and latest draft access provides the base for replacing one canonical weight without discarding other pending edits.
 * @evidence contracts/common.md#clear-and-simple-design The producer receives source metadata, painted values and current draft access while the mounting panel owns DOM and full-document admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source displacement statistics do not become requested physical measurements, and event-time edits do not reconstruct unrelated state from neutral content.
 * @evidence contracts/common.md#meaningful-documentation The comment separates painted and latest documents, names endpoint-statistic provenance and states the optional search group meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This producer input shape chooses no displacement, unit conversion or document clone algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema carries existing scale data but declares no basis or numerical result memoization.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed source and document references acquire no native handle, listener or frame.
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

  /**
   * Read the latest draft at input time so replacing one weight keeps other pending changes.
   *
   * @evidence contracts/common.md#principled-implementation Event-time draft lookup supplies the source document for one canonical coordinate replacement.
   * @evidence contracts/common.md#clear-and-simple-design The getter exposes current authored state without transferring panel history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A painted snapshot cannot silently replace newer unrelated draft fields.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input-time access and preservation of other pending fields.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no state access or document copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading current draft declares no shared numerical result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The borrowed returned document acquires no running task or renderer resource.
   */
  latest: () => IAutoMovieHumanFaceBasisDocument;
}
