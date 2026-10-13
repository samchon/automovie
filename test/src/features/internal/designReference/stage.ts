import { AutoMovieDesignReferenceContainerError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { inspect } from "./inspect";

/**
 * Return native admitted facts or the container refusal's family and stage.
 * Callers author valid UTF-8 for text families. Unexpected error classes fail
 * the scenario rather than being converted into a plausible parser stage.
 */
export const stage = (path: string, bytes: Uint8Array): string => {
  try {
    return JSON.stringify(inspect(path, bytes));
  } catch (error) {
    TestValidator.predicate(
      "the candidate failed through its native typed container refusal",
      error instanceof AutoMovieDesignReferenceContainerError,
    );
    const refusal = error as AutoMovieDesignReferenceContainerError;
    return `${refusal.family}:${refusal.stage}`;
  }
};
