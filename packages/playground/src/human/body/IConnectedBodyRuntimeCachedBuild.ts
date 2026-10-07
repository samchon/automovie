import type { IAutoMovieHumanBodyBuild } from "@automovie/human";

/**
 * The last admitted document text and its evaluated body. Reuse applies only
 * after parsing the next request, so matching text never bypasses admission.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Retains the evaluated preview for an identical admitted request.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Names the cached numerical build independently of transport or export bytes.
 * @author Samchon
 */
export interface IConnectedBodyRuntimeCachedBuild {
  /** Exact serialized text that produced this build. */
  document: string;

  /** Evaluated geometry and readings for that text. */
  built: IAutoMovieHumanBodyBuild;
}
