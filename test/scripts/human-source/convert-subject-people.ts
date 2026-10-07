/**
 * Convert the legacy subject faces into linked persons on the published person
 * generation, from the test CWD:
 *
 *   ttsx -P tsconfig.human-source.json scripts/human-source/convert-subject-people.ts [GENERATION_DIRECTORY] [OUTPUT]
 *
 * Reads the legacy subject face documents and their subject facts (kept as the
 * fixed legacy comparison) and the selected generation views, and writes
 * the converted persons and one
 * record per subject (age path, carried sex, converted or refused). Ages
 * follow `deriveHumanSourceSubjectAge`; the rest of each face carries
 * unchanged. Omitted paths select the tracked generation directory and
 * `studies/human-person/subjects.json`; explicit paths let a publisher convert
 * the actual subject population on a candidate before replacing tracked data.
 */
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";
import fs from "node:fs";
import zlib from "node:zlib";

import { convertHumanSourceSubject } from "./convertHumanSourceSubject.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";
import type { IHumanSourceSubjectFacts } from "./structures/IHumanSourceSubjectFacts.ts";

const study = "studies/human-face/connected-basis/global-face/";
const [
  generationDirectory = "studies/human-person/generation",
  output = "studies/human-person/subjects.json",
] = process.argv.slice(2);
const admitted = readHumanSourcePublication(generationDirectory, [
  "head.json.gz",
  "body.json.gz",
]);
const read = (name: string) =>
  JSON.parse(zlib.gunzipSync(admitted.outputs.get(name)!).toString("utf8"));
const faces: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(study + "subjects.json", "utf8"),
);
const facts: Record<string, IHumanSourceSubjectFacts> = JSON.parse(
  fs.readFileSync(study + "population/subject-facts.json", "utf8"),
).subjects;
const head = read("head.json.gz");
const body = read("body.json.gz");
if (head.id !== body.id || head.id !== admitted.record.generation)
  throw new Error(
    "Subject conversion requires published views of one completed generation.",
  );
const bases = { face: head.face.id, body: body.body.id };
const results = faces.map((face) =>
  convertHumanSourceSubject(
    face,
    facts[face.id.replace(/-connected$/u, "")],
    bases,
  ),
);
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      generation: head.id,
      convention:
        "age from subject-facts years through the body age curve; without years, the unique inverse of the person population mapping; an omitted face age axis is zero by document convention; the face's youngest end is refused",
      people: results.flatMap((r) => (r.person === null ? [] : [r.person])),
      records: results.map((r) => r.record),
    },
    null,
    1,
  ) + "\n",
);
for (const r of results)
  console.log(
    r.record.id.padEnd(36),
    r.record.converted ? "converted" : "refused",
    r.record.age.path,
    r.record.age.macroAge?.toFixed(4) ?? "-",
    r.record.age.note,
  );
