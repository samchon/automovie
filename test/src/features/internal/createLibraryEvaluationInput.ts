import {
  validateAutoMovieEnvironmentContext,
  validateBuiltEnvironment,
  validateModel,
} from "@automovie/engine";
import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";
import type { buildLibrarySource } from "@automovie/production";

/**
 * A library evaluation attempt supplied entirely through typed host inputs.
 *
 * Scenarios provide the source reader and evaluator. They exchange bytes and
 * schema-checked owner contributions, without a module fixture, OS behavior or
 * foreign method replacement. The native domain validators remain unchanged.
 */
export const createLibraryEvaluationInput = (props: {
  sources: string[];
  readSource: (source: string) => Uint8Array;
  evaluate: typeof buildLibrarySource;
  contexts: ReadonlyMap<string, IAutoMovieLibraryBuildContext>;
  bindings: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];
}) => ({
  ...props,
  root: "library-runtime",
  sourceBranches: new Map(
    [...props.contexts].map(([owner, context]) => [
      owner,
      context.branch === "productionSources"
        ? "productionSources"
        : "modelSources",
    ]),
  ),
  requireReviewed: true,
  validators: {
    environment: validateBuiltEnvironment,
    model: validateModel,
    context: validateAutoMovieEnvironmentContext,
  },
});
