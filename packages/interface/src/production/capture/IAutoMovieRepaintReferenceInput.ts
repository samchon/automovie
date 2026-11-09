import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";

/**
 * One explicitly authored role-specific reference selected from the production asset manifest.
 *
 * @evidence contracts/development/design.md#principled-representation A closed role and string path describe an authored reference selection; this erased type resolves no manifest entry, digest or adapter input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A role and path express selection without duplicating provenance, digest or bytes in each authored reference.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record provides no external discovery mechanism, but path containment, current bytes and role preservation require a consumer; no retained generation host enforces them.
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact manifest-relative reference addressing and the non-collapsible authored adapter purpose.
 */
export interface IAutoMovieRepaintReferenceInput {
  /** How the adapter must use this reference. */
  role: AutoMovieRepaintReferenceRole;

  /** Exact project-relative asset-manifest path. */
  path: string;
}
