/**
 * Derive the rendered-observation set of the body from its owners, draw it on
 * a real GPU, and write a local sheet and a manifest.
 *
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/body-review/observe-body.ts <name> --unit part|joint|whole [--id <unit id>]
 *
 * Run from `test/` with the viewer up (`human-shot.mts ensure`). The parts are
 * the meshes the viewer displays for the neutral body (its `/parts` route), the joints and their clinical ranges are the basis rig's, and the
 * whole-body states are the standard review states, so a new part or joint
 * enters the set when its owner has it. `deriveBodyObservationSet` says what to
 * draw; `captureBodyFrames` draws it, recording a state the numerical builder refuses
 * instead of stopping. Each unit writes
 * `.shots/body-review/observe-<name>/<unit>-<id>/` holding the frames,
 * `manifest.json` (revision, basis id, renderer, per-frame SHA-256, refused and
 * excluded states, no image bytes) and `sheet.html`, a local contact sheet.
 * Nothing here is committed: the directory is ignored and renders never go
 * into the repository. `judgeObservationManifest` tells later whether a
 * manifest still describes the source.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { connectHumanViewer } from "../human-viewer/connectHumanViewer";
import { createNodeHumanViewerClientIo } from "../human-viewer/createNodeHumanViewerClientIo";
import { readSourceRevision } from "../review/readSourceRevision";
import { buildObservationManifest } from "./buildObservationManifest";
import { captureBodyFrames } from "./captureBodyFrames";
import { deriveBodyObservationSet } from "./deriveBodyObservationSet";
import { parseBodyObservationArguments } from "./parseBodyObservationArguments";
import { renderObservationSheet } from "./renderObservationSheet";
import { standardBodyReviewStates } from "./standardBodyReviewDocuments";
import { writeBodyFrames } from "./writeBodyFrames";

async function main(): Promise<void> {
  const request = parseBodyObservationArguments(process.argv.slice(2));
  const root = path.resolve(__dirname, "../../..");
  const basis = JSON.parse(
    gunzipSync(
      fs.readFileSync(
        path.join(
          root,
          "test/studies/human-body/connected-basis/basis.json.gz",
        ),
      ),
    ).toString("utf8"),
  ) as IAutoMovieHumanBodyBasis;
  const viewer = await connectHumanViewer({
    io: createNodeHumanViewerClientIo(root),
    origin: "http://127.0.0.1:5175",
  });
  console.log("RENDERER", viewer.renderer);
  const parts = await viewer.parts({ doc: "body:neutral" });
  const units = deriveBodyObservationSet({
    parts,
    joints: basis.joints,
    wholeStates: standardBodyReviewStates(),
  }).filter(
    (unit) =>
      unit.unit === request.unit &&
      (request.id === null || unit.id === request.id),
  );
  if (units.length === 0)
    throw new Error(
      `No ${request.unit} unit${request.id === null ? "" : ` "${request.id}"`} was derived.`,
    );
  const revision = readSourceRevision(root);
  for (const unit of units) {
    const output = path.join(
      root,
      ".shots/body-review",
      `observe-${request.name}`,
      `${unit.unit}-${unit.id.replace(/[^A-Za-z0-9]+/g, "-")}`,
    );
    const { drawn, refused } = await captureBodyFrames({
      viewer,
      label: `observe-${request.name}-${unit.unit}-${unit.id.replace(/[^A-Za-z0-9]+/g, "-")}`,
      basisId: basis.id,
      frames: unit.frames,
      onRefused: "record",
    });
    writeBodyFrames(output, drawn);
    fs.writeFileSync(
      path.join(output, "manifest.json"),
      JSON.stringify(
        buildObservationManifest({
          unit,
          revision,
          basisId: basis.id,
          renderer: viewer.renderer,
          humanBuildFresh: true,
          drawn,
          refused,
        }),
        null,
        2,
      ) + "\n",
    );
    fs.writeFileSync(
      path.join(output, "sheet.html"),
      renderObservationSheet({
        title: `${unit.unit} ${unit.id}`,
        drawn,
        refused,
      }),
    );
    console.log(
      `${unit.unit} ${unit.id}: ${drawn.length}/${unit.frames.length} frames, ${refused.length} refused, ${unit.excluded.length} excluded`,
    );
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
