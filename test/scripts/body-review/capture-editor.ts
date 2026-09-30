/**
 * Draw body states through the resident viewer, state by state and view by
 * view, and write the frames and a record of them.
 *
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/body-review/capture-editor.ts <name> [--states a,b] [--views v,w] [--passes p,q] [--documents file.json] [--basis file.json.gz]
 *
 * Run from `test/` with the viewer up (`human-shot.mts ensure`). Frames land in
 * `.shots/body-review/editor-<name>/<state>__<view>__<pass>.png` and
 * `captures.json` beside them lists every frame with its SHA-256, the device
 * string the viewer reported, the source revision and whether the build was
 * fresh (the viewer builds the working tree it serves, so it always is); no
 * image bytes are in the record. The directory is ignored and nothing here is
 * committed: renders never go into the repository.
 *
 * The drawing is `captureBodyFrames`, the same one `observe-body.ts` uses; a
 * document the numerical builder refuses stops this run with the refusal text,
 * and the viewer refuses a software renderer before it draws. States default to
 * `standardBodyReviewStates`; `--documents` replaces them with a hand-written
 * file, and `--basis` builds them on a candidate basis (its identity must match
 * the published one) in place of the shipped basis for this run.
 */
import fs from "node:fs";
import path from "node:path";

import { connectHumanViewer } from "../human-viewer/connectHumanViewer";
import { createNodeHumanViewerClientIo } from "../human-viewer/createNodeHumanViewerClientIo";
import { readHumanViewerBasisIdentity } from "../human-viewer/readHumanViewerBasisIdentity";
import { buildCaptureRecord } from "../review/buildCaptureRecord";
import { readSourceRevision } from "../review/readSourceRevision";
import { captureBodyFrames } from "./captureBodyFrames";
import { parseBodyCaptureArguments } from "./parseBodyCaptureArguments";
import {
  type IBodyReviewState,
  standardBodyReviewStates,
} from "./standardBodyReviewDocuments";
import { writeBodyFrames } from "./writeBodyFrames";

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
  const output = path.join(
    root,
    ".shots/body-review",
    `editor-${request.name}`,
  );
  const candidate = request.basis === null ? null : path.resolve(request.basis);
  const viewer = await connectHumanViewer({
    io: createNodeHumanViewerClientIo(root),
    origin: "http://127.0.0.1:5175",
  });
  console.log("RENDERER", viewer.renderer);
  const { drawn } = await captureBodyFrames({
    viewer,
    label: `editor-${request.name}`,
    basisId: readHumanViewerBasisIdentity(
      fs.readFileSync(
        candidate ??
          path.join(root, "test/studies/human-body/connected-basis/basis.json.gz"),
      ),
    ),
    candidateBasis: candidate,
    onRefused: "throw",
    frames: names.flatMap((name) =>
      request.views.flatMap((view) =>
        request.passes.map((pass) => ({
          state: name,
          document: all[name]!,
          view,
          pass,
          isolate: null,
        })),
      ),
    ),
  });
  writeBodyFrames(output, drawn);
  fs.writeFileSync(
    path.join(output, "captures.json"),
    JSON.stringify(
      buildCaptureRecord({
        kind: "body",
        renderer: viewer.renderer,
        revision: readSourceRevision(root),
        humanBuildFresh: true,
        frames: drawn,
      }),
      null,
      2,
    ) + "\n",
  );
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
