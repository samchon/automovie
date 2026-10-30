import type { Page } from "playwright-core";

import type { IHumanMannequinSnapshot } from "../human-stickman/IHumanMannequinSnapshot.ts";

/** Bind a snapshot and PNG to one fresh actual completed draw on the borrowed page.
 *
 * @evidence contracts/common.md#principled-implementation Listens to the original completed-frame signal after controls, then synchronously reads the same page-owned snapshot and preserved canvas; terminal page/context changes reject.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the actual draw/readback lease used by the existing queued Mannequin consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scheduling two RAFs, stale readiness, playing state or a replaced page cannot qualify pixels.
 * @evidence contracts/common.md#meaningful-documentation Returns the existing full snapshot JSON text, PNG data URL and actual UTC capture time; it acquires no browser or renderer.
 * @evidence contracts/performance.md#efficient-algorithms One actual snapshot and PNG readback scale with current buffer/pixel bytes; JSON text avoids Playwright's per-number transport graph.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation waits for its own fresh completion; same-fresh cache reuse remains at the Session owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Completion, failure, context loss, pagehide or the 30-second deadline removes all five listeners and the timer; returned strings transfer to the caller.
 */
export async function captureHumanMannequinDraw(
  page: Page,
): Promise<{ snapshotJson: string; png: string; capturedUtc: string }> {
  return page.evaluate(
    (): Promise<{
      snapshotJson: string;
      png: string;
      capturedUtc: string;
    }> => {
      const owner: Window & { __humanStickman?: IHumanMannequinSnapshot.IPage } = window;
      const human: IHumanMannequinSnapshot.IPage | undefined = owner.__humanStickman;
      const canvas: HTMLCanvasElement | null =
        document.querySelector<HTMLCanvasElement>("#view");
      if (
        human === undefined || canvas === null ||
        human.completion.error ||
        human.completion.closed
      )
        throw new Error("Mannequin canvas is unavailable or failed");
      const before: number = human.completion.sequence;
      return new Promise(
        (
          resolve: (value: {
            snapshotJson: string;
            png: string;
            capturedUtc: string;
          }) => void,
          reject: (error: Error) => void,
        ): void => {
          const cleanup: () => void = (): void => {
            clearTimeout(timer);
            canvas.removeEventListener(
              "automovie:completed-frame",
              completed,
            );
            canvas.removeEventListener("webglcontextlost", failed);
            window.removeEventListener("error", failed);
            window.removeEventListener("unhandledrejection", failed);
            window.removeEventListener("pagehide", failed);
          };
          const fail: (error: unknown) => void = (error: unknown): void => {
            cleanup();
            reject(
              error instanceof Error ? error : new Error(String(error)),
            );
          };
          const failed: EventListener = (): void =>
            fail(
              new Error(
                "Mannequin page/context failed before draw completion",
              ),
            );
          const completed: EventListener = (): void => {
            try {
              if (
                owner.__humanStickman !== human ||
                human.completion.error ||
                human.completion.closed
              )
                throw new Error(
                  "Mannequin page owner changed or failed during capture",
                );
              if (!human.ready || human.completion.sequence <= before)
                return;
              const snapshot: IHumanMannequinSnapshot = human.snapshot();
              if (
                snapshot.controller.playing ||
                snapshot.style !== "polygon" ||
                snapshot.completion.sequence !== human.completion.sequence
              )
                throw new Error("Mannequin completed draw state mismatch");
              const result: {
                snapshotJson: string;
                png: string;
                capturedUtc: string;
              } = {
                snapshotJson: JSON.stringify(snapshot),
                png: canvas.toDataURL("image/png"),
                capturedUtc: new Date().toISOString(),
              };
              cleanup();
              resolve(result);
            } catch (error: unknown) {
              fail(error);
            }
          };
          const timer: ReturnType<typeof setTimeout> = setTimeout(
            (): void =>
              fail(
                new Error("Mannequin draw completion deadline exceeded"),
              ),
            30000,
          );
          canvas.addEventListener("automovie:completed-frame", completed);
          canvas.addEventListener("webglcontextlost", failed);
          window.addEventListener("error", failed);
          window.addEventListener("unhandledrejection", failed);
          window.addEventListener("pagehide", failed);
        },
      );
    },
  );
}
