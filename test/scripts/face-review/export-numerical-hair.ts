/**
 * Export an explicitly supplied numerical document through the actual connected
 * preview/export runtime. Run from the test package with ttsx -P
 * tsconfig.scripts.json and three arguments: basis JSON(.gz), document JSON,
 * new output directory, and optional `construct`. The document never chooses an external resource URL.
 * The generic basis owns scalp correspondence; each layer owns only numerical
 * styling. Files are written after both operations succeed, with fixed names
 * independent of document IDs. Explicit construction writes the same owner's
 * whole model, admission, part census and mappings, including refused drafts;
 * it never requests an admitted export or writes a GLB. Receipts describe these inputs and derived bytes,
 * not physiological validity, likeness or interactive parameter-assignment time.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/common/connectedRuntime";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const [basisPath, documentPath, output, operation] = process.argv.slice(2);
if (
  basisPath === undefined ||
  documentPath === undefined ||
  output === undefined ||
  fs.existsSync(output) ||
  (operation !== undefined && operation !== "construct")
)
  throw new Error(
    "Supply an explicit basis, numerical document, new output directory and optional construct operation.",
  );
const basisBytes = fs.readFileSync(basisPath);
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  (basisPath.endsWith(".gz") ? gunzipSync(basisBytes) : basisBytes).toString(
    "utf8",
  ),
);
const document = fs.readFileSync(documentPath, "utf8");
const started = performance.now();
const runtime = createConnectedFaceRuntime({
  basis,
  progress: (progress) => console.log("CONSTRUCTION", JSON.stringify({ milliseconds: performance.now() - started, ...progress })),
});
const prepared = performance.now();
void (async () => {
  if (operation === "construct") {
    const construction = await runtime({ document, operation });
    if (construction.operation !== "construct")
      throw new Error("Expected the construction result.");
    const finished = performance.now();
    const { model, ...qualification } = construction;
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, "model.json"), JSON.stringify(model) + "\n");
    fs.writeFileSync(path.join(output, "document.json"), document);
    fs.writeFileSync(path.join(output, "construction.json"), JSON.stringify(qualification) + "\n");
    const receipt = {
      operation,
      accepted: construction.admission.accepted,
      basis: basis.id,
      basisSha256: createHash("sha256").update(basisBytes).digest("hex"),
      documentSha256: createHash("sha256").update(document).digest("hex"),
      parts: model.parts.length,
      failures: construction.admission.failures.length,
      milliseconds: { preparation: prepared - started, construction: finished - prepared },
    };
    fs.writeFileSync(path.join(output, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
    console.log(receipt);
    return;
  }
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
