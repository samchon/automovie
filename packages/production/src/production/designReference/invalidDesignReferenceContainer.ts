import { AutoMovieDesignReferenceContainerError } from "./AutoMovieDesignReferenceContainerError";

/**
 * Construct the shared typed refusal without losing the source path, observed family or exact parsing stage.
 */
export const invalidDesignReferenceContainer = (
  path: string,
  family: string,
  stage: string,
  detail: unknown,
): AutoMovieDesignReferenceContainerError =>
  new AutoMovieDesignReferenceContainerError(
    path,
    family,
    stage,
    detail instanceof Error ? detail.message : String(detail),
  );
