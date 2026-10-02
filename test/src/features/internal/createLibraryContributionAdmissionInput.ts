import { validateAutoMovieEnvironmentContext, validateBuiltEnvironment, validateModel } from "@automovie/engine";
import type { IAutoMovieDiagnostic, IAutoMovieEnvironmentContext, IAutoMovieLibraryContribution, IAutoMovieModel } from "@automovie/interface";

/**
 * One compilation attempt's contribution, identity maps and domain validators.
 *
 * The normalized contribution arrives as typed input. Each map is mutable only
 * within this attempt; a scenario reuses them to prove that a later owner cannot
 * replace the first. The native validators are ordinary callable inputs, so a
 * separate policy scenario can supply the validation result it must classify
 * without changing or patching an engine implementation.
 */
export const createLibraryContributionAdmissionInput = (
  contribution: IAutoMovieLibraryContribution & { contexts: IAutoMovieEnvironmentContext[] },
) => ({
  contextOwner: new Map<string, string>(),
  environmentOwner: new Map<string, string>(),
  modelOwner: new Map<string, string>(),
  models: new Map<string, IAutoMovieModel>(),
  diagnostics: [] as IAutoMovieDiagnostic[],
  registration: { design: "docs/models/ship.md#ship", export: "ship", contribution },
  source: "src/models/ship.ts",
  target: "library:models:docs/models/ship.md#ship",
  validators: {
    environment: validateBuiltEnvironment,
    model: validateModel,
    context: validateAutoMovieEnvironmentContext,
  },
});
