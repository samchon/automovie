import { AutoMovieDesignReferenceContainerError } from "../../../../../packages/production/src/production/designReference/AutoMovieDesignReferenceContainerError";
import { AutoMovieUtf8Error } from "../../../../../packages/production/src/production/strictUtf8";
import { inspect } from "./inspect";

/** Observe the native typed container or UTF-8 refusal from actual public inspection. */
export function refuses(
  path: string,
  bytes: Uint8Array,
  kind: "container" | "encoding" = "container",
): boolean {
  try {
    inspect(path, bytes);
    return false;
  } catch (error) {
    return kind === "container"
      ? error instanceof AutoMovieDesignReferenceContainerError
      : error instanceof AutoMovieUtf8Error;
  }
}
