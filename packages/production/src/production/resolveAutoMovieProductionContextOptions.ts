import type { AutoMovieProductionFrameCapture } from "@automovie/interface";

import type { IAutoMovieProductionContextOptions } from "./IAutoMovieProductionContextOptions";

/**
 * Capture named context dependencies or the supported positional constructor.
 *
 * A capture is callable, so it is disjoint from the named option record.
 * Undefined preserves the positional constructor's omitted capture. Copying
 * the record captures the host's choices without letting a later property
 * reassignment change the context; nested instruments and callbacks retain
 * their intended identities. Root and namespace admission remain with the
 * context constructor rather than being repeated here.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Preserves the exact host dependencies and evidence-reader identities across the named and positional context entries.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Captures one equivalent composition input while preserving the existing constructor's project selection semantics.
 */
export const resolveAutoMovieProductionContextOptions = (props: {
  input:
    | IAutoMovieProductionContextOptions
    | AutoMovieProductionFrameCapture
    | undefined;
  legacy: Omit<IAutoMovieProductionContextOptions, "capture">;
}): IAutoMovieProductionContextOptions =>
  typeof props.input === "function" || props.input === undefined
    ? { ...props.legacy, capture: props.input }
    : { ...props.input };
