import path from "node:path";

import { judgeViewerFreshness } from "../viewer/judgeViewerFreshness";
import { judgeViewerRenderer } from "../viewer/judgeViewerRenderer";
import { newestModification } from "../viewer/newestModification";

/** The two product editors a review can open. */
export type ReviewEditorKind = "body" | "face";

const PAGES: Record<
  ReviewEditorKind,
  { html: string; hook: string; canvas: string }
> = {
  body: { html: "connected-body.html", hook: "__connectedBody", canvas: "#body-canvas" },
  face: { html: "connected-face.html", hook: "__connectedFace", canvas: "#face-canvas" },
};

/**
 * Open a product editor in a real browser for review and return it ready.
 *
 * A review frame is evidence only when three things hold, and this is the one
 * place that checks them for both editors. The human browser build is not
 * older than its source (the dev server hands the page the build, and never
 * rebuilds it, so an older build reports a new feature as absent); the
 * server answers with the playground (the caller starts and owns it, see
 * `scripts/viewer/viewer.ts`); and the page's own `renderer()` names real
 * hardware and not a software rasterizer, which Chromium falls back to
 * silently. Any failure throws with the reason before a single frame is
 * drawn, so a run never produces frames it would have to disown.
 *
 * The editor is ready when its own ready signal fires: the body panel's
 * snapshot status, the face panel's status element. The browser is launched
 * with the real Chromium channel and the ANGLE backend, headless, at a fixed
 * viewport and device pixel ratio 1 so the canvas has one known size.
 *
 * Playwright is imported by the caller's module resolution (this package's
 * `test/node_modules`), not through a server. The returned `close` releases
 * the browser and must be called once, in a `finally`.
 *
 * @param kind Which editor.
 * @param options Server origin and viewport, defaulted to the dev server and a
 * 1310 by 900 window (the face panel's 410 px column leaves a 900 px canvas).
 */
export async function openReviewEditor(
  kind: ReviewEditorKind,
  options: { base?: string; viewport?: { width: number; height: number } } = {},
) {
  const root = path.resolve(__dirname, "../../..");
  const human = path.join(root, "packages/human");
  const fs = await import("node:fs");
  const entry = path.join(human, "lib/browser/index.js");
  const freshness = judgeViewerFreshness(
    newestModification(path.join(human, "src")),
    fs.existsSync(entry) ? fs.statSync(entry).mtimeMs : null,
  );
  if (!freshness.fresh) throw new Error(freshness.reason);

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
  });
  try {
    const page = await browser.newPage({
      viewport: options.viewport ?? { width: 1310, height: 900 },
      deviceScaleFactor: 1,
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    const { html, hook, canvas } = PAGES[kind];
    await page.goto(`${options.base ?? "http://127.0.0.1:5173"}/${html}`, {
      timeout: 300000,
    });
    await page.waitForFunction(
      ([name, isFace]) => {
        const editor = (window as unknown as Record<string, unknown>)[
          name as string
        ] as { snapshot: () => { status?: string } | undefined } | undefined;
        if (editor === undefined) return false;
        return isFace
          ? (document.querySelector("#face-status") as HTMLElement | null)
              ?.dataset.state === "ready"
          : editor.snapshot()?.status === "ready";
      },
      [hook, kind === "face"],
      { timeout: 600000 },
    );
    const renderer = await page.evaluate(
      (name) =>
        String(
          (
            window as unknown as Record<string, { renderer: () => unknown }>
          )[name].renderer(),
        ),
      hook,
    );
    const verdict = judgeViewerRenderer(renderer);
    if (!verdict.real) throw new Error(verdict.reason);
    return {
      page,
      renderer,
      hook,
      canvas,
      errors,
      humanBuildFresh: freshness.fresh,
      close: () => browser.close(),
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
