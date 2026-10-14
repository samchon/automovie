/**
 * The server's reactions to the page's console protocol lines.
 *
 * @evidence contracts/common.md#principled-implementation Distinct console protocol callbacks preserve progress, source failure, retained-display failure, readiness and optional persistence as separate facts.
 * @evidence contracts/common.md#clear-and-simple-design The router only removes known prefixes and dispatches; server state updates remain in the supplied reactions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Display recovery does not clear source failure authority, and cache persistence success does not imply numerical admission.
 * @evidence contracts/common.md#meaningful-documentation Each callback names its protocol line and effect boundary, including optional persistence and its codec/write timing text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callback table chooses no prefix parsing or progress-decoding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Console messages are ordered notifications whose effects cannot be shared solely because their text repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reaction table retains no console subscription itself; residency owns the page listener and its lifecycle.
 *
 * @author Samchon
 */
export interface IRouteHumanViewerConsoleProps {
  /**
   * A `HUMAN_WORK` progress record, as its JSON text.
   *
   * @evidence contracts/common.md#principled-implementation Work notifications carry the page's progress JSON after prefix removal for the server's work decoder.
   * @evidence contracts/common.md#clear-and-simple-design The reaction owns progress interpretation while console routing only selects this protocol branch.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress text is forwarded from the page rather than synthesized to meet an expected stage count.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies HUMAN_WORK and the JSON-text payload representation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The work callback signature chooses no JSON parsing or progress aggregation strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Progress notifications update a live task and are not cached numerical construction results.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This progress reaction acquires no worker; residency owns the console subscription.
   */
  work: (text: string) => void;

  /**
   * A `HUMAN_ERROR` line: the page's current generation failed.
   *
   * @evidence contracts/common.md#principled-implementation Generation-error text reports the candidate source failure independently of whether a prior display remains drawable.
   * @evidence contracts/common.md#clear-and-simple-design Source failure handling has its own callback rather than sharing retained-display error state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A displayed old frame does not suppress the page's current-generation failure report.
   * @evidence contracts/common.md#meaningful-documentation The member ties HUMAN_ERROR to the page's current source-generation failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The error reaction type defines no error parsing or recovery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source failures are notifications about current authority, not reusable successful compilation results.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Error text transfers no candidate worker handle; generation ownership remains with the page.
   */
  error: (message: string) => void;

  /**
   * A failure of the retained display, separate from source compilation.
   *
   * @evidence contracts/common.md#principled-implementation Retained-display errors describe actual drawing failure separately from the candidate's source compilation state.
   * @evidence contracts/common.md#clear-and-simple-design A dedicated display-error reaction permits display recovery without clearing source errors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Display failure is not reclassified as a successful generation simply because compiled source exists.
   * @evidence contracts/common.md#meaningful-documentation The member explicitly distinguishes retained-display failure from source compilation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The display-error signature specifies no WebGL error detection or recovery implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Drawing-error reports cannot reuse old successful frame authority as proof of current display health.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This notification passes a cause string and owns no GPU context or frame resource.
   */
  displayError: (message: string) => void;

  /**
   * The retained display completed again; source errors remain independent.
   *
   * @evidence contracts/common.md#principled-implementation Display recovery reports another completed display without asserting that a failing source candidate compiled.
   * @evidence contracts/common.md#clear-and-simple-design The parameterless recovery callback clears only the display-failure channel owned by residency.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Recovery does not erase independent numerical/source refusal or promote a stale generation to current authority.
   * @evidence contracts/common.md#meaningful-documentation The comment states completed retained drawing and preservation of independent source errors.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The recovery notification chooses no redraw or renderer-restoration algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh completion event is required for display recovery; prior successful display state alone is insufficient.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Display recovery conveys state only and transfers no ownership of renderer or resources.
   */
  displayRecovered: () => void;

