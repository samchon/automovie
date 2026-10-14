/**
 * A message a viewport iframe posts to its host page.
 *
 * The host first checks same origin and active/candidate iframe identity, then interprets the named phase. Optional fields belong to that phase and omitted type or unknown strings grant no readiness. A restore error keeps checked generation readiness separate from restoring the user's selected document; address notices are reconciled with the committed handle's actual state.
 *
 * @evidence contracts/common.md#principled-implementation Distinct phase, failure, restore and display-address fields preserve candidate admission and current-frame identity without treating any arbitrary message as readiness.
 * @evidence contracts/common.md#clear-and-simple-design One host message envelope carries observation phase and optional payload while actual admission and committed display remain frame/handle owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown or absent phase is not accepted readiness, restore failure is not disguised as successful selected display, and stale address text is not replayed over the committed handle.
 * @evidence contracts/common.md#meaningful-documentation The comment states origin/frame checks, phase-scoped optional payloads, unknown-type behavior and separation of generation health from selected restore.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This message schema chooses no phase dispatch or address reconciliation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Phase notices declare no cached numerical result or equivalent-frame reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary message strings and mesh names acquire no worker or renderer handle; the receiving host owns iframe lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerFrameMessage {
  /** `human:admission` (the frame's module loaded), `human:loaded` (its worker's too), `human:ready`, `human:error` or `human:address`. */
  type?: string;

  /** Why the candidate failed, for `human:error`. */
  error?: string;

  /** A failed selected-document restore; the checked generation itself remains ready. */
  restoreError?: string;

  /** For `human:error`: the candidate mixed compiles and must be started again at once. */
  restart?: boolean;

  /** The completed displayed address, for `human:address` or `human:ready`. */
  address?: string;

  /** Displayed mesh names, for `human:address` or `human:ready`. */
  parts?: string[];
}
