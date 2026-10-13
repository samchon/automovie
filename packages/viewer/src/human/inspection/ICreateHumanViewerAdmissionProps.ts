import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply.js";
import type { IHumanViewerPageState } from "./IHumanViewerPageState.js";

/**
 * How the server reaches the page's document admission and whom it tells when a verdict arrives.
 *
 * @evidence contracts/common.md#principled-implementation The admission owner asks the current page's domain bridge and stores only actual owner replies against document id and numerical key.
 * @evidence contracts/common.md#clear-and-simple-design Separates page availability, asynchronous judgment and publication notification so the server need not load Human numerical code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable transport stays pending and a failed page refuses with cause; old-key replies cannot overwrite a newer document request.
 * @evidence contracts/common.md#meaningful-documentation Defines current page availability, owner-judged document JSON and notification after stored state; explicit host retry triggers govern re-admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bindings do not traverse catalogues; createHumanViewerAdmission uses maps for requests/verdicts and scans waiting reasons for status.
 * @evidence contracts/performance.md#reuse-equivalent-work Requests and verdicts share document id plus numerical key; supplied callbacks read current authority rather than caching startup readiness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The admission owner keeps encountered verdict/waiting ids without removed-id pruning or a fixed cap; settled requests leave in-flight tracking, while these bindings acquire no page.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerAdmissionProps {
  /**
   * Whether the page can admit documents now, will be able to, or never can.
   *
   * @evidence contracts/common.md#principled-implementation Reads the live starting/ready/failed page state used to distinguish pending admission from permanent page failure.
   * @evidence contracts/common.md#clear-and-simple-design Returns the page owner's discriminated status without combining it with document-specific numerical verdicts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ready page state alone never admits a document; failed state carries its original cause and unavailable requests remain pending.
   * @evidence contracts/common.md#meaningful-documentation The callback is evaluated when admission or unavailable-reply handling needs current availability, so a startup snapshot is insufficient.
   * @evidence contracts/performance.md#efficient-algorithms The caller reads one status value; any cost of obtaining that status belongs to the host callback rather than a catalogue traversal here.
   * @evidence contracts/performance.md#reuse-equivalent-work Admission state is reused only under its numerical key; this availability reading is refreshed independently because page state can change.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a borrowed status record and acquires no browser handle; page disposal and status replacement remain host responsibilities.
   */
  page: () => IHumanViewerPageState;

  /**
   * Asks the page's admission bridge to judge one document JSON.
   *
   * @evidence contracts/common.md#principled-implementation The page bridge dispatches domain, serialized document and basis to the actual Human owner and returns availability plus refusal reason.
   * @evidence contracts/common.md#clear-and-simple-design Keeps server transport and domain schema judgment on opposite sides of one asynchronous bridge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable envelope is not a verdict; thrown or incompatible replies become named pending causes instead of accepted geometry.
   * @evidence contracts/common.md#meaningful-documentation Domain identifies the numerical owner, text is its document JSON and basis is the paired authority token; null reason means an available owner admitted it.
   * @evidence contracts/performance.md#efficient-algorithms Serialization and domain judgment scale with document/model input; createHumanViewerAdmission sends at most one concurrent request for an id's current key.
   * @evidence contracts/performance.md#reuse-equivalent-work An equal document id/key shares tracked work and kept verdict; changed keys launch their own judgment and discard outdated responses.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each call returns a tracked task until settlement; the admission owner removes settled task references, while the page/bridge connection remains owned by the host.
   */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;

  /**
   * Called after a verdict or a waiting reason was stored, so the host republishes its catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Notifies the host only after a current-key verdict or waiting reason has been stored, so publication can read the new state.
   * @evidence contracts/common.md#clear-and-simple-design Leaves complete catalogue publication to the controller instead of returning a partial inventory from the admission owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Notification failure is reported by the admission owner; it does not fabricate a reply or reverse an already stored owner verdict.
   * @evidence contracts/common.md#meaningful-documentation The callback publishes state changes rather than commanding a page reload or automatically retrying pending documents.
   * @evidence contracts/performance.md#efficient-algorithms Notification is constant-count per current reply; the controller's subsequent complete catalogue read and publication have catalogue-sized cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The controller can coalesce publication notifications; admission judgments remain keyed work and are not repeated merely to notify readers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback is held by the admission service for its server lifetime; it starts no task by this signature, and publication lifetime remains with the host.
   */
  changed: () => void;
}
