import { IAutoMovieActorContext } from "@automovie/engine";
import { IAutoMovieDiagnostic, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Actor contexts, current scene-node positions, actor-bound models and source diagnostics for one thin program. Maps are attempt-owned and their nested records borrow staged/model data.
 *
 * @evidence contracts/common.md#principled-implementation Exact node-keyed maps connect actor synthesis, skeleton lookup and target resolution while diagnostics preserve failed joins and clip/gait refusals.
 * @evidence contracts/common.md#clear-and-simple-design One runtime result supplies the compiler's existing callback capabilities; it owns no browser, worker or independent actor host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned maps do not guarantee absence of diagnostics, and readonly semantics are not imposed on nested borrowed records; assembly must refuse errors before compilation.
 * @evidence contracts/common.md#meaningful-documentation States map key roles, metre position units, borrowed rig/model references and error-bearing result ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result shape does not scan actors or clips; actorRuntimeOf owns those algorithms and fallback model resolution costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface adds no actor or clip cache; its producer builds the actual maps from the current program.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; the build attempt owns maps and borrowed staged/model references.
 * @author Samchon
 */
export interface IProductionShotActorRuntime {
  /** Admitted actor contexts keyed by exact staged actor node id. */
  actors: Map<string, IAutoMovieActorContext>;

  /** Actor, set-piece and camera positions in metres, keyed by scene node id. */
  nodes: Map<string, IAutoMovieVector3>;

  /** Actor-bound borrowed runtime models, keyed by actor node id. */
  models: Map<string, IAutoMovieModel>;

  /** Actor/model, gait-name and selected enact-clip refusal findings. */
  diagnostics: IAutoMovieDiagnostic[];
}
