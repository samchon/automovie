import { IAutoMovieFilmBuildContext, IAutoMovieFilmEdit } from "@automovie/interface";
import typia from "typia";
import type { ISourceBuildResult } from "./ISourceBuildResult";
import { buildSourceExport } from "./buildSourceExport";
import { FILM_SOURCE_EXPORT } from "./FILM_SOURCE_EXPORT";
import { FILM_SOURCE_PATH } from "./FILM_SOURCE_PATH";

/**
 * Build the synchronous named film export from the authored project module before ordered shot compilation, returning schema or loader diagnostics. The ordinary Node module loader executes current project source; this function does not sandbox authored side effects or enforce deterministic execution.
 *
 * @evidence contracts/common.md#principled-implementation buildSourceExport selects the fixed src/film.ts path and film export, passes the current build context, and applies exact typia validation to the returned edit. The calling builder's source digest describes its supplied source snapshot, while execution reads the current project module under the builder's existing input fences.
 * @evidence contracts/common.md#clear-and-simple-design This film-specific adapter supplies only module protocol and schema; loader behavior, promise rejection, source provenance, and error conversion remain with buildSourceExport. runAutoMovieProductionBuild invokes it after design readiness and before shot compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The literal path and export name define the authored film protocol, not a fixture exception. An invalid or asynchronous export yields diagnostics rather than a fabricated edit; ordinary authored effects and change-and-return races remain limitations of the existing loader.
 * @evidence contracts/common.md#meaningful-documentation The comment states synchronous export admission, execution order, schema diagnostics, current-source loading, and the lack of a sandbox or deterministic-effect guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Module loading and authored execution dominate project-dependent time and memory; exact edit validation scans the returned structure. No author-workload bound or measured speedup is claimed by this adapter.
 * @evidence contracts/performance.md#reuse-equivalent-work Each build supplies its own context and source identity to the loader. This adapter adds no cross-build cache or shared effectful execution, and follows the loader's existing module-resolution behavior.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result carries the edit and source diagnostics to the build owner. The adapter opens no handles itself and cannot reclaim arbitrary timers, processes, or other resources created by authored module execution.
 */
export const buildFilmEdit: (props: { source: string; sourceRoot: string; context: IAutoMovieFilmBuildContext; }) => ISourceBuildResult<IAutoMovieFilmEdit> = (props: {
  source: string;
  sourceRoot: string;
  context: IAutoMovieFilmBuildContext;
}): ISourceBuildResult<IAutoMovieFilmEdit> =>
  buildSourceExport<IAutoMovieFilmEdit>({
    target: "film",
    label: "film edit",
    path: FILM_SOURCE_PATH,
    exportName: FILM_SOURCE_EXPORT,
    source: props.source,
    sourceRoot: props.sourceRoot,
    context: props.context,
    validate: (input: unknown) : typia.IValidation<IAutoMovieFilmEdit> => typia.validateEquals<IAutoMovieFilmEdit>(input),
  });
