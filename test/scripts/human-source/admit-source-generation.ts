/**
 * Admit the P1 pair of a compiled source generation through the public
 * builders, from the test CWD (typia transforms required, so plugins stay on):
 *
 *   ttsx -P tsconfig.human-source.json scripts/human-source/admit-source-generation.ts COMPILED
 *
 * COMPILED is an output directory of `compileHumanSourceGeneration`. The run
 * builds the P1 body alone, splits the P1 pair into person views against the
 * generation (`g1-generation.json.gz`) and builds the P1 person through the
 * one-skin generation builder for the neutral documents, then one person with a regenerated body channel
 * and a face channel, and requests an endpoint listed as unavailable, which
 * must be refused by name. It then joins the person head and body view files
 * and builds the neutral and two body-macro documents through the one-skin
 * generation builder. It writes `admission.json` beside the inputs. This
 * is numerical consumer admission; it renders nothing and judges no shape.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { admitHumanSourceP1 } from "./admitHumanSourceP1.ts";
import { admitHumanSourcePersonViews } from "./admitHumanSourcePersonViews.ts";
import { createHumanSourceAdmissionLog } from "./createHumanSourceAdmissionLog.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

const compiled = process.argv[2];
if (compiled === undefined)
  throw new Error("Usage: admit-source-generation.ts COMPILED");
const admitted = readHumanSourcePublication(compiled, [
  "p1-face-basis.json.gz",
  "p1-body-basis.json.gz",
  "head.json.gz",
  "body.json.gz",
  "g1-generation.json.gz",
]);
const read = <T>(name: string): T =>
  JSON.parse(
    zlib.gunzipSync(admitted.outputs.get(name)!).toString("utf8"),
  ) as T;
const face = read<IAutoMovieHumanFaceBasis>("p1-face-basis.json.gz");
const body = read<IAutoMovieHumanBodyBasis>("p1-body-basis.json.gz");
const head = read<IAutoMovieHumanPersonHeadView>("head.json.gz");
if (head.id !== admitted.record.generation)
  throw new Error("Admitted source head and publication identities disagree.");
const log = createHumanSourceAdmissionLog();
admitHumanSourceP1(
  log,
  face,
  body,
  read<IHumanSourceGeneration>("g1-generation.json.gz"),
);
admitHumanSourcePersonViews(
  log,
  head,
  read<IAutoMovieHumanPersonBodyView>("body.json.gz"),
);
fs.writeFileSync(
  path.join(compiled, "admission.json"),
  JSON.stringify(
    { face: face.id, body: body.id, generation: head.id, cases: log.cases },
    null,
    1,
  ) + "\n",
);
console.log(log.cases);
