/**
 * Project a source face's attachment metadata into its immutable head host:
 * ttsx -P tsconfig.human-source.json scripts/human-source/project-source-face-metadata.ts HEAD_GZIP FACE_GZIP OUTPUT_HEAD
 *
 * Output is a new candidate plus its exact-content receipt; tracked inputs and
 * root geometry are read only. Person admission remains with normal consumers.
 */
import { projectHumanSourceFaceMetadata } from "./projectHumanSourceFaceMetadata.ts";

const [head, face, output] = process.argv.slice(2);
if (head === undefined || face === undefined || output === undefined)
  throw new Error(
    "Usage: project-source-face-metadata.ts HEAD_GZIP FACE_GZIP OUTPUT_HEAD",
  );
console.log(
  "[human-source] head metadata projection",
  JSON.stringify(projectHumanSourceFaceMetadata(head, face, output)),
);
