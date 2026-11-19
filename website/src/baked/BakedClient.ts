import { SITE_BASE } from "../SITE_BASE";
import type { ITake } from "../takes/structures/ITake";
import { BakedTake } from "./BakedTake";

/**
 * The page's side of the baked takes: fetch one, inflate it with the
 * browser's `DecompressionStream` and decode it. A take asked for twice is
 * fetched once for the life of the page; a failed fetch is forgotten, so a
 * later view asks again. The serve script and GitHub Pages answer 404 for a
 * take that was never baked, which is told apart from a broken one.
 */
export namespace BakedClient {
  /** What was baked: a scene's first take or a motion tried alone. */
  export type Kind = "scene" | "motion";

  /** The name of the error a take that was never baked fails with, so a caller computes it instead; any other failure is a broken bake. */
  export const MISSING: string = "BakedTakeMissing";

  /** Takes already asked for, by address. */
  const known: Map<string, Promise<ITake>> = new Map();

  /**
   * The address of a baked file.
   *
   * @param kind What was baked.
   * @param id The scene's id or the motion's name.
   * @param extension `take` for the take, `svg` for its still.
   * @returns The address under the site's base path.
   */
  export function address(
    kind: Kind,
    id: string,
    extension: "take" | "svg",
  ): string {
    return `${SITE_BASE}/baked/${kind}s/${encodeURIComponent(id)}.${extension}`;
  }

  /**
   * One baked take.
   *
   * @param kind What was baked.
   * @param id The scene's id or the motion's name.
   * @returns The take.
   * @throws {Error} When the file is missing or is not a baked take.
   */
  export function take(kind: Kind, id: string): Promise<ITake> {
    const url: string = address(kind, id, "take");
    const cached: Promise<ITake> | undefined = known.get(url);
    if (cached !== undefined) return cached;
    const loading: Promise<ITake> = load(url);
    known.set(url, loading);
    loading.catch((): void => {
      known.delete(url);
    });
    return loading;
  }

  /** Fetch, inflate and decode one take; a missing file fails with `MISSING`. */
  async function load(url: string): Promise<ITake> {
    const response: Response = await fetch(url);
    if (response.status === 404) {
      const missing: Error = new Error(`No baked take at ${url}`);
      missing.name = MISSING;
      throw missing;
    }
    if (!response.ok || response.body === null)
      throw new Error(`The baked take at ${url} failed to load (${response.status})`);
    const inflated: ArrayBuffer = await new Response(
      response.body.pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer();
    return BakedTake.decode(new Uint8Array(inflated));
  }
}
