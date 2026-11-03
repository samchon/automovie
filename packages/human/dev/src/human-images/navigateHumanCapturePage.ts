import type { Page } from "playwright-core";

/** Retire the actual mounted consumer before replacing the worker's one page.
 *
 * @evidence contracts/common.md#principled-implementation Awaits the mounted Human or Mannequin public disposer before Playwright navigation; failure preserves the old document and rejects the command.
 * @evidence contracts/common.md#clear-and-simple-design One page-navigation responsibility is shared by the existing ordinary and Mannequin commands.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no injected replacement, second renderer or ignored cleanup rejection.
 * @evidence contracts/common.md#meaningful-documentation The caller owns source/key invalidation and document-epoch verification; this operation owns only retirement and navigation.
 * @evidence contracts/performance.md#efficient-algorithms One public disposal and one actual navigation occur per changed page representation.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers skip navigation when their input/source/document lease remains valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows one page; its current consumer releases resources before the next document replaces it.
 */
export async function navigateHumanCapturePage(
  page: Page,
  url: string,
): Promise<void> {
  await page.evaluate(async (): Promise<void> => {
    const owner: Window & {
      __automovieHuman?: { dispose: (() => void) | (() => Promise<void>) };
      __humanStickman?: { dispose: (() => void) | (() => Promise<void>) };
    } = window;
    await owner.__automovieHuman?.dispose();
    await owner.__humanStickman?.dispose();
  });
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
}
