import type { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";

/**
 * One explicitly authored role-specific reference selected from the production
 * asset manifest.
 */
export interface IAutoMovieRepaintReferenceInput {
  /** How the adapter must use this reference. */
  role: AutoMovieRepaintReferenceRole;

  /** Exact project-relative asset-manifest path. */
  path: string;
}