  /**
   * A `HUMAN_READY` payload naming the page revision and its optional proven source label.
   *
   * @evidence contracts/common.md#principled-implementation Readiness carries page revision plus an optional proven source label, allowing residency to distinguish current authority from an unproven page.
   * @evidence contracts/common.md#clear-and-simple-design The router forwards readiness text while residency decodes its revision/label and chooses cache warming or admission retry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A page revision without a proven label is not accepted automatically as the current source revision.
   * @evidence contracts/common.md#meaningful-documentation The member documents both payload components instead of implying the text is always a single digest.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This readiness signature selects no source-witness verification or revision-parsing algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Only proven current-source readiness permits warming current thumbnails; the consumer compares the reported authority with inventory revision.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ready text owns no candidate frame; the page and residency maintain the actual generation lifecycle.
   */
  ready: (revision: string) => void;

  /**
   * A `HUMAN_ADMISSION` line: a viewer frame loaded its module and can judge documents.
   *
   * @evidence contracts/common.md#principled-implementation Module-loaded admission notification tells the host that pending document verdicts can be requested from their actual numerical owner.
   * @evidence contracts/common.md#clear-and-simple-design A separate admission callback keeps document judgment availability distinct from a completed displayed generation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Loading the module does not itself certify any document's numerical admission.
   * @evidence contracts/common.md#meaningful-documentation The comment defines the loaded-module condition and ability to judge documents.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This availability notification chooses no admission scheduling or numerical validation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Retrying pending verdicts observes current owner authority; the event itself is not a cached admission result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Notification transfers no admission task; the host's admission owner retains outstanding work.
   */
  admission: () => void;

  /**
   * A `HUMAN_RESTART` line: a candidate mixed compiles and the host started a fresh one.
   *
   * @evidence contracts/common.md#principled-implementation Mixed-compile candidate rejection is reported as a restart cause while a fresh candidate obtains coherent source authority.
   * @evidence contracts/common.md#clear-and-simple-design The restart callback reports provenance repair separately from general display or compilation failure channels.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A candidate containing mixed compilation inputs is not kept drawable under a retry label.
   * @evidence contracts/common.md#meaningful-documentation The member explains mixed compiles and the fresh-candidate replacement represented by HUMAN_RESTART.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The restart reaction selects no candidate compilation or replacement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mixed-source work is not equivalent to the replacement generation; notification does not authorize reusing its output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reaction receives only a reason; page generation ownership releases rejected candidates independently.
   */
  restart: (reason: string) => void;

  /**
   * A `HUMAN_FIRST_ADDRESS` line: a candidate could not show its first address and is about to retry the standard document; that fallback can still fail.
   *
   * @evidence contracts/common.md#principled-implementation First-address failure reports that the requested initial document could not display and a standard address will be attempted instead, without claiming successful display before show settles.
   * @evidence contracts/common.md#clear-and-simple-design The dedicated notification exposes initial-selection fallback without conflating it with source compilation failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The fallback cause is reported rather than presenting the standard document as the requested failed selection.
   * @evidence contracts/common.md#meaningful-documentation The comment names the requested-first-address failure and the subsequent standard-document display.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This fallback-report callback chooses no address admission or selection algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fallback display cannot serve as a cached frame for the requested document that failed.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only fallback reason text is lent to the host; selected-resident cleanup remains with the page.
   */
  firstAddress: (reason: string) => void;

  /**
   * Independent optional persistence result and its measured codec/write durations.
   *
   * @evidence contracts/common.md#principled-implementation Cache notifications carry optional persistence outcome and measured codec/write timings independently of numerical build or display success.
   * @evidence contracts/common.md#clear-and-simple-design Optional cache reporting has one callback and is ignored when the host supplies no persistence observer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Persistence failure is not converted into numerical admission failure or hidden as successful durable storage.
   * @evidence contracts/common.md#meaningful-documentation The member describes optional independent persistence results and their measured phase durations.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This diagnostic callback chooses no persistence codec or disk-write algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Notification text reports an actual persistence attempt and does not establish equivalence of other queued writes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Persistence reporting lends text only; codec buffers and disk jobs remain owned by the persistence implementation.
   */
  cache?: (text: string) => void;
}
