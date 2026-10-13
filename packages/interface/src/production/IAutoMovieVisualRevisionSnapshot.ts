import { IAutoMovieVisualRevisionView } from "./IAutoMovieVisualRevisionView";

/**
 * One named visual catalog at one production revision.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualRevisionSnapshot {
  /** Non-blank production or compile revision identity. */
  revision: string;

  /** Non-blank identity of the observation population. */
  catalog: string;

  /** Unique subject-view records in arbitrary input order. */
  views: IAutoMovieVisualRevisionView[];
}
