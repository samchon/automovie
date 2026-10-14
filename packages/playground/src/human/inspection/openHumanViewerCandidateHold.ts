import type { IHumanViewerCandidateHold } from "./IHumanViewerCandidateHold";

/**
 * Open a hold for one candidate: a request to `/generation/hold` that stays open while the candidate loads, so the server holds compile withdrawal for it. Releasing aborts the request, which closes the window, and then asks for the label the server gave it. A failed label request reads as null (unproven), never as a revision. The returned handle transfers its live hold request to the host, which must release it on candidate loading, refusal or removal. Missing opening token refuses and aborts immediately; repeated release calls share one completion.
 *
 * @evidence contracts/common.md#principled-implementation AbortController owns the live hold request, the response token identifies its window, and release aborts before consulting the server's label with explicit null for failed authority retrieval.
 * @evidence contracts/common.md#clear-and-simple-design One token/release handle exposes candidate lifetime while native hold and label HTTP details stay in this browser adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing tokens refuse instead of inventing source identity, and HTTP/JSON label failure never becomes a guessed current revision.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies held compile withdrawal, abort-before-label ordering, transferred host release duty, missing-token refusal and idempotent completion.
 * @evidence contracts/performance.md#efficient-algorithms Opening and release each perform one HTTP request plus O(t+b) query/token and label JSON work for t token characters and b reply bytes, independent of human mesh size.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated release calls share the same promise because they end the same owned window; distinct candidate openings acquire independent tokens and holds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One hold controller and optional release promise belong to the returned handle; missing-token failure aborts immediately, and host release aborts the hold. This adapter has no independent hold timeout or cap across candidate openings.
 */
export async function openHumanViewerCandidateHold(): Promise<IHumanViewerCandidateHold> {
  const controller: AbortController = new AbortController();
  const response: Response = await fetch("/generation/hold", {
    signal: controller.signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  const token: string | null = response.headers.get("X-Human-Generation");
  if (token === null || token === "") {
    controller.abort();
    throw new Error("The generation hold did not return its owned token.");
  }
  let released: Promise<string | null> | undefined;
  return {
    token,
    release: (): Promise<string | null> => {
      released ??= (async (): Promise<string | null> => {
        controller.abort();
        try {
          const response: Response = await fetch(
            "/generation/label?" + new URLSearchParams({ token }),
          );
          if (!response.ok) return null;
          const answer: IHumanViewerCandidateHoldLabel =
            (await response.json()) as IHumanViewerCandidateHoldLabel;
          return typeof answer.label === "string" ? answer.label : null;
        } catch {
          return null;
        }
      })();
      return released;
    },
  };
}

/**
 * Named local transport for openHumanViewerCandidateHold; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerCandidateHoldLabel {
  label?: string | null;
}
