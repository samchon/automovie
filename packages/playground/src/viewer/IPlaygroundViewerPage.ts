import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";

/**
 * The same-origin product bridge a normal application supplies to its host.
 * Actual completion and transfer are separate from source freshness and PNG IO.
 * The host captures application input and the producer-controlled viewport
 * before candidate restoration. Playback suspension stays with the original
 * viewport control, document transactions stay with the registered application,
 * and the page implementation owns listeners and completed-display resources.
 * Failed candidate admission preserves the prior completed page.
 *
 * @evidence contracts/common.md#principled-implementation Exposes actual owned state and failures without ready counters.
 * @evidence contracts/common.md#clear-and-simple-design One page boundary joins application state with its retained host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no SDK replacement or elapsed-time restart to recover a page.
 * @evidence contracts/common.md#meaningful-documentation Names transfer, freeze, failure and explicit navigation responsibilities.
 * @author Samchon
 */
export interface IPlaygroundViewerPage {
  /**
   * Register the original typed application loader and state owner.
   * Initial application rejection is reported through the page's failure path.
   *
   * @evidence contracts/common.md#principled-implementation Admission awaits the registered application's actual readiness and uses that owner's capture and validated restoration capabilities.
   * @evidence contracts/common.md#clear-and-simple-design Registration joins the existing application to one page bridge without copying its document transaction into the host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The application supplies its real promise and loader; registration cannot manufacture readiness or replay widget actions.
   * @evidence contracts/common.md#meaningful-documentation States application ownership, readiness refusal and the registration role before candidate initialization.
   */
  register: (application: IPlaygroundViewerApplication) => void;

  /**
   * Capture the original application's displayed input and supported viewport.
   * Each component remains absent when its original owner exposes no value.
   *
   * @evidence contracts/common.md#principled-implementation Delegates application and viewport capture to their actual independent owners instead of reconstructing either from visible controls.
   * @evidence contracts/common.md#clear-and-simple-design One transfer envelope preserves the separation between authored input and producer-controlled camera/playback state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported state remains absent rather than a guessed camera or expected document, and capture does not certify source bytes or PNG publication.
   * @evidence contracts/common.md#meaningful-documentation Names both transfer components, their ownership and absent-capability meaning.
   */
  capture: () => unknown;

  /**
   * Preserve an owned playback clock; document transactions retain their owner.
   * Return the producer's release operation, or a no-op when it supplies none.
   *
   * @evidence contracts/common.md#principled-implementation Suspension and resumption use the original completed-frame producer's clock capability, preserving its playback authority during transfer.
   * @evidence contracts/common.md#clear-and-simple-design One scoped release callback returns control to that producer while application transactions remain separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unsupported freeze capability does not acquire clock control through a foreign timer patch or impose an elapsed stop.
   * @evidence contracts/common.md#meaningful-documentation States owned clock scope, returned resumption responsibility and the no-op fallback when no freeze capability exists.
   */
  freeze: () => () => void;

  /**
   * Actual entry/runtime failure before a candidate can supply a completed view.
   * Terminal failure rejects pending frame admission and reports its cause to
   * the same-origin parent; it does not retire the parent's prior good page.
   *
   * @evidence contracts/common.md#principled-implementation An actual failure withdraws candidate readiness and rejects its pending completion before the host can publish that page.
   * @evidence contracts/common.md#clear-and-simple-design One terminal failure path carries entry, application and native-frame causes to the existing parent admission owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure cannot be replaced by a fabricated successful frame or an age-based retry, and this page does not destroy the prior committed parent state.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes candidate terminal refusal, pending-frame rejection and preservation of the host's earlier completed page.
   */
  fail: (cause: unknown) => void;

  /**
   * Request a same-origin product source selection without retiring the live editor.
   * The parent owns destination admission and replacement after restoration.
   *
   * @evidence contracts/common.md#principled-implementation Sends the requested product address through the owned page token to the same-origin parent, which admits the destination and prepares a candidate.
   * @evidence contracts/common.md#clear-and-simple-design One navigation request reuses the retained host's selection and publication sequence instead of adding an independent page-reload path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested address does not imply successful restoration or permit retiring the live editor before a completed replacement is admitted.
   * @evidence contracts/common.md#meaningful-documentation Names request versus admission responsibility and the retained-page lifetime while the parent selects another source.
   */
  navigate: (address: string) => void;
}
