import type { IConnectedPersonSourceUrls } from "./IConnectedPersonSourceUrls";

/**
 * Give a module worker the same resolved source URLs through its standard name.
 * Its static worker import stays recognizable to the production bundler. Only
 * source selection is encoded; no definition or numerical document is carried.
 * Omission preserves the published loader. The name also states the role the
 * one human worker entry loads (`worker=person`).
 *
 * @author Samchon
 */
export function connectedPersonSourceWorkerName(
  source: IConnectedPersonSourceUrls | undefined,
): string {
  return new URLSearchParams(
    source === undefined
      ? { worker: "person" }
      : { worker: "person", headSource: source.head, bodySource: source.body },
  ).toString();
}
