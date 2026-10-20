import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintRuntimeIdentity } from "./IAutoMovieRepaintRuntimeIdentity";

/**
 * Exact runtime and authored generator context explicitly selected for repaint generation.
 *
 * @evidence contracts/common.md#principled-implementation The record pairs declared runtime identity with authored cost and consumer context; it performs no canonicalization, adapter comparison or request binding.
 * @evidence contracts/common.md#clear-and-simple-design Separates implementation identity from descriptive generator context in one retained adoption record without adding an execution service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record selects no provider and verifies no adoption; optional source, license and terms date remain descriptive metadata rather than verified legal-review evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines exact adapter identity and the required cost/consumer context with optional descriptive provenance limits.
 */
export interface IAutoMovieRepaintGeneratorAdoption {
  /** Provider, model, version, and execution boundary the adapter must report. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;

  /** Cost basis, production consumer, and optional descriptive metadata. */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;
}
