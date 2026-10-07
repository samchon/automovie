import type { IHumanViewerCandidateHold } from "./IHumanViewerCandidateHold";

/**
 * Open a hold for one candidate: a request to `/generation/hold` that stays
 * open while the candidate loads, so the server holds compile withdrawal for
 * it. Releasing aborts the request, which closes the window, and then asks
 * for the label the server gave it. A failed label request reads as null
 * (unproven), never as a revision.
 *
 * @evidence contracts/common.md#principled-implementation The hold is the open request itself; its end is the release.
 * @evidence contracts/common.md#meaningful-documentation States the open, release and failure readings.
 */
export async function openHumanViewerCandidateHold(): Promise<IHumanViewerCandidateHold> {
  const controller = new AbortController();
  const response = await fetch("/generation/hold", {
    signal: controller.signal,
    cache: "no-store",
  });
  const token = response.headers.get("X-Human-Generation") ?? "";
  let released: Promise<string | null> | undefined;
  return {
    token,
    release: () => {
      released ??= (async () => {
        controller.abort();
        try {
          const answer = (await (
            await fetch("/generation/label?" + new URLSearchParams({ token }))
          ).json()) as IHumanViewerCandidateHoldLabel;
          return typeof answer.label === "string" ? answer.label : null;
        } catch {
          return null;
        }
      })();
      return released;
    },
  };
}

/** Named local transport for openHumanViewerCandidateHold; member meaning remains with its calculation owner. */
interface IHumanViewerCandidateHoldLabel {
  label?: string | null;
}
