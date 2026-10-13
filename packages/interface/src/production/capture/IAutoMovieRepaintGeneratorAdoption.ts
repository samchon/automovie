import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintRuntimeIdentity } from "./IAutoMovieRepaintRuntimeIdentity";

/** Exact runtime and reviewed provenance selected for repaint generation. */
export interface IAutoMovieRepaintGeneratorAdoption {
  /** Provider, model, version, and execution boundary the adapter must report. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;

  /** Cost basis, production consumer, and optional descriptive metadata. */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;
}
