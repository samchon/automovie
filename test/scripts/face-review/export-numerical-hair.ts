/**
 * Export an explicitly supplied numerical document through the actual connected
 * preview/export runtime. Run from the test package with ttsx -P
 * tsconfig.scripts.json and three arguments: basis JSON(.gz), document JSON,
 * new output directory. The document never chooses an external resource URL.
 * The generic basis owns scalp correspondence; each layer owns only numerical
 * styling. Files are written after both operations succeed, with fixed names
 * independent of document IDs. Receipts describe these inputs and derived bytes,
 * not physiological validity, likeness or interactive parameter-assignment time.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/connectedRuntime";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const [basisPath, documentPath, output] = process.argv.slice(2);
if (
  basisPath === undefined ||
  documentPath === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply an explicit basis, numerical document and new output directory.",
  );
const basisBytes = fs.readFileSync(basisPath);
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  (basisPath.endsWith(".gz") ? gunzipSync(basisBytes) : basisBytes).toString(
    "utf8",
  ),
);
const document = fs.readFileSync(documentPath, "utf8");
const started = performance.now();
const runtime = createConnectedFaceRuntime({ basis });
const prepared = performance.now();
void (async () => {
  const preview = await runtime({ document, operation: "preview" });
  if (preview.operation !== "preview")
    throw new Error("Expected the preview result.");
  const previewed = performance.now();
  const exported = await runtime({ document, operation: "export" });
  if (exported.operation !== "export")
    throw new Error("Expected the export result.");
  const finished = performance.now();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "model.glb"), exported.glb);
  fs.writeFileSync(
    path.join(output, "model.json"),
    JSON.stringify(preview.model) + "\n",
  );
  fs.writeFileSync(path.join(output, "document.json"), document);
  const receipt = {
    basis: basis.id,
    basisSha256: createHash("sha256").update(basisBytes).digest("hex"),
    documentSha256: createHash("sha256").update(document).digest("hex"),
    glbSha256: createHash("sha256").update(exported.glb).digest("hex"),
    documentBytes: Buffer.byteLength(document),
    glbBytes: exported.glb.length,
    parts: preview.model.parts.length,
    milliseconds: {
      preparation: prepared - started,
      preview: previewed - prepared,
      export: finished - previewed,
    },
  };
  fs.writeFileSync(
    path.join(output, "receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  console.log(receipt);
})();
