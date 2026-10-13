import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply.js";

/**
 * The host page's standing admission bridge. It exists independently of committed geometry and selects the newest present frame. If that frame has no compatible loaded admission hook, the bridge reports unavailable instead of falling back to an older displayed frame.
 *
 * @evidence contracts/common.md#principled-implementation The same-origin host bridge chooses the newest present frame and checks its protocol/admission hook before asking the numerical domain owner.
 * @evidence contracts/common.md#clear-and-simple-design A standing host-level bridge exists independently of committed geometry so a preparing candidate cannot borrow an older displayed frame's source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Newest present but unloaded/incompatible frames return unavailable rather than falling back to an older loaded frame.
 * @evidence contracts/common.md#meaningful-documentation Defines wire protocol and asynchronous owner reply; frame presence and loaded source are separate, and malformed refusal envelopes throw.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type performs no dispatch; createHumanViewerHostAdmission walks its newest-first frame list and the selected numerical owner judges the document.
 * @evidence contracts/performance.md#reuse-equivalent-work Every call refreshes current frame authority; equal document text cannot share a verdict from a different source frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns iframe lifetime and pending requests; the bridge borrows frame enumeration and introduces no separate frame collection.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionBridge {
  /**
   * Wire generation loaded by this host; checked before asking for any verdict.
   */
  protocol: string;

  /**
   * Judge one document JSON through the newest present frame, or report unavailable while its admission hook is absent or incompatible.
   *
   * @evidence contracts/common.md#principled-implementation Dispatches domain/document JSON/basis through the newest present same-origin frame's actual admission hook.
   * @evidence contracts/common.md#clear-and-simple-design Keeps document judgment in the numerical owner and envelope/token association in the host bridge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or mismatched newest-frame hooks yield unavailable, and malformed replies throw; older committed source is never an admission fallback.
   * @evidence contracts/common.md#meaningful-documentation Null reason means an available owner admitted; token identifies the selected frame's generation when present, not a rendered model.
   * @evidence contracts/performance.md#efficient-algorithms Frame choice scans until the first present frame; numerical admission scales with document and basis work at its domain owner.
   * @evidence contracts/performance.md#reuse-equivalent-work Each call observes the newest frame anew; numerical keyed verdict reuse belongs to createHumanViewerAdmission rather than this bridge.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned promise owns one dispatch until settlement; frames are borrowed and this signature retains no browser or numerical worker itself.
   */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;
}
