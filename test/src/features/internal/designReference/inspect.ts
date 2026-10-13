import { inspectAutoMovieDesignReferenceContainer } from "../../../../../packages/production/src/production/designReference/inspectAutoMovieDesignReferenceContainer";

/** Exercise the actual public design-reference inspector with owned in-memory bytes and their diagnostic source path. */
export function inspect(path: string, bytes: Uint8Array): unknown {
  return inspectAutoMovieDesignReferenceContainer({ path, bytes });
}
