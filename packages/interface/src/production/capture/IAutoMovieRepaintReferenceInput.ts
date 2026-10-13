import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";

/** One fixed, role-specific reference consumed by repaint. */
export interface IAutoMovieRepaintReferenceInput {
  /** How the adapter must use this reference. */
  role: AutoMovieRepaintReferenceRole;

  /** Exact project-relative asset-manifest path. */
  path: string;
}
