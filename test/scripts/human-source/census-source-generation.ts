/**
 * Read what a compiled source generation's head view measures, from the test CWD:
 *
 *   ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/census-source-generation.ts COMPILED OUTPUT [REFERENCE EDITS]
 *
 * COMPILED is an output directory of `compileHumanSourceGeneration`; only its
 * views are read, and nothing in that directory is written. OUTPUT is the
 * census file to write.
 *
 * The census holds source readings that later owners decide on: the
 * signed distance of the registered lid cage to the source globe per column
 * (`measureHumanSourcePeriocularSeat`), the surfaces every shape channel end
 * moves (`measureHumanSourceEndpointSurfaces`), where the tongue and the
 * crowns occupy the same space at the neutral (`measureHumanSourceOralSpace`),
 * and the rigid opening of the mandibular dentition that would clear the
 * neutral occlusion (`solveHumanSourceOcclusion`), and crown extrema about
 * their source cervical ports (`measureHumanSourceCrownDimensions`), and the
 * engine's queries at actual collider resident points
 * (`readHumanSourceColliderGeometry`).
 *
 * REFERENCE is an earlier compiled generation and EDITS the edit receipt the
 * authoring stages wrote against it (`IHumanSourceEditReceipt`). Given
 * together, the census also reports whether COMPILED differs from REFERENCE
 * only where that receipt says (`readHumanSourceCoherence`); both directories
 * then need their `-source-stage` sibling. The exit code is 1 when it does not.
 *
 * It compiles nothing, builds no person and judges no shape.
 */
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { measureHumanSourceEndpointSurfaces } from "./measureHumanSourceEndpointSurfaces.ts";
import { measureHumanSourceCrownDimensions } from "./measureHumanSourceCrownDimensions.ts";
import { measureHumanSourceOralSpace } from "./measureHumanSourceOralSpace.ts";
import { measureHumanSourcePeriocularSeat } from "./measureHumanSourcePeriocularSeat.ts";
import { readHumanSourceCoherence } from "./readHumanSourceCoherence.ts";
import { readHumanSourceColliderGeometry } from "./readHumanSourceColliderGeometry.ts";
import { solveHumanSourceOcclusion } from "./solveHumanSourceOcclusion.ts";
import type { IHumanSourceCensus } from "./structures/IHumanSourceCensus.ts";

const [compiled, output, reference, edits] = process.argv.slice(2);
if (compiled === undefined || output === undefined || (reference === undefined) !== (edits === undefined))
  throw new Error("Usage: census-source-generation.ts COMPILED OUTPUT [REFERENCE EDITS]");
const bytes = fs.readFileSync(path.join(compiled, "head.json.gz"));
const head = JSON.parse(zlib.gunzipSync(bytes).toString("utf8")) as IAutoMovieHumanPersonHeadView;
const census: IHumanSourceCensus = {
  generation: head.id,
  face: head.face.id,
  headSha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  convention: "head-frame metres, right-handed Y up, Z anterior, +X anatomical left; signed distance positive outside the closed source globe; source neutral plus endpoint rows only, without correctives, articulation, contact or the runtime optical assembly",
  periocular: measureHumanSourcePeriocularSeat(head.face),
  endpoints: measureHumanSourceEndpointSurfaces(head.face),
  oral: measureHumanSourceOralSpace(head.face),
  crownDimensions: measureHumanSourceCrownDimensions(head.face),
  colliderGeometry: readHumanSourceColliderGeometry(head.face),
  occlusion: solveHumanSourceOcclusion(head.face),
};
if (reference !== undefined && edits !== undefined) census.coherence = readHumanSourceCoherence(reference, compiled, edits);
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, JSON.stringify(census, null, 1) + "\n");
console.log("[human-source]", "census", census.generation, "periocular states", census.periocular.map((side) => side.states.length), "endpoints", census.endpoints.length);
if (census.coherence !== undefined) {
  console.log("[human-source]", "coherent with", census.coherence.reference, census.coherence.coherent);
  if (!census.coherence.coherent) process.exitCode = 1;
}
