import type { Page, Worker } from "playwright-core";

/** Maximum milliseconds spent reading diagnostics after the case's verdict, independent of its selector deadline. */
const DOM_OBSERVATION_LIMIT: number = 5000;

/**
 * Read a failed smoke page's scene phases, notes and canvas bounds.
 * Native page and worker metadata is read first. A failed or timed-out DOM
 * read leaves that metadata available with a null state and its error.
 * The timer is released on every outcome; a pending evaluation is disposed
 * when the smoke case closes its existing browser context.
 *
 * Bounds describe geometric intersection with the current viewport,
 * rather than claiming that an IntersectionObserver callback has run.
 * Nothing changes the page, its functions or its worker requests.
 *
 * @param page The still-open page whose existing smoke checks failed.
 * @returns A complete or explicitly partial snapshot, with live worker URLs and no worker messages.
 */
export async function observeSmokePage(
  page: Page,
): Promise<observeSmokePage.ISnapshot> {
  const native: Pick<observeSmokePage.ISnapshot, "url" | "viewport" | "workers"> = {
    url: page.url(),
    viewport: page.viewportSize(),
    workers: page.workers().map((worker: Worker): string => worker.url()),
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const state: observeSmokePage.IDocument = await Promise.race([
      page.evaluate((): observeSmokePage.IDocument => {
        const rectangle: (element: Element) => observeSmokePage.IRectangle = (
          element: Element,
        ): observeSmokePage.IRectangle => {
          const bounds: DOMRect = element.getBoundingClientRect();
          return {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.width,
            height: bounds.height,
            intersectsViewport:
              bounds.width > 0 &&
              bounds.height > 0 &&
              bounds.right > 0 &&
              bounds.bottom > 0 &&
              bounds.left < window.innerWidth &&
              bounds.top < window.innerHeight,
          };
        };
        const texts: (selector: string) => string[] = (
          selector: string,
        ): string[] =>
          Array.from(
            document.querySelectorAll(selector),
            (element: Element): string => element.textContent ?? "",
          );
        return {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
          },
          hardwareConcurrency: navigator.hardwareConcurrency,
          refusedRecords: texts(".am-scene-refused"),
          refusals: texts(".am-scene-view-refusal"),
          errors: texts(
            '.am-scene-view-note.am-danger-text, .am-alert[role="alert"], .am-viewport-error',
          ),
          views: Array.from(
            document.querySelectorAll(".am-scene-view"),
            (view: Element, index: number): observeSmokePage.IView => ({
              index,
              take: view.getAttribute("data-take"),
              busy: view.getAttribute("aria-busy"),
              note: view.querySelector(".am-scene-view-note")?.textContent ?? null,
              rectangle: rectangle(view),
              canvases: Array.from(
                view.querySelectorAll("canvas"),
                (canvas: HTMLCanvasElement): observeSmokePage.ICanvas => ({
                  label: canvas.getAttribute("aria-label"),
                  width: canvas.width,
                  height: canvas.height,
                  rectangle: rectangle(canvas),
                }),
              ),
            }),
          ),
        };
      }),
      new Promise<never>(
        (
          _resolve: (value: never | PromiseLike<never>) => void,
          reject: (reason: Error) => void,
        ): void => {
          timer = setTimeout((): void => {
            reject(new Error(`Smoke DOM observation exceeded ${DOM_OBSERVATION_LIMIT} ms`));
          }, DOM_OBSERVATION_LIMIT);
        },
      ),
    ]);
    return { ...native, state, stateError: null };
  } catch (error) {
    return {
      ...native,
      state: null,
      stateError: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
export namespace observeSmokePage {
  /** Native metadata precedes the bounded DOM read; unavailable DOM is explicitly partial. */
  export interface ISnapshot {
    url: string;
    viewport: { width: number; height: number } | null;
    workers: string[];
    state: IDocument | null;
    stateError: string | null;
  }

  /** The window and every mounted scene view, read in one evaluation. */
  export interface IDocument {
    viewport: { width: number; height: number; scrollX: number; scrollY: number };
    hardwareConcurrency: number;
    refusedRecords: string[];
    refusals: string[];
    errors: string[];
    views: IView[];
  }

  /** A mounted view's phase, note and child canvases in DOM order. */
  export interface IView {
    index: number;
    take: string | null;
    busy: string | null;
    note: string | null;
    rectangle: IRectangle;
    canvases: ICanvas[];
  }

  /** A canvas's accessible label, backing dimensions and CSS bounds. */
  export interface ICanvas {
    label: string | null;
    width: number;
    height: number;
    rectangle: IRectangle;
  }

  /** CSS pixels relative to the viewport and their geometric intersection. */
  export interface IRectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    intersectsViewport: boolean;
  }
}
