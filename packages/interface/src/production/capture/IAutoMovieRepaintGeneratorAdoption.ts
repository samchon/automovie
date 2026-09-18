import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintRuntimeIdentity } from "./IAutoMovieRepaintRuntimeIdentity";

/**
 * Exact runtime and reviewed provenance selected for repaint generation.
 *
 * @evidence requirements/repaint/providers-models-and-credentials.md#repaint-execution-boundary Keeps the chosen execution boundary explicit beside the provider and model.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-execution-eligibility Binds the host adapter to one selected runtime and adoption record.
 */
export interface IAutoMovieRepaintGeneratorAdoption {
  /** Provider, model, version, and execution boundary the adapter must report. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;
  /** Cost basis, production consumer, and optional descriptive metadata. */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;
}
