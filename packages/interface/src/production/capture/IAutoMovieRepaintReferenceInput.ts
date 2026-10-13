import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";

/**
 * One explicitly authored role-specific reference selected from the production asset manifest.
 *
 * @evidence contracts/common.md#principled-implementation The host resolves this exact path to current digest-matched registered bytes and preserves its declared semantic role in adapter input and candidate receipt identity.
 * @evidence contracts/common.md#clear-and-simple-design A role and path express selection while provenance, digest and byte ownership remain with the asset ledger and resolved host input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The path cannot discover arbitrary external content and roles cannot collapse into one generic image slot; missing or stale registered bytes refuse before generation.
 * @evidence contracts/common.md#meaningful-documentation Defines exact manifest-relative reference addressing and the non-collapsible authored adapter purpose.
 * @author Samchon
 */
export interface IAutoMovieRepaintReferenceInput {
  /** How the adapter must use this reference. */
  role: AutoMovieRepaintReferenceRole;

  /** Exact project-relative asset-manifest path. */
  path: string;
}
