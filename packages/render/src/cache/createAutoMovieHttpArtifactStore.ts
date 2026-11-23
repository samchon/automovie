import type { IAutoMovieArtifactStore } from "@automovie/interface";

/**
 * An engine artifact store a browser page reaches over HTTP, served by
 * `createAutoMovieArtifactMiddleware` from a directory store on the
 * production's development server.
 *
 * A page computing an expensive deterministic stage (a prepared figure, a
 * physics bake) cannot write files, and a fresh headless capture browser has
 * no persistent browser storage, so the cache lives with the server: one
 * directory serves the interactive Viewer and every render capture alike.
 * `GET <base>/<hex>` returns the bytes with header
 * `x-automovie-artifact-digest` or 404, `PUT` stores them with that header and
 * `DELETE` removes them, where `<hex>` is the key without `sha256:`. Digests
 * use `crypto.subtle`, available in secure contexts, which include
 * `http://localhost` and `http://127.0.0.1`.
 *
 * @param base Route prefix or absolute URL, such as `/__automovie/artifacts`.
 * @returns A store; a network failure or a non-success status rejects.
 */
export function createAutoMovieHttpArtifactStore(
  base: string,
): IAutoMovieArtifactStore {
  const url: (key: string) => string = (key: string): string => {
    if (!/^sha256:[0-9a-f]{64}$/.test(key))
      throw new Error(`Invalid artifact key: ${key}`);
    return `${base.replace(/\/+$/, "")}/${key.slice(7)}`;
  };
  const expect: (response: Response, operation: string) => void = (
    response: Response,
    operation: string,
  ): void => {
    if (!response.ok)
      throw new Error(
        `Artifact ${operation} failed with HTTP ${response.status}`,
      );
  };
  return {
    read: async (
      key: string,
    ): Promise<IAutoMovieArtifactStore.IEntry | undefined> => {
      const response: Response = await fetch(url(key));
      if (response.status === 404) return undefined;
      expect(response, "read");
      const digest: string | null = response.headers.get(HEADER);
      if (digest === null) throw new Error("Artifact read lacks its digest");
      return { bytes: new Uint8Array(await response.arrayBuffer()), digest };
    },
    write: async (
      key: string,
      entry: IAutoMovieArtifactStore.IEntry,
    ): Promise<void> => {
      expect(
        await fetch(url(key), {
          method: "PUT",
          headers: { [HEADER]: entry.digest },
          body: entry.bytes as BodyInit,
        }),
        "write",
      );
    },
    remove: async (key: string): Promise<void> => {
      expect(await fetch(url(key), { method: "DELETE" }), "remove");
    },
    digest: async (bytes: Uint8Array): Promise<string> =>
      `sha256:${Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", bytes as BufferSource),
        ),
        (byte: number): string => byte.toString(16).padStart(2, "0"),
      ).join("")}`,
  };
}

/** Response and request header carrying the entry's recorded digest. */
const HEADER: string = "x-automovie-artifact-digest";
