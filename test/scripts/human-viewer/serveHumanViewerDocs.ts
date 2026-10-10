import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";

/**
 * Answer `/docs` with the catalogue the host currently publishes: every
 * drawable document with its basis token and cache key, and every refused or
 * pending entry with its reason. With `settled=1` it first settles the
 * inputs (every read and admission they start, waiting admissions asked
 * again) and publishes that catalogue, so a page about to show a pending
 * document reads its verdict. A `doc` selector reads and settles only that
 * document, leaving the host's complete inventory intact. Returns whether the
 * path was `/docs`.
 *
 * @evidence contracts/common.md#clear-and-simple-design The route only publishes the host's catalogue; composition and settling belong to the host.
 * @evidence contracts/common.md#meaningful-documentation States both answers and when each is given.
 */
export function serveHumanViewerDocs(
  props: IServeHumanViewerDataProps,
): boolean {
  if (props.url.pathname !== "/docs") return false;
  const selected = props.url.searchParams.get("doc");
  if (props.url.searchParams.get("settled") !== "1") {
    props.json(selected === null ? props.inventory : props.readDocument(selected));
    return true;
  }
  const settled = selected === null ? props.settleInputs() : props.settleDocument(selected);
  void settled
    .then((settled) => {
      if (selected === null) props.publish(settled);
      props.json(settled);
    })
    .catch((error: unknown) => {
      props.response.statusCode = 500;
      props.json({
        error:
          "Settling the catalogue failed: " +
          (error instanceof Error ? error.message : String(error)),
      });
    });
  return true;
}
