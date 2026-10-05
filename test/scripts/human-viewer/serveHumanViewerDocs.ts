import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";

/**
 * Answer `/docs` with the catalogue the host currently publishes: every
 * drawable document with its basis token and cache key, and every refused or
 * pending entry with its reason. With `settled=1` it first settles the
 * inputs (every read and admission they start, waiting admissions asked
 * again) and publishes that catalogue, so a page about to show a pending
 * document reads its verdict. Returns whether the path was `/docs`.
 *
 * @evidence contracts/common.md#clear-and-simple-design The route only publishes the host's catalogue; composition and settling belong to the host.
 * @evidence contracts/common.md#meaningful-documentation States both answers and when each is given.
 */
export function serveHumanViewerDocs(props: IServeHumanViewerDataProps): boolean {
  if (props.url.pathname !== "/docs") return false;
  if (props.url.searchParams.get("settled") !== "1") {
    props.json(props.inventory);
    return true;
  }
  void props.settleInputs().then((settled) => {
    props.publish(settled);
    props.json(settled);
  }).catch((error: unknown) => {
    props.response.statusCode = 500;
    props.json({ error: "Settling the catalogue failed: " + (error instanceof Error ? error.message : String(error)) });
  });
  return true;
}
