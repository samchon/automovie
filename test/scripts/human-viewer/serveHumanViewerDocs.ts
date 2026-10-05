import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";

/**
 * Answer `/docs` with the catalogue the host currently publishes: every
 * drawable document with its basis token and cache key, and every refused or
 * pending entry with its reason. Returns whether the path was `/docs`.
 *
 * @evidence contracts/common.md#clear-and-simple-design The route only publishes the host's catalogue; composition belongs to the catalogue reader.
 * @evidence contracts/common.md#meaningful-documentation States what the answer holds.
 */
export function serveHumanViewerDocs(props: IServeHumanViewerDataProps): boolean {
  if (props.url.pathname !== "/docs") return false;
  props.json(props.inventory);
  return true;
}
