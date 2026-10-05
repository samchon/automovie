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
 * must be refused by name. It then joins the person head and body view files
 * and builds the neutral and two body-macro documents through the one-skin
 * generation builder. It writes `admission.json` beside the inputs. This
 * is numerical consumer admission; it renders nothing and judges no shape.
 */
import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { admitHumanSourceP1 } from "./admitHumanSourceP1.ts";
import { admitHumanSourcePersonViews } from "./admitHumanSourcePersonViews.ts";
import { createHumanSourceAdmissionLog } from "./createHumanSourceAdmissionLog.ts";

const compiled = process.argv[2];
if (compiled === undefined) throw new Error("Usage: admit-source-generation.ts COMPILED");
const read = <T>(name: string): T => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(compiled, name))).toString("utf8")) as T;
const face = read<IAutoMovieHumanFaceBasis>("p1-face-basis.json.gz");
const body = read<IAutoMovieHumanBodyBasis>("p1-body-basis.json.gz");
const head = read<IAutoMovieHumanPersonHeadView>("head.json.gz");
const log = createHumanSourceAdmissionLog();
admitHumanSourceP1(log, face, body);
admitHumanSourcePersonViews(log, head, read<IAutoMovieHumanPersonBodyView>("body.json.gz"));
fs.writeFileSync(path.join(compiled, "admission.json"), JSON.stringify({ face: face.id, body: body.id, generation: head.id, cases: log.cases }, null, 1) + "\n");
console.log(log.cases);
