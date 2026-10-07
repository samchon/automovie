/**
 * Export a compiled head's exact ordinary face basis, from the test CWD:
 *
 *   ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/export-source-face.ts HEAD FACE_OUTPUT
 *
 * HEAD is a source compiler's `head.json.gz`. FACE_OUTPUT is a new standalone
 * gzip in the caller's artifact directory; its receipt is written beside it.
 * No numerical document, fixture or admitted model is created here.
 */
import { exportHumanSourceFaceProjection } from "./exportHumanSourceFaceProjection.ts";

const [head, output] = process.argv.slice(2);
if (head === undefined || output === undefined)
  throw new Error("Usage: export-source-face.ts HEAD FACE_OUTPUT");
console.log("[human-source]", "face projection", JSON.stringify(exportHumanSourceFaceProjection(head, output)));
