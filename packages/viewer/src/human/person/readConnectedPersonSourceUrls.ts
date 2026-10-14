import type { IConnectedPersonSourceUrls } from "@automovie/viewer/human/person/IConnectedPersonSourceUrls";

/**
 * Select a complete caller-owned source pair from editor or worker parameters. Omission returns no override; a partial/blank pair refuses before loading. Relative URLs resolve against the supplying page before worker propagation. URL text is not evidence of content, identity or a healthy model; fetch and generation owners retain those checks.
 *
 * @evidence contracts/common.md#principled-implementation URLSearchParams selects the two named fields, pair validation rejects missing halves and the URL parser normalizes supported HTTP(S)/blob references against the supplied base.
 * @evidence contracts/common.md#clear-and-simple-design Parsing produces only source references; fetching, schema validation, generation construction and publication remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported schemes and partial pairs throw rather than silently substituting a fixture; omitted overrides do not establish default asset availability.
 * @evidence contracts/common.md#meaningful-documentation The comment states omission, pair refusal, relative resolution and the limits of URL validation.
 * @evidence contracts/performance.md#efficient-algorithms Two fields are read from one query parse and two URLs are normalized, with work/storage proportional to query and URL text lengths; no asset bytes are loaded here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parsing retains no URL/content cache; callers propagate the returned absolute pair to worker loading instead of resolving relative references against a worker URL.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two returned strings survive the call. Blob URL lifetime belongs to its creator and is not revoked by this reader, which acquires no fetch, worker or timer.
 *
 * @author Samchon
 */
export function readConnectedPersonSourceUrls(
  search: string,
  base: string,
): IConnectedPersonSourceUrls | undefined {
  const fields: URLSearchParams = new URLSearchParams(search);
  const head: string | null = fields.get("headSource");
  const body: string | null = fields.get("bodySource");
  if (head === null && body === null) return undefined;
  if (
    head === null ||
    body === null ||
    head.trim() === "" ||
    body.trim() === ""
  )
    throw new Error(
      "A person source selection needs both headSource and bodySource URLs.",
    );
  const resolve: (value: string) => string = (value: string): string => {
    const url: URL = new URL(value, base);
    if (!["http:", "https:", "blob:"].includes(url.protocol))
      throw new Error(
        "Person source definitions require an HTTP(S) or caller-owned blob URL.",
      );
    return url.href;
  };
  return { head: resolve(head), body: resolve(body) };
}
