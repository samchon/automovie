import { mountHumanDebugPage } from "./mountHumanDebugPage";

/**
 * Entry of `debug.html`: mount the page and publish its automation handle as `window.__humanDebug`.
 *
 * A mount failure keeps its original stack in the automation failure marker as well as the notice
 * box. The prefixed string also preserves the cause for an older resident capture session that
 * reads String(marker). debug.html observes dependency evaluation failures before this entry runs.
 */
function main(): void {
  try {
    Object.assign(window, { __humanDebug: mountHumanDebugPage() });
  } catch (error) {
    const detail: string =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    Object.assign(window, { __humanDebugFailed: "mount-failed:\n" + detail });
    console.error(error);
    const notices: HTMLElement | null = document.getElementById("notices");
    if (notices !== null) notices.textContent = "뷰어 초기화 실패: " + detail;
  }
}

main();
