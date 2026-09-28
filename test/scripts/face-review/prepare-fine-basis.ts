/**
 * Reproduce the fine facial basis in a new review directory, from the test CWD:
 * ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-fine-basis.ts OUTPUT
 *
 * Historical Git blobs supply the unchanged neutral correspondence and the
 * source geometry. Pinned historical documents, tracked native endpoints and curation
 * supply the added shape coordinates. No private Blender file or worklog is
 * needed to replay preparation. Native extraction provenance is recorded in
 * fine-controls.json; this entry does not rerun Blender extraction.
 *
 * Shared targets are added before the neutral Y=-0.085 m cut, so every endpoint
 * uses the same affine edge stencils. Region-local triangle identities rebind
 * groom seats only when their complete source triangle survives. All models
 * are admitted before output, and the output directory must be new. This
 * entry prepares review artifacts; publication remains an explicit copy after
 * editor/export verification. It never changes per-person shape weights. Its
 * groom-key documents are a historical intermediate; numerical hair preparation
 * and scalar migration must follow before these are current editor documents.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceControlMap,
  type IAutoMovieHumanFaceGroom,
} from "@automovie/human";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  type FineBasisEntry,
  type FineBasisNative,
  prepareFineBasisArtifacts,
} from "./prepareFineBasisArtifacts";

const compact = "e166c64a8cff9423d0924d00450f01ec8b964777";
const original = "0c75de1e377a7901ce4a8dd942d4718f27d32d8b";
const documentsSource = "3bc7702058484fc8aa9bd2f648023c466abf98d2";
const revision = "mpfb-connected-head-2026-09-21-fine-141-rigid";
const published = "studies/human-face/connected-basis/global-face";
const output = process.argv[2];
if (output === undefined || fs.existsSync(output))
  throw new Error("Supply a new output directory for review artifacts.");

const read = <T>(name: string, commit?: string): T => {
  const bytes =
    commit === undefined
      ? fs.readFileSync(path.join(published, name))
      : execFileSync("git", ["show", `${commit}:test/${published}/${name}`], {
          maxBuffer: 128 * 1024 * 1024,
        });
  return JSON.parse(
    (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
  );
};
const basis = read<IAutoMovieHumanFaceBasis>("basis.json.gz", compact);
const source = read<IAutoMovieHumanFaceBasis>("basis.json.gz", original);
const entries = read<{ entries: FineBasisEntry[] }>(
  "fine-controls.json",
).entries;
const native = read<FineBasisNative>("fine-native-targets.json.gz");
const grooms = read<Record<string, IAutoMovieHumanFaceGroom>>(
  "grooms.json.gz",
  compact,
);
const documents = read<
  Parameters<typeof prepareFineBasisArtifacts>[0]["documents"]
>("subjects.json", documentsSource).map((document) => {
  if (document.basis !== revision)
    throw new Error("Published documents need the expected prepared basis.");
  return { ...document, basis: basis.id };
});
const controls = read<IAutoMovieHumanFaceControlMap>(
  "simple-controls.json",
  documentsSource,
);
const prepared = prepareFineBasisArtifacts({
  basis,
  source,
  entries,
  native,
  grooms,
  documents,
  controls,
  revision,
  cutSurface: "Human",
  minimumY: -0.085,
});
fs.mkdirSync(output, { recursive: true });
for (const [name, value] of Object.entries({
  "basis.json.gz": prepared.basis,
  "grooms.json.gz": prepared.grooms,
  "subjects.json": prepared.documents,
  "simple-controls.json": prepared.controls,
  "preparation-receipt.json": {
    ...prepared.receipt,
    compactSource: compact,
    connectivitySource: original,
    documentsSource,
  },
})) {
  const json =
    JSON.stringify(value, null, name.endsWith(".gz") ? undefined : 2) + "\n";
  fs.writeFileSync(
    path.join(output, name),
    name.endsWith(".gz") ? gzipSync(json, { level: 9 }) : json,
  );
}
console.log("Prepared", prepared.receipt, output);
