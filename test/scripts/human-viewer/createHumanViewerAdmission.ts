import type { ICreateHumanViewerAdmissionProps } from "./ICreateHumanViewerAdmissionProps";
import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";

interface IVerdict {
  key: string;
  admission: IHumanViewerAdmission;
}

/**
 * Keep the page's admission verdict for each hand-written document. The
 * server does not load the human runtime, so a document's schema is judged by
 * its owner in the page; until that verdict exists for the document's current
 * cache key (document, basis and builder source together) the document is
 * pending and stays out of the drawable catalogue, listed among the rejected
 * inputs with that state. A request goes to the page once per key while a
 * generation is ready; a page that is not ready leaves the document pending
 * and the host asks again when one becomes ready. A page that failed for good
 * refuses with its cause, so no client waits on it. A failed request is kept
 * as the refusal reason, never as admission. One verdict is kept per document id,
 * so the record grows only with the inputs.
 *
 * @evidence contracts/common.md#principled-implementation A document is drawable only after its owner admitted it at its exact cache key; unknown is never treated as valid.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds verdicts and requests in flight; page access and republication are injected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holds no schema of its own and refuses with the owner's reason.
 * @evidence contracts/common.md#meaningful-documentation States the pending state, request policy, failure handling and growth bound.
 */
export function createHumanViewerAdmission(props: ICreateHumanViewerAdmissionProps) {
  const verdicts = new Map<string, IVerdict>();
  const asking = new Map<string, string>();
  const inFlight = new Set<Promise<void>>();
  return {
    /** The verdict for this entry at its key, starting the page's admission when none exists. */
    of: (entry: IHumanViewerCatalogueEntry): IHumanViewerAdmission => {
      const kept = verdicts.get(entry.id);
      if (kept !== undefined && kept.key === entry.key) return kept.admission;
      const page = props.page();
      // A failed page never admits anything: the document is refused with the
      // cause until the viewer is restarted, instead of pending forever.
      if (page.state === "failed")
        return { state: "refused",
          reason: `cannot be admitted: the viewer page failed (${page.reason}); restart the viewer with human-shot.mts ensure` };
      if (page.state === "starting")
        return { state: "pending", reason: `awaiting admission: the viewer page is starting (${page.reason})` };
      if (asking.get(entry.id) !== entry.key) {
        asking.set(entry.id, entry.key);
        const request: Promise<void> = props.admit(entry.domain, JSON.stringify(entry.document))
          .then((reason): IHumanViewerAdmission => reason === null
            ? { state: "admitted", reason: null } : { state: "refused", reason })
          .catch((error: unknown): IHumanViewerAdmission => ({ state: "refused",
            reason: "Admission could not run: " + (error instanceof Error ? error.message : String(error)) }))
          .then((admission) => {
            // A newer key started its own request; this verdict is outdated.
            if (asking.get(entry.id) !== entry.key) return;
            asking.delete(entry.id);
            verdicts.set(entry.id, { key: entry.key, admission });
            props.changed();
          })
          .catch((error: unknown) => {
            console.error("Admission verdict could not be published for " + entry.id + ": " +
              (error instanceof Error ? error.message : String(error)));
          })
          .finally(() => { inFlight.delete(request); });
        inFlight.add(request);
      }
      return { state: "pending", reason: "awaiting admission by the viewer page" };
    },

    /** Whether any admission asked of the page is still awaiting its verdict. */
    busy: (): boolean => inFlight.size !== 0,

    /** Resolves when every admission already asked of the page has its verdict. */
    settled: async (): Promise<void> => {
      while (inFlight.size !== 0) await Promise.all([...inFlight]);
    },
  };
}
