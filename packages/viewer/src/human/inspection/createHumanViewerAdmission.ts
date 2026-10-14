import type { ICreateHumanViewerAdmissionProps } from "./ICreateHumanViewerAdmissionProps.js";
import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerAdmissionOutcome } from "./IHumanViewerAdmissionOutcome.js";
import type { IHumanViewerAdmissionStatus } from "./IHumanViewerAdmissionStatus.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerKeyedAdmission } from "./IHumanViewerKeyedAdmission.js";

/**
 * Keep the page's admission verdict for each document. The server does not load the human runtime, so a document's schema is judged by its owner in a viewer frame through the host page's bridge; until a verdict exists for the document's current cache key (document, basis and builder source together) the document is pending and stays out of the drawable catalogue, listed among the rejected inputs with that state.
 *
 * Reads share the currently tracked request for the same document id and key. Changing its key starts another request; returning to an earlier key can request it again while the earlier task remains outstanding. Only an owner's answer is a verdict. A bridge with no loaded frame, or a request that could not run (the page navigating, its context replaced), stores no verdict: the document waits, pending with that reason, and is asked again only when `retry` is called, which the host does on its trigger events (a frame announcing its admission, a generation becoming ready, an explicit settle request). Nothing re-asks on its own, so a bridge that never arrives leaves named pending entries and no loop. A page that failed for good refuses with its cause, so no client waits on it. One verdict and at most one waiting reason are kept per document id; outstanding tasks remain separately retained until settlement.
 *
 * Admission identity is the document id and current numerical key. This owner does not acquire production workspace leases.
 *
 * @evidence contracts/common.md#principled-implementation Admission is requested through the page owner for the document's numerical key; unavailable requests remain pending and only an actual owner answer becomes a verdict.
 * @evidence contracts/common.md#clear-and-simple-design Separate verdict, waiting and in-flight maps express judgment, retry state and settlement without importing the human runtime into the server.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reply whose key differs from the currently tracked key cannot publish. Requests sharing a repeated key, including A-to-B-to-A recurrence, are not distinguished by generation; page failure refuses rather than inventing admission or automatic endless retry.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies key authority, explicit retry triggers, pending versus verdict state and the absence of workspace lease ownership.
 * @evidence contracts/performance.md#efficient-algorithms Per-entry reads and request bookkeeping use expected constant-time maps; status traverses waiting reasons and full settlement awaits currently registered work.
 * @evidence contracts/performance.md#reuse-equivalent-work Verdicts and pending reasons are reused for equal document id and numerical key; a changed key starts another request. Publication compares the currently tracked key, not request identity, so an earlier same-key request can publish after key recurrence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Settled requests leave the request map and in-flight set; verdict and waiting maps retain encountered document ids for the server lifetime without an independent count cap or removed-id pruning.
 */
export function createHumanViewerAdmission(
  props: ICreateHumanViewerAdmissionProps,
): {
  peek: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
  of: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission;
  retry: (doc?: string) => number;
  busy: (doc?: string) => boolean;
  settled: (doc?: string) => Promise<void>;
  status: () => IHumanViewerAdmissionStatus;
} {
  const verdicts: Map<string, IHumanViewerKeyedAdmission> = new Map();
  const waiting: Map<string, IHumanViewerKeyedAdmission> = new Map();
  const asking: Map<string, string> = new Map();
  const inFlight: Set<Promise<void>> = new Set();
  const requests: Map<string, Promise<void>> = new Map();
  /** Why a document whose admission could not be judged now waits. */
  const unavailable: () => string = (): string => {
    const page: ReturnType<ICreateHumanViewerAdmissionProps["page"]> = props.page();
    return page.state === "starting"
      ? `awaiting admission: the viewer page is starting (${page.reason}); asked again when a viewer frame loads`
      : "awaiting admission: no viewer frame has loaded the current source; asked again when one loads";
  };
  return {
    /** Read the current verdict without starting unrelated document work. */
    peek: (entry: IHumanViewerCatalogueEntry): IHumanViewerAdmission => {
      const kept: IHumanViewerKeyedAdmission | undefined = verdicts.get(entry.id);
      if (kept?.key === entry.key) return kept.admission;
      const held: IHumanViewerKeyedAdmission | undefined = waiting.get(entry.id);
      if (held?.key === entry.key) return held.admission;
      return { state: "pending", reason: "awaiting admission by the viewer page" };
    },
    /** The verdict for this entry at its key, starting the page's admission when none exists. */
    of: (entry: IHumanViewerCatalogueEntry): IHumanViewerAdmission => {
      const kept: IHumanViewerKeyedAdmission | undefined = verdicts.get(entry.id);
      if (kept !== undefined && kept.key === entry.key) return kept.admission;
      const page: ReturnType<ICreateHumanViewerAdmissionProps["page"]> = props.page();
      // A failed page never admits anything: the document is refused with the
      // cause until the viewer is restarted, instead of pending forever.
      if (page.state === "failed")
        return {
          state: "refused",
          reason: `cannot be admitted: the viewer page failed (${page.reason}); restart the viewer with human-shot.ts ensure`,
        };
      const held: IHumanViewerKeyedAdmission | undefined = waiting.get(entry.id);
      if (held !== undefined && held.key === entry.key) return held.admission;
      if (asking.get(entry.id) !== entry.key) {
        asking.set(entry.id, entry.key);
        waiting.delete(entry.id);
        const request: Promise<void> = props
          .admit(entry.domain, JSON.stringify(entry.document), entry.basis)
          .then((reply: Awaited<ReturnType<ICreateHumanViewerAdmissionProps["admit"]>>): IHumanViewerAdmissionOutcome => {
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
          .then((outcome: IHumanViewerAdmissionOutcome): void => {
            // A different key is currently tracked; this answer is outdated.
            if (asking.get(entry.id) !== entry.key) return;
            asking.delete(entry.id);
            (outcome.verdict ? verdicts : waiting).set(entry.id, {
              key: entry.key,
              admission: outcome.admission,
            });
            props.changed();
          })
          .catch((error: unknown): void => {
            console.error(
              "Admission result could not be published for " +
                entry.id +
                ": " +
                (error instanceof Error ? error.message : String(error)),
            );
          })
          .finally((): void => {
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
      const released: number = waiting.size;
      waiting.clear();
      return released;
    },

    /** Whether any task remains globally, or the document's latest registered request remains; older same-document tasks may still run. */
    busy: (doc?: string): boolean => doc === undefined ? inFlight.size !== 0 : requests.has(doc),

    /** Await all in-flight tasks globally, or successive latest registered requests for one document; the selected branch does not await displaced older requests. */
    settled: async (doc?: string): Promise<void> => {
      if (doc !== undefined) {
        let request: Promise<void> | undefined = requests.get(doc);
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
          [...waiting.values()].map((held: IHumanViewerKeyedAdmission): string => held.admission.reason ?? ""),
        ),
      ],
    }),
  };
}
