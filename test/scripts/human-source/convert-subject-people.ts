/**
 * Convert the legacy subject faces into linked persons on the published person
 * generation, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json scripts/human-source/convert-subject-people.ts
 *
 * Reads the legacy subject face documents and their subject facts (kept as the
 * fixed legacy comparison) and the tracked generation views, and writes
 * `test/studies/human-person/subjects.json`: the converted persons and one
 * record per subject (age path, carried sex, converted or refused). Ages
 * follow `deriveHumanSourceSubjectAge`; the rest of each face carries
 * unchanged.
 */
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import fs from "node:fs";
import zlib from "node:zlib";

import { convertHumanSourceSubject } from "./convertHumanSourceSubject.ts";
import type { IHumanSourceSubjectFacts } from "./structures/IHumanSourceSubjectFacts.ts";

const read = (file: string) => JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
const study = "studies/human-face/connected-basis/global-face/";
const faces: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(fs.readFileSync(study + "subjects.json", "utf8"));
const facts: Record<string, IHumanSourceSubjectFacts> = JSON.parse(fs.readFileSync(study + "population/subject-facts.json", "utf8")).subjects;
const head = read("studies/human-person/generation/head.json.gz");
const body = read("studies/human-person/generation/body.json.gz");
const bases = { face: head.face.id, body: body.body.id };
const results = faces.map((face) => convertHumanSourceSubject(face, facts[face.id.replace(/-connected$/u, "")], bases));
fs.writeFileSync(
  "studies/human-person/subjects.json",
  JSON.stringify(
    {
      generation: head.id,
      convention: "age from subject-facts years through the body age curve; without years, the unique inverse of the person population mapping; an omitted face age axis is zero by document convention; the face's youngest end is refused",
      people: results.flatMap((r) => (r.person === null ? [] : [r.person])),
      records: results.map((r) => r.record),
    },
    null,
    1,
  ) + "\n",
);
for (const r of results) console.log(r.record.id.padEnd(36), r.record.converted ? "converted" : "refused", r.record.age.path, r.record.age.macroAge?.toFixed(4) ?? "-", r.record.age.note);
