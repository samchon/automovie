/**
 * Admit the P1 pair of a compiled source generation through the public
 * builders, from the test CWD (typia transforms required, so plugins stay on):
 *
 *   ttsx -P tsconfig.scripts.json scripts/human-source/admit-source-generation.ts COMPILED
 *
 * COMPILED is an output directory of `compileHumanSourceGeneration`. The run
 * builds the P1 body alone and the P1 person through `createHumanPersonBuilder`
 * for the neutral documents, then one person with a regenerated body channel
 * and a face channel, and requests an endpoint listed as unavailable, which
 * must be refused by name. It writes `admission.json` beside the inputs. This
 * is numerical consumer admission; it renders nothing and judges no shape.
 */
import {
  createHumanBodyBasisBuilder,
  createHumanPersonBuilder,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanPersonBuild,
  type IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import type { IHumanSourceAdmissionCase } from "./structures/IHumanSourceAdmissionCase.ts";

const compiled = process.argv[2];
if (compiled === undefined) throw new Error("Usage: admit-source-generation.ts COMPILED");
const read = <T>(name: string): T => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(compiled, name))).toString("utf8")) as T;
const face = read<IAutoMovieHumanFaceBasis>("p1-face-basis.json.gz");
const body = read<IAutoMovieHumanBodyBasis>("p1-body-basis.json.gz");
const cases: IHumanSourceAdmissionCase[] = [];
const attempt = (name: string, run: () => string): void => {
  const started = Date.now();
  try {
    cases.push({ name, admitted: true, result: run(), milliseconds: Date.now() - started });
  } catch (error) {
    cases.push({ name, admitted: false, result: String(error instanceof Error ? error.message : error), milliseconds: Date.now() - started });
  }
};
const personDocument = (bodyShape: Record<string, number>, faceShape: Record<string, number>): IAutoMovieHumanPersonDocument => ({
  id: "source-generation-admission",
  name: "Source generation admission",
  face: { id: "face", name: "face", basis: face.id, shape: faceShape, expression: {} },
  body: { id: "body", name: "body", basis: body.id, shape: bodyShape },
});

attempt("P1 body neutral", () => {
  const document = { id: "body", name: "body", basis: body.id, shape: {} };
  const before = JSON.stringify(document);
  const build = createHumanBodyBasisBuilder(body)(document);
  return `parts ${build.model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
});
let buildPerson: ((document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonBuild) | null = null;
attempt("P1 person builder construction", () => {
  buildPerson = createHumanPersonBuilder({ face, body });
  return "constructed";
});
const personCase = (name: string, document: IAutoMovieHumanPersonDocument): void =>
  attempt(name, () => {
    if (buildPerson === null) throw new Error("person builder unavailable");
    const before = JSON.stringify(document);
    const build = buildPerson(document);
    return `parts ${build.model.parts.length}; caller unchanged ${before === JSON.stringify(document)}`;
  });
personCase("P1 person neutral", personDocument({}, {}));
personCase("P1 person macroWeight 0.5 + chinHeight 0.5", personDocument({ macroWeight: 0.5 }, { chinHeight: 0.5 }));
const unavailable = (body.unavailableTargets ?? []).find((t) => body.channels.some((c) => c.positive === t || c.negative === t));
const owner = body.channels.find((c) => c.positive === unavailable || c.negative === unavailable);
if (owner !== undefined) personCase(`P1 person requesting unavailable ${unavailable} through ${owner.id}`, personDocument({ [owner.id]: owner.positive === unavailable ? owner.maximum : owner.minimum }, {}));
fs.writeFileSync(path.join(compiled, "admission.json"), JSON.stringify({ face: face.id, body: body.id, cases }, null, 1) + "\n");
console.log(cases);
