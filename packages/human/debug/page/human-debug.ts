import { mountHumanDebugPage } from "./mountHumanDebugPage";

/**
 * Entry of `debug.html`: mount the page and publish its automation handle as `window.__humanDebug`.
 *
 * A mount failure is written into the notice box, since without the page nothing else reports it.
 */
function main(): void {
  try {
    Object.assign(window, { __humanDebug: mountHumanDebugPage() });
  } catch (error) {
    console.error(error);
    const notices: HTMLElement | null = document.getElementById("notices");
    if (notices !== null)
      notices.textContent = "뷰어 초기화 실패: " + (error instanceof Error ? error.message : String(error));
  }
}

main();
