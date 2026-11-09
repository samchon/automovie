import type { IAutoMovieModel } from "@automovie/interface";

/** Served URL only; the private artifact is not copied into maintained source. */
const FILES: Record<string, () => Promise<string>> = (
  import.meta as unknown as {
    glob(
      pattern: string,
      options: { query: string; import: string },
    ): Record<string, () => Promise<string>>;
  }
).glob("../../../../test/.shots/f1/reference-model.json", {
  query: "?url",
  import: "default",
});

/**
 * Read the campaign's fixed f1 reference artifact through the existing private-resource URL path.
 *
 * @param id Selected reference; other references keep their section display.
 * @returns Parsed typed artifact and exact byte identity, or an explicit fallback diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Uses Vite's served URL and fetches unchanged bytes with no-store; SHA-256 identifies those bytes before JSON decoding. The display adapter separately checks static mesh compatibility.
 * @evidence contracts/common.md#clear-and-simple-design One optional artifact read beside the existing section-pack reader; missing or unreadable data returns a diagnostic without breaking section display.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fetches only the existing authorized f1 artifact and never copies private vertices into maintained files or sends them outside the local resource endpoint.
 * @evidence contracts/common.md#meaningful-documentation Names source path, typed JSON premise, byte identity and explicit fallback. Parsing is not an admission of arbitrary model geometry.
 * @evidence contracts/performance.md#efficient-algorithms Fetch, digest, decode and parse take O(F) work for F artifact bytes; geometry validation is owned by the adapter.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains only the module's served-URL thunk; bytes are reread for each comparison request independently of the cached person's source definition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Buffer/text scratch ends with the call; the returned parsed model belongs to the request. No file handle, GPU object or cross-request model cache is created.
 */
export async function HumanDebugReferenceMeshFiles(id: string): Promise<{
  model: IAutoMovieModel | null;
  source: string;
  sha256: string | null;
  bytes: number | null;
  diagnostic: string | null;
}> {
  const source: string = "test/.shots/" + id + "/reference-model.json";
  const absent = (
    diagnostic: string,
  ): Awaited<ReturnType<typeof HumanDebugReferenceMeshFiles>> => ({
    model: null,
    source,
    sha256: null,
    bytes: null,
    diagnostic,
  });
  if (id !== "f1")
    return absent(
      "Native reference mesh is not selected outside the f1 campaign; using section support",
    );
  const file: (() => Promise<string>) | undefined = Object.values(FILES)[0];
  if (file === undefined)
    return absent("No private " + source + "; using section support");
  try {
    const response: Response = await fetch(await file(), { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const bytes: ArrayBuffer = await response.arrayBuffer();
    const digest: ArrayBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const sha256: string = [...new Uint8Array(digest)]
      .map((value: number): string => value.toString(16).padStart(2, "0"))
      .join("");
    const model: IAutoMovieModel = JSON.parse(
      new TextDecoder().decode(bytes),
    ) as IAutoMovieModel;
    return { model, source, sha256, bytes: bytes.byteLength, diagnostic: null };
  } catch (error: unknown) {
    return absent(
      "Cannot read " +
        source +
        ": " +
        (error instanceof Error ? error.message : String(error)) +
        "; using section support",
    );
  }
}
