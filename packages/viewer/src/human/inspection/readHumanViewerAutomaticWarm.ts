/**
 * Admit the caller's optional thumbnail-warming policy without changing explicit document requests.
 *
 * @evidence contracts/common.md#principled-implementation The closed on/off setting rejects other nonempty values, with existing unset/empty defaults preserved.
 * @evidence contracts/common.md#clear-and-simple-design Startup policy admission is separate from service composition and thumbnail scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid policy refuses instead of silently disabling work or changing explicit request admission.
 * @evidence contracts/common.md#meaningful-documentation Documents optional policy, default behavior and explicit-request independence.
 * @evidence contracts/performance.md#efficient-algorithms Fixed string comparisons allocate no retained state.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each startup reads its supplied setting without a cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Admission owns no timer, queue or browser.
 */
export function readHumanViewerAutomaticWarm(
  setting: string | undefined,
): boolean {
  if (
    setting !== undefined &&
    setting !== "" &&
    setting !== "on" &&
    setting !== "off"
  )
    throw new Error("HUMAN_VIEWER_AUTO_WARM must be on or off when set.");
  return setting !== "off";
}
