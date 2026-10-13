import type { IAutoMovieHumanBodyBasisBuilderOptions } from "../structures/IAutoMovieHumanBodyBasisBuilderOptions";

/**
 * Options of `createConnectedBodyRuntime`.
 *
 * Contact readings and the arms-down solve hold the worker thread for at most
 * `sliceMs` before yielding through `yieldThread`.
 *
 * @author Samchon
 */
export interface IConnectedBodyRuntimeOptions {
  /** Actual constructor source context, including same-generation head endpoint contributions when required. */
  builderOptions?: IAutoMovieHumanBodyBasisBuilderOptions;

  /** Actual constructor/evaluation completions relayed to transport; no timer or synthetic event is emitted. */
  progress?: (stage: string) => void;

  /** Longest stretch a contact reading holds the thread, milliseconds. */
  sliceMs?: number;

  /** Hand the thread back; a macrotask by default so queued messages run. */
  yieldThread?: () => Promise<unknown>;
}
