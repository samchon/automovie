import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";

/**
 * The composition in the page's address, so a link reproduces a performance.
 *
 * The composition is JSON, compressed with lz-string, in the fragment under
 * the key `c`. The query is left to the inspector, which keeps its own
 * request there and refuses a key it does not know.
 */
export namespace PlaygroundAddress {
  /** The composition format this page reads and writes. */
  export const VERSION: number = 1;

  /** The fragment key the composition is kept under. */
  const KEY: string = "c";

  /**
   * Write a composition as a fragment.
   *
   * @param composition The composition.
   * @returns The fragment, with its leading `#`.
   */
  export function encode(composition: IPlaygroundComposition): string {
    return `#${KEY}=${compressToEncodedURIComponent(JSON.stringify(composition))}`;
  }

  /**
   * Read the composition of a fragment.
   *
   * @param hash The address's fragment, with or without its leading `#`.
   * @returns The composition, or null when the fragment carries none.
   * @throws {Error} When the fragment's composition cannot be read, or is of another version, naming the version it needs.
   */
  export function decode(hash: string): IPlaygroundComposition | null {
    const text: string | null = new URLSearchParams(
      hash.startsWith("#") ? hash.slice(1) : hash,
    ).get(KEY);
    if (text === null || text === "") return null;

    let value: unknown;
    try {
      value = JSON.parse(decompressFromEncodedURIComponent(text) ?? "");
    } catch {
      throw new Error("The address carries a composition that cannot be read");
    }
    if (typeof value !== "object" || value === null)
      throw new Error("The address carries a composition that cannot be read");

    const version: unknown = (value as { version?: unknown }).version;
    if (version !== VERSION)
      throw new Error(
        `The address carries a composition of version ${String(version)}; this page reads version ${VERSION}`,
      );
    const composition: IPlaygroundComposition = value as IPlaygroundComposition;
    if (
      typeof composition.seed !== "string" ||
      !Array.isArray(composition.performers) ||
      !Array.isArray(composition.mutuals)
    )
      throw new Error("The address carries a composition that cannot be read");
    return composition;
  }
}
