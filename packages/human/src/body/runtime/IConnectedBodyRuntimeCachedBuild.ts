import type { IAutoMovieHumanBodyBuild } from "../../index";

/**
 * The last admitted document text and its evaluated body. Reuse applies only
 * after parsing the next request, so matching text never bypasses admission.
 *
 * @author Samchon
 */
export interface IConnectedBodyRuntimeCachedBuild {
  /** Exact serialized text that produced this build. */
  document: string;

  /** Evaluated geometry and readings for that text. */
  built: IAutoMovieHumanBodyBuild;
}
