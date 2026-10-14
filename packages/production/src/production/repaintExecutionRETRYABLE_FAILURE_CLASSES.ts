import { AutoMovieRepaintFailureClass, AutoMovieRepaintRetryableFailureClass } from "@automovie/interface";

/**
 * The existing five retryable protocol causes populate one module-owned Set shared by policy/disclosure admission. Construction is bounded by five strings and lookups avoid rebuilding the vocabulary per attempt. Maintained callers never mutate it; policy still decides whether an admitted cause may retry. The module retains the Set for its lifetime without buffers, handles or running tasks, and it encodes the supported protocol rather than fixture outcomes.
 */
export const repaintExecutionRETRYABLE_FAILURE_CLASSES: ReadonlySet<AutoMovieRepaintFailureClass> =
  new Set<AutoMovieRepaintRetryableFailureClass>([
    "timeout",
    "rate-limit",
    "transport",
    "provider-refusal",
    "internal",
  ]);
