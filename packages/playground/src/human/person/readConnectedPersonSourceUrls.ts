import type { IConnectedPersonSourceUrls } from "./IConnectedPersonSourceUrls";

/**
 * Select a complete caller-owned source pair from editor or worker parameters.
 * Omission keeps the published source. A partial pair refuses before loading;
 * relative URLs resolve against the supplying page before worker propagation.
 * Fetch and the product generation owner retain byte, schema and identity checks.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets one editor select its actual typed source pair without replacing the published assets.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Preserves one source selection through page and resident workers.
 * @author Samchon
 */
export function readConnectedPersonSourceUrls(
  search: string,
  base: string,
): IConnectedPersonSourceUrls | undefined {
  const fields = new URLSearchParams(search);
  const head = fields.get("headSource");
  const body = fields.get("bodySource");
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
  const resolve = (value: string): string => {
    const url = new URL(value, base);
    if (!["http:", "https:", "blob:"].includes(url.protocol))
      throw new Error(
        "Person source definitions require an HTTP(S) or caller-owned blob URL.",
      );
    return url.href;
  };
  return { head: resolve(head), body: resolve(body) };
}
