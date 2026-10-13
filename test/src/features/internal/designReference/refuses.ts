import { AutoMovieDesignReferenceContainerError, AutoMovieUtf8Error } from "@automovie/production";
import { inspect } from "./inspect";

/** Observe the native typed container or UTF-8 refusal from actual public inspection. */
export const refuses = (
  path: string,
  bytes: Uint8Array,
  kind: "container" | "encoding" = "container",
): boolean => {
  try {
    inspect(path, bytes);
    return false;
  } catch (error) {
    return kind === "container"
      ? error instanceof AutoMovieDesignReferenceContainerError
      : error instanceof AutoMovieUtf8Error;
  }
};
