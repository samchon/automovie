/**
 * Draw the product body editor on a real GPU, state by state and view by
 * view, and write the frames and a record of them.
 *
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/body-review/capture-editor.ts <name> [--states a,b] [--views v,w] [--passes p,q] [--documents file.json] [--basis file.json.gz]
 *
 * Run from `test/` with the viewer up (`scripts/viewer/viewer.ts ensure`).
 * Frames land in `.shots/body-review/editor-<name>/<state>__<view>__<pass>.png`
 * and `captures.json` beside them lists every frame with its SHA-256, the
 * device string, the source revision and whether the human build was fresh; no
 * image bytes are in the record. The directory is ignored and nothing here is
 * committed: renders never go into the repository.
 *
 * The drawing is `captureBodyFrames`, the same one `observe-body.ts` uses; a
 * document the editor refuses stops this run with the refusal text. The shared
 * preflight (`openReviewEditor`) refuses a stale human build, a foreign server
 * and a software renderer before the first frame. A page error during the run
 * fails it after the frames are written, so a run that drew garbage cannot
 * pass quietly. States default to `standardBodyReviewStates`; `--documents`
 * replaces them, and `--basis` serves a candidate basis (the identity must
 * match the published one) in place of the shipped basis for this run.
 */
import fs from "node:fs";
import path from "node:path";

import { buildCaptureRecord } from "../review/buildCaptureRecord";
import { openReviewEditor } from "../review/openReviewEditor";
import { readSourceRevision } from "../review/readSourceRevision";
import { captureBodyFrames } from "./captureBodyFrames";
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

  const editor = await openReviewEditor(
    "body",
    request.basis === null ? {} : { basisFile: path.resolve(request.basis) },
  );
  console.log("RENDERER", editor.renderer);
  try {
    const { drawn } = await captureBodyFrames({
      editor,
      output,
      onRefused: "throw",
      frames: names.flatMap((name) =>
        request.views.flatMap((view) =>
          request.passes.map((pass) => ({
            state: name,
            document: all[name],
            view,
            pass,
            isolate: null,
          })),
        ),
      ),
    });
    fs.writeFileSync(
      path.join(output, "captures.json"),
      JSON.stringify(
        buildCaptureRecord({
          kind: "body",
          renderer: editor.renderer,
          revision: readSourceRevision(root),
          humanBuildFresh: editor.humanBuildFresh,
          frames: drawn,
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
