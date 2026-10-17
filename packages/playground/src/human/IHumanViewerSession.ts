import {
  IAutoMovieHumanAppearance,
  IAutoMovieHumanCurveSupplement,
  IAutoMovieHumanExpression,
  IAutoMovieHumanIdentity,
  IAutoMovieHumanPose,
  IAutoMovieHumanTraits,
} from "@automovie/human";

/**
 * The saved state of the Human page: the four documents a person is rendered from, plus the traits that last produced the identity.
 *
 * The identity, pose, expression and appearance are the canonical state, admitted by `@automovie/human` before the page accepts them, so a resumed session renders the same person; the traits are editing history and never override a saved identity. The page writes this shape to local storage and to downloaded files, and refuses a file of another `format` or `version`.
 *
 * @evidence contracts/common.md#principled-implementation Stores the public Human documents verbatim, so resuming replays the same admitted inputs rather than a derived render state.
 * @evidence contracts/common.md#clear-and-simple-design One flat record holds each document under its own name; admission and rendering stay with the page and the package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry, camera or viewer state is persisted in place of the documents, so a resumed render is recomputed from the documents alone.
 * @evidence contracts/common.md#meaningful-documentation States which documents are canonical, that traits are history, and how foreign formats are refused.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record shape performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record shape coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record shape owns no resource.
 *
 * @author Samchon
 */
export interface IHumanViewerSession {
  /** Format tag that identifies a Human page session file. */
  format: "automovie-human-session";

  /** Session version; files of another version are refused, not migrated. */
  version: 1;

  /** Beginner traits that last produced the identity, kept as editing history. */
  traits: IAutoMovieHumanTraits;

  /** Detailed identity the person is built from. */
  identity: IAutoMovieHumanIdentity;

  /** Static pose applied to the person. */
  pose: IAutoMovieHumanPose;

  /** Facial expression applied to the person. */
  expression: IAutoMovieHumanExpression;

  /** Surface appearance the model is generated with. */
  appearance: IAutoMovieHumanAppearance;

  /** Optional separate curve inspection state; it never changes skin admission. */
  curveDesign?: {
    /** Visible construction source, restored with the physical measurements. */
    source: "current-skin" | "curve-design";

    /** Named physical measurements, without source frames or control vectors. */
    detailed?: IAutoMovieHumanCurveSupplement;

    /** Whether independently generated existing skin is compared with the design. */
    compareExistingSurface: boolean;

    /** Whether the ordinary inspection draws cage vertices and control polygons; omission preserves their visible default. */
    showControlPoints?: boolean;

    /** Explicit candidate representation; omission preserves the existing external R6b design. */
    pelvisRepresentation?: "external-r6b" | "pants-r6";
  };
}
