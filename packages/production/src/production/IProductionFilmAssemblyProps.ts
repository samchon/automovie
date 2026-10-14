import { IAutoMovieBuildProjectInput, IAutoMovieCompiledContractRealization, IAutoMovieCompiledShotSource, IAutoMovieFilmBuildContext, IAutoMovieFilmEdit, IAutoMovieShotContract } from "@automovie/interface";
import type { ISourceBuildResult } from "./ISourceBuildResult";

/**
 * Current build inputs borrowed by film assembly: admitted authored source, production context, shot contracts, compiled sources, realizations, and requested scope. Runtime targets become binding at review scope and later.
 *
 * @evidence contracts/common.md#principled-implementation Readonly keyed maps expose current shot identity, while the source result retains its failure diagnostics and scope preserves the established source-versus-review runtime policy. The type itself performs no identity validation.
 * @evidence contracts/common.md#clear-and-simple-design One internal props interface carries the actual dependencies of assembly and continuity helpers without introducing another build service or public configuration path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source and realization outcomes are represented by their existing result and map protocols, rather than made successful by this shape. Readonly maps restrict consumer access without freezing their underlying owner state.
 * @evidence contracts/common.md#meaningful-documentation Each member identifies its build-stage purpose, shot-id keying, borrowed context, or scope policy. The comment explains that runtime admission still belongs to assembly.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface chooses no runtime processing algorithm; map lookups and timeline scans occur in assembleFilm and its helpers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type does not coordinate requests or cache equivalence. The current build owns the source, context, and keyed maps and supplies them for one assembly attempt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface retains no runtime resource and imposes no population bound. Source results, keyed shot records, and context lifetimes remain with the invoking build.
 *
 * @author Samchon
 */
export interface IProductionFilmAssemblyProps {
  /** Film export and diagnostics produced before ordered shot compilation. */
  source: ISourceBuildResult<IAutoMovieFilmEdit>;

  /** Current production, available asset, and world context borrowed from the build. */
  context: IAutoMovieFilmBuildContext;

  /** Current shot contracts keyed by their authored shot ids. */
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;

  /** Successfully compiled source records keyed by shot id. */
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;

  /** Current realized predicate groups used for boundary continuity checks. */
  realizations: ReadonlyMap<string, IAutoMovieCompiledContractRealization>;

  /** Requested compile scope; the runtime target is only binding from review on. */
  scope: IAutoMovieBuildProjectInput["scope"];
}
