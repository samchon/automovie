import { inspectAutoMovieDesignReferenceContainer } from "@automovie/production";

/** Exercise the actual public design-reference inspector with owned in-memory bytes and their diagnostic source path. */
export const inspect = (path: string, bytes: Uint8Array): unknown =>
  inspectAutoMovieDesignReferenceContainer({ path, bytes });
