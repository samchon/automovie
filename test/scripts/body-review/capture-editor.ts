/**
 * Draw the product body editor on a real GPU, state by state and view by
 * view, and write the frames and a record of them.
 *
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/body-review/capture-editor.ts <name> [--states a,b] [--views v,w] [--passes p,q] [--documents file.json]
 *
 * Run from `test/` with the viewer up (`scripts/viewer/viewer.ts ensure`).
 * Frames land in `.shots/body-review/editor-<name>/<state>__<view>__<pass>.png`
 * and `captures.json` beside them lists every frame with its SHA-256, the
 * device string, the source revision and whether the human build was fresh; no
 * image bytes are in the record. The directory is ignored and nothing here is
 * committed: renders never go into the repository.
 *
 * Each state is applied through the page's own `change`, the same transaction
 * a slider commits, so the frame shows what an author gets; the camera is
 * placed with the observation hooks (`view`, `pass`), which change the display
 * and never the document, and `finish` completes each frame before its pixels
 * are read. The shared preflight (`openReviewEditor`) refuses a stale human
 * build, a foreign server and a software renderer before the first frame. A
 * page error during the run fails it after the frames are written, so a run
 * that drew garbage cannot pass quietly. States default to
 * `standardBodyReviewStates`; `--documents` replaces them.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { buildCaptureRecord } from "../review/buildCaptureRecord";
import { openReviewEditor } from "../review/openReviewEditor";
import { reviewFileName } from "../review/reviewFileName";
import { parseBodyCaptureArguments } from "./parseBodyCaptureArguments";
import {
  type IBodyReviewState,
  standardBodyReviewStates,
} from "./standardBodyReviewDocuments";

async function main(): Promise<void> {
  const request = parseBodyCaptureArguments(process.argv.slice(2));
  const root = path.resolve(__dirname, "../../..");
  const all: Record<string, IBodyReviewState> =
    request.documents === null
      ? standardBodyReviewStates()
      : JSON.parse(fs.readFileSync(request.documents, "utf8"));
  const names = request.states ?? Object.keys(all);
  for (const name of names)
    if (all[name] === undefined) throw new Error(`Unknown state "${name}".`);
  const output = path.join(root, ".shots/body-review", `editor-${request.name}`);
  fs.mkdirSync(output, { recursive: true });

  const editor = await openReviewEditor("body");
  console.log("RENDERER", editor.renderer);
  const frames: Parameters<typeof buildCaptureRecord>[0]["frames"] = [];
  try {
    const { page, hook, canvas } = editor;
    const base = await page.evaluate(
      (name) =>
        (window as unknown as Record<string, { document: () => object }>)[
          name
        ].document(),
      hook,
    );
    for (const name of names) {
      await page.evaluate(
        ([editorName, document]) =>
          (
            window as unknown as Record<
              string,
              { change: (value: object) => unknown }
            >
          )[editorName as string].change(document as object),
        [hook, { ...base, id: name, name, ...all[name] }],
      );
      await page.waitForFunction(
        ([editorName, id]) => {
          const snapshot = (
            window as unknown as Record<
              string,
              {
                snapshot: () =>
                  | { status?: string; document: { id: string } }
                  | undefined;
              }
            >
          )[editorName as string].snapshot();
          return snapshot?.status === "ready" && snapshot.document.id === id;
        },
        [hook, name],
        { timeout: 300000 },
      );
      for (const view of request.views)
        for (const pass of request.passes) {
          const url = await page.evaluate(
            ([editorName, viewName, passName, selector]) => {
              const hooks = (
                window as unknown as Record<
                  string,
                  {
                    view: (name: string) => void;
                    pass: (name: string) => void;
                    finish: () => void;
                  }
                >
              )[editorName];
              hooks.view(viewName);
              hooks.pass(passName);
              hooks.finish();
              return (
                document.querySelector(selector) as HTMLCanvasElement
              ).toDataURL("image/png");
            },
            [hook, view, pass, canvas] as [string, string, string, string],
          );
          const bytes = Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
          const file = reviewFileName({ state: name, view, pass });
          fs.writeFileSync(path.join(output, file), bytes);
          frames.push({ state: name, view, pass, file, bytes });
        }
      console.log("captured", name);
    }
    await page.evaluate(
      (editorName) =>
        (
          window as unknown as Record<string, { pass: (name: string) => void }>
        )[editorName].pass("beauty"),
      hook,
    );
    const git = (args: string[]): string =>
      execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    fs.writeFileSync(
      path.join(output, "captures.json"),
      JSON.stringify(
        buildCaptureRecord({
          kind: "body",
          renderer: editor.renderer,
          revision:
            git(["rev-parse", "--short", "HEAD"]) +
            (git(["status", "--porcelain", "--", "packages"]) === ""
              ? ""
              : "+local"),
          humanBuildFresh: editor.humanBuildFresh,
          frames,
        }),
        null,
        2,
      ) + "\n",
    );
    if (editor.errors.length !== 0)
      throw new Error("The page raised errors: " + editor.errors.join("; "));
  } finally {
    await editor.close();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
