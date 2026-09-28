/**
 * Turn on the hair guide hierarchy in the published study documents, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/migrate-hair-guides.ts STUDY
 *
 * Every hair layer without a hierarchy gets an eighth of its roots as guides
 * and four guides per strand, the production ratio the playground toggle
 * uses; clumping stays off, since it is a styling choice the documents did
 * not make. Nothing else in any document changes, and a layer that already
 * declares guides keeps them. The file is rewritten in place with the same
 * two-space formatting, and the count of converted layers is printed.
 */
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import fs from "node:fs";
import path from "node:path";

const [studyDirectory] = process.argv.slice(2);
if (studyDirectory === undefined)
  throw new Error("Supply the study directory that holds subjects.json.");
const file = path.join(studyDirectory, "subjects.json");
const documents = JSON.parse(
  fs.readFileSync(file, "utf8"),
) as IAutoMovieHumanFaceBasisDocument[];
let converted = 0;
for (const document of documents)
  for (const layer of document.hair?.layers ?? [])
    if (layer.guides === undefined) {
      layer.guides = { fraction: 0.125, neighbours: 4 };
      converted++;
    }
fs.writeFileSync(file, JSON.stringify(documents, null, 2) + "\n");
console.log(`converted ${converted} hair layers in ${documents.length} documents`);
