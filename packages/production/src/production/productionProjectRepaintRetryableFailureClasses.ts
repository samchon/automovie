import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/** Supported stored failure classes eligible for retry when the immutable request policy also permits them. */
export const productionProjectRepaintRetryableFailureClasses: ReadonlySet<AutoMovieRepaintFailureClass> = new Set([
    "timeout",
    "rate-limit",
    "transport",
    "provider-refusal",
    "internal",
]);
