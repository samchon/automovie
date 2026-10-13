import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";

/**
 * Same-origin page bridge between an existing application/frame producer and the resident source host. Application input and viewport capture/clock suspension retain their original owners; source freshness, actual hardware completion and saving are separate operations. Candidate failure leaves the host's prior completed page available.
 *
 * @evidence contracts/common.md#principled-implementation Existing transaction and completed-frame seams supply transfer facts, while parent source replacement owns final publication authority instead of inferring readiness from module loading.
 * @evidence contracts/common.md#clear-and-simple-design Register/capture/freeze/fail/navigate expose the existing owner boundaries without implementing another editor, clock or source selection transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown input/view components remain absent, unsupported clock suspension is a no-op and failed candidates do not retire the retained prior page.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes transfer owners, hardware completion, source admission and failure retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface selects no capture, frame observation, source refresh or publication algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It promises no cache or equivalence across source/input/frame identities.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete page/host implementations own listeners, callbacks and completed-display resources; the interface itself allocates none.
 *
 * @author Samchon
 */
export interface IPlaygroundViewerPage {
  /**
   * Register the original application input owner; initial rejection enters the page failure path.
   *
   * @evidence contracts/common.md#principled-implementation The application's actual readiness and restore callbacks provide the transaction boundary for candidate transfer.
   * @evidence contracts/common.md#clear-and-simple-design One registration joins an existing application to its page rather than recreating its document parser/evaluator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Initial rejection remains failure and does not synthesize a ready displayed document.
   * @evidence contracts/common.md#meaningful-documentation The member identifies original state ownership and initial failure routing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Registration type implements no readiness or restoration algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration is an owner handoff, not numerical result reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete bridge retention/disposal of callbacks belongs to its implementation.
   */
  register: (application: IPlaygroundViewerApplication) => void;

  /**
   * Capture actual application input and supported viewport; either can remain absent when its original owner exposes no value.
   *
   * @evidence contracts/common.md#principled-implementation Owner-supplied state defines transfer, avoiding reconstruction from guesses about page controls.
   * @evidence contracts/common.md#clear-and-simple-design One combined snapshot names separate application and viewport components without merging their authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing state is not substituted with fabricated defaults or accepted-history facts.
   * @evidence contracts/common.md#meaningful-documentation The member states actual displayed provenance and component absence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Snapshot copying/serialization is implementation-defined.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No prior snapshot cache or equality contract is declared here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned transfer data and owner references remain caller/bridge-owned.
   */
  capture: () => unknown;

  /**
   * Suspend an owned playback clock and return its release callback, or a no-op when the producer exposes none. Document transaction authority is unchanged.
   *
   * @evidence contracts/common.md#principled-implementation The actual viewport clock supplies freeze/release semantics rather than the bridge replacing animation globals.
   * @evidence contracts/common.md#clear-and-simple-design A returned release callback keeps suspension ownership explicit for the retaining host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported suspension does not claim a frozen document transaction or fabricate a producer clock.
   * @evidence contracts/common.md#meaningful-documentation The member explains producer release ownership and no-op absence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type selects no timer/animation suspension implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Freeze/release effects have no declared cache or merge policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller must invoke the actual release callback; concrete viewport/host owners manage suspended resources.
   */
  freeze: () => () => void;

  /**
   * Report terminal entry/runtime failure to the same-origin parent and reject pending frame admission, preserving the parent's prior good page.
   *
   * @evidence contracts/common.md#principled-implementation A real failure cause prevents candidate admission and reaches the same parent that owns source replacement.
   * @evidence contracts/common.md#clear-and-simple-design One failure seam joins entry and runtime causes without granting the candidate control over the prior display.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure is not translated into readiness or a successful saved frame.
   * @evidence contracts/common.md#meaningful-documentation The member states terminal refusal, pending admission rejection and prior-page retention.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Failure formatting/routing is implementation-owned.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Error notification declares no cached successful result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete page implementation owns waiter cleanup; the prior host display remains host-owned.
   */
  fail: (cause: unknown) => void;

  /**
   * Request product source navigation; the parent checks the same-origin destination and owns admission/replacement after restoration.
   *
   * @evidence contracts/common.md#principled-implementation Source selection is forwarded to the retaining host rather than directly replacing its live editor before destination admission.
   * @evidence contracts/common.md#clear-and-simple-design One address handoff leaves navigation eligibility and candidate restoration with the parent owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested navigation alone does not certify destination content or retire the current page.
   * @evidence contracts/common.md#meaningful-documentation The member identifies parent validation and replacement ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs no URL validation/fetch/restore algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Navigation is an authored effect with no declared cached destination result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Candidate and prior page lifetimes belong to the host rather than this callback signature.
   */
  navigate: (address: string) => void;
}
