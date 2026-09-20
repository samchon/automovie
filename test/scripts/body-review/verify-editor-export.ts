/**
 * Compare the GLB the shipped editor exported with the package's own export
 * of the same document, byte for byte.
 *
 * Usage, from the repository root, after `verify-editor.mjs` wrote
 * `.shots/body-review/editor-verify/editor.glb` and its document:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/verify-editor-export.ts
 *
 * The editor's worker and this script run the same `createHumanBodyBasisBuilder`
 * and `exportHumanBody` on the same basis and document, so the bytes must be
 * identical; a difference would mean the page shows something the package
 * does not produce.
 */
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  exportHumanBody,
  parseHumanBodyBasisDocument,
} from "@automovie/human";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(__dirname, "../../..");
const VERIFY = path.join(ROOT, ".shots/body-review/editor-verify");

async function main(): Promise<void> {
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib
      .gunzipSync(
        fs.readFileSync(
          path.join(
            ROOT,
            "test/studies/human-body/connected-basis/basis.json.gz",
          ),
        ),
      )
      .toString("utf8"),
  );
  const document = parseHumanBodyBasisDocument(
    fs.readFileSync(path.join(VERIFY, "editor-document.json"), "utf8"),
  );
  if (document.basis !== basis.id)
    throw new Error(
      `the editor exported ${document.basis}; the shipped basis is ${basis.id}: rebuild the playground`,
    );
  const built = createHumanBodyBasisBuilder(basis)(document);
  const { glb } = await exportHumanBody(built.model);
  const editor = fs.readFileSync(path.join(VERIFY, "editor.glb"));
  const sha = (bytes: Uint8Array): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const same = sha(glb) === sha(editor);
  console.log("package", glb.length, sha(glb));
  console.log("editor ", editor.length, sha(editor));
  console.log(same ? "identical" : "DIFFERENT");
  fs.writeFileSync(
    path.join(VERIFY, "export-receipt.json"),
    JSON.stringify(
      {
        basis: basis.id,
        document: document.id,
        packageSha256: sha(glb),
        editorSha256: sha(editor),
        bytes: glb.length,
        identical: same,
      },
      null,
      2,
    ) + "\n",
  );
  if (!same) process.exit(1);
}

void main();
