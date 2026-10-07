/**
 * Draw body states through the resident viewer, state by state and view by
 * view, and write the frames and a record of them.
 *
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/body-review/capture-editor.ts <name> [--states a,b] [--views v,w] [--passes p,q] [--documents file.json] [--basis file.json.gz]
 *
 * Run from `test/` with the viewer up (`human-shot.mts ensure`). Frames land in
 * `<resolved viewer storage>/body-review/editor-<name>/<state>__<view>__<pass>.png` and
 * `captures.json` beside them lists every frame with its SHA-256, the device
 * string the viewer reported, the source revision and whether the build was
 * current (the client refuses the viewer's stale frames); no
 * image bytes are in the record. The directory is ignored and nothing here is
 * committed: renders never go into the repository.
 *
 * The drawing is `captureBodyFrames`, the same one `observe-body.ts` uses; a
 * document the numerical builder refuses stops this run with the refusal text,
 * and the viewer refuses a software renderer before it draws. States default to
 * `standardBodyReviewStates`; `--documents` replaces them with a hand-written
 * file, and `--basis` builds them on its explicitly selected candidate basis.
 * Without a candidate, the admitted catalogue's standard body selects the
 * published generation view. A document's explicit basis declaration remains
 * its own authority and must agree with the selected published or candidate input.
 */
import fs from "node:fs";
import path from "node:path";

import { connectHumanViewer } from "../human-viewer/connectHumanViewer";
import { createNodeHumanViewerClientIo } from "../human-viewer/createNodeHumanViewerClientIo";
import { humanViewerInstance } from "../human-viewer/humanViewerInstance";
import { humanViewerStorage } from "../human-viewer/humanViewerStorage";
import { readHumanViewerBasisIdentity } from "../human-viewer/readHumanViewerBasisIdentity";
import { readHumanViewerDefaultBodyBasis } from "../human-viewer/readHumanViewerDefaultBodyBasis";
import { buildCaptureRecord } from "../review/buildCaptureRecord";
import { captureBodyFrames } from "./captureBodyFrames";
import type { IBodyReviewState } from "./IBodyReviewState";
import { parseBodyCaptureArguments } from "./parseBodyCaptureArguments";
import { standardBodyReviewStates } from "./standardBodyReviewDocuments";
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
    humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT),
    "body-review",
    `editor-${request.name}`,
  );
  const candidate = request.basis === null ? null : path.resolve(request.basis);
  const origin = humanViewerInstance(process.env.HUMAN_VIEWER_PORT).origin;
  const viewer = await connectHumanViewer({
    io: createNodeHumanViewerClientIo(root),
    origin,
  });
  const basisId = candidate === null
    ? (await readHumanViewerDefaultBodyBasis(origin)).id
    : readHumanViewerBasisIdentity(fs.readFileSync(candidate));
  console.log("RENDERER", viewer.renderer);
  const { drawn } = await captureBodyFrames({
    viewer,
    label: `editor-${request.name}`,
    basisId,
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
        renderer: drawn[0]?.renderer ?? viewer.renderer,
        revision: drawn[0]?.revision ?? viewer.revision,
        humanBuildFresh: drawn.length > 0,
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
