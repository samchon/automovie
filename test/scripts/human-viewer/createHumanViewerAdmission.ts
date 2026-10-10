import type { ICreateHumanViewerAdmissionProps } from "./ICreateHumanViewerAdmissionProps";
import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerAdmissionOutcome } from "./IHumanViewerAdmissionOutcome";
import type { IHumanViewerAdmissionStatus } from "./IHumanViewerAdmissionStatus";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerKeyedAdmission } from "./IHumanViewerKeyedAdmission";

/**
 * Keep the page's admission verdict for each document. The server does not
 * load the human runtime, so a document's schema is judged by its owner in a
 * viewer frame through the host page's bridge; until a verdict exists for the
 * document's current cache key (document, basis and builder source together)
 * the document is pending and stays out of the drawable catalogue, listed
 * among the rejected inputs with that state.
 *
 * A request goes to the page once per key. Only an owner's answer is a
 * verdict. A bridge with no loaded frame, or a request that could not run
 * (the page navigating, its context replaced), stores no verdict: the
 * document waits, pending with that reason, and is asked again only when
 * `retry` is called, which the host does on its trigger events (a frame
 * announcing its admission, a generation becoming ready, an explicit settle
 * request). Nothing re-asks on its own, so a bridge that never arrives
 * leaves named pending entries and no loop. A page that failed for good
 * refuses with its cause, so no client waits on it. One verdict and at most
 * one waiting reason are kept per document id, so the records grow only with
 * the documents.
 *
 * @evidence contracts/common.md#principled-implementation A document is drawable only after its owner admitted it at its exact cache key; a transport failure is never stored as the owner's verdict.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds verdicts, waiting documents and requests in flight; page access, republication and retry triggers are injected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holds no schema of its own, refuses with the owner's reason, and never polls.
 * @evidence contracts/common.md#meaningful-documentation States the pending states, the request and retry policy, failure handling and growth bound.
 */
export function createHumanViewerAdmission(
  props: ICreateHumanViewerAdmissionProps,
) {
  const verdicts = new Map<string, IHumanViewerKeyedAdmission>();
  const waiting = new Map<string, IHumanViewerKeyedAdmission>();
  const asking = new Map<string, string>();
  const inFlight = new Set<Promise<void>>();
  const requests = new Map<string, Promise<void>>();
  /** Why a document whose admission could not be judged now waits. */
  const unavailable = (): string => {
    const page = props.page();
    return page.state === "starting"
      ? `awaiting admission: the viewer page is starting (${page.reason}); asked again when a viewer frame loads`
      : "awaiting admission: no viewer frame has loaded the current source; asked again when one loads";
  };
  return {
    /** Read the current verdict without starting unrelated document work. */
    peek: (entry: IHumanViewerCatalogueEntry): IHumanViewerAdmission => {
      const kept = verdicts.get(entry.id);
      if (kept?.key === entry.key) return kept.admission;
      const held = waiting.get(entry.id);
      if (held?.key === entry.key) return held.admission;
      return { state: "pending", reason: "awaiting admission by the viewer page" };
    },
    /** The verdict for this entry at its key, starting the page's admission when none exists. */
    of: (entry: IHumanViewerCatalogueEntry): IHumanViewerAdmission => {
      const kept = verdicts.get(entry.id);
      if (kept !== undefined && kept.key === entry.key) return kept.admission;
      const page = props.page();
      // A failed page never admits anything: the document is refused with the
      // cause until the viewer is restarted, instead of pending forever.
      if (page.state === "failed")
        return {
          state: "refused",
          reason: `cannot be admitted: the viewer page failed (${page.reason}); restart the viewer with human-shot.mts ensure`,
        };
      const held = waiting.get(entry.id);
      if (held !== undefined && held.key === entry.key) return held.admission;
      if (asking.get(entry.id) !== entry.key) {
        asking.set(entry.id, entry.key);
        waiting.delete(entry.id);
        const request: Promise<void> = props
          .admit(entry.domain, JSON.stringify(entry.document), entry.basis)
          .then((reply): IHumanViewerAdmissionOutcome => {
            if (
              typeof reply.available !== "boolean" ||
              (reply.reason !== null && typeof reply.reason !== "string")
            )
              throw new Error(
                "The viewer returned an incompatible admission envelope",
              );
            return !reply.available
              ? {
                  verdict: false,
                  admission: { state: "pending", reason: unavailable() },
                }
              : {
                  verdict: true,
                  admission:
                    reply.reason === null
                      ? { state: "admitted", reason: null }
                      : { state: "refused", reason: reply.reason },
                };
          })
          .catch(
            (error: unknown): IHumanViewerAdmissionOutcome => ({
              verdict: false,
              admission: {
                state: "pending",
                reason:
                  "awaiting admission: the request could not run (" +
                  (error instanceof Error ? error.message : String(error)) +
                  "); asked again when a viewer frame loads",
              },
            }),
          )
          .then((outcome) => {
            // A newer key started its own request; this answer is outdated.
            if (asking.get(entry.id) !== entry.key) return;
            asking.delete(entry.id);
            (outcome.verdict ? verdicts : waiting).set(entry.id, {
              key: entry.key,
              admission: outcome.admission,
            });
            props.changed();
          })
          .catch((error: unknown) => {
            console.error(
              "Admission result could not be published for " +
                entry.id +
                ": " +
                (error instanceof Error ? error.message : String(error)),
            );
          })
          .finally(() => {
            inFlight.delete(request);
            if (requests.get(entry.id) === request) requests.delete(entry.id);
          });
        inFlight.add(request);
        requests.set(entry.id, request);
      }
      return {
        state: "pending",
        reason: "awaiting admission by the viewer page",
      };
    },

    /** Forget why documents wait, so the next catalogue reading asks the page again; returns how many waited. */
    retry: (doc?: string): number => {
      if (doc !== undefined) return waiting.delete(doc) ? 1 : 0;
      const released = waiting.size;
      waiting.clear();
      return released;
    },

    /** Whether any admission asked of the page is still awaiting its answer. */
    busy: (doc?: string): boolean => doc === undefined ? inFlight.size !== 0 : requests.has(doc),

    /** Resolves when every admission already asked of the page has its answer. */
    settled: async (doc?: string): Promise<void> => {
      if (doc !== undefined) {
        let request = requests.get(doc);
        while (request !== undefined) {
          await request;
          request = requests.get(doc);
        }
        return;
      }
      while (inFlight.size !== 0) await Promise.all([...inFlight]);
    },

    /** Requests in flight and documents waiting, for `/health`. */
    status: (): IHumanViewerAdmissionStatus => ({
      asking: inFlight.size,
      waiting: waiting.size,
      reasons: [
        ...new Set(
          [...waiting.values()].map((held) => held.admission.reason ?? ""),
        ),
      ],
    }),
  };
}
