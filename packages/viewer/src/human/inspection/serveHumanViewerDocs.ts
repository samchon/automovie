import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";

/**
 * Answer `/docs` with the catalogue the host currently publishes: every drawable document with its basis token and cache key, and every refused or pending entry with its reason. With `settled=1` it first settles the inputs (every read and admission they start, waiting admissions asked again) and publishes that catalogue, so a page about to show a pending document reads its verdict. A `doc` selector reads and settles only that document, leaving the host's complete inventory intact. Returns whether the path was `/docs`.
 *
 * @evidence contracts/common.md#principled-implementation Returns current complete inventory or a selected document, and explicitly settled reads await existing input/admission owners before publishing only a complete-inventory result.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue reading, settlement and publication are supplied capabilities; this route owns selection and JSON/refusal response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A selected-document settlement never replaces the host's full inventory with its projection, and failed settlement answers a cause instead of guessed readiness.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains pending/refused entries, settled reads, selection scope and full-inventory preservation.
 * @evidence contracts/performance.md#efficient-algorithms Adapter work is fixed URL branching plus serialization of returned catalogue bytes; input reads and admission traversals remain with their supplied owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Nonsettled reads borrow the current published inventory, while settlement owners share their actual stamped input/admission work under current authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The route retains its response and selected settlement promise until completion, creates no worker and leaves background input-resource retirement with their owners.
 */
export function serveHumanViewerDocs(
  props: IServeHumanViewerDataProps,
): boolean {
  if (props.url.pathname !== "/docs") return false;
  const selected: string | null = props.url.searchParams.get("doc");
  if (props.url.searchParams.get("settled") !== "1") {
    props.json(
      selected === null ? props.inventory : props.readDocument(selected),
    );
    return true;
  }
  const settled: ReturnType<IServeHumanViewerDataProps["settleInputs"]> =
    selected === null ? props.settleInputs() : props.settleDocument(selected);
  void settled
    .then((settled: IServeHumanViewerDataProps["inventory"]): void => {
      if (selected === null) props.publish(settled);
      props.json(settled);
    })
    .catch((error: unknown): void => {
      props.response.statusCode = 500;
      props.json({
        error:
          "Settling the catalogue failed: " +
          (error instanceof Error ? error.message : String(error)),
      });
    });
  return true;
}
