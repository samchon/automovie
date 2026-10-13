import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintRuntimeIdentity } from "./IAutoMovieRepaintRuntimeIdentity";

/**
 * Exact runtime and authored generator context explicitly selected for repaint generation.
 *
 * @evidence contracts/common.md#principled-implementation Canonical adoption validates the runtime identity and reasoned cost/consumer context, then binds their canonical bytes into request identity and requires the adapter to report the selected runtime.
 * @evidence contracts/common.md#clear-and-simple-design Separates implementation identity from descriptive generator context while keeping both under one production-owned adoption.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The host does not choose a provider or model; optional source, license and terms date remain descriptive metadata rather than verified legal-review evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines exact adapter identity and the required cost/consumer context with optional descriptive provenance limits.
 * @author Samchon
 */
export interface IAutoMovieRepaintGeneratorAdoption {
  /** Provider, model, version, and execution boundary the adapter must report. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;

  /** Cost basis, production consumer, and optional descriptive metadata. */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;
}
