import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { HUMAN_SOURCE_STAGE_STRUCTURE_FILES } from "./HUMAN_SOURCE_STAGE_STRUCTURE_FILES.ts";
import { measureHumanSourceCoherence } from "./measureHumanSourceCoherence.ts";
import type { IHumanSourceCoherence } from "./structures/IHumanSourceCoherence.ts";
import type { IHumanSourceCoherenceFile } from "./structures/IHumanSourceCoherenceFile.ts";
import type { IHumanSourceCoherenceSurface } from "./structures/IHumanSourceCoherenceSurface.ts";
import type { IHumanSourceCoherenceTable } from "./structures/IHumanSourceCoherenceTable.ts";
import type { IHumanSourceEditReceipt } from "./structures/IHumanSourceEditReceipt.ts";

/**
 * Read a candidate compiled generation against a reference one.
 *
 * Both are output directories of `compileHumanSourceGeneration` with their
 * `-source-stage` siblings. The stage files that hold no coordinate must be
 * byte-identical, and every surface and landmark table of the head and body
 * views must keep each coordinate the edit receipt does not list
 * (`measureHumanSourceCoherence`). An endpoint present on one side only is
 * reported by name and judged through its rows: it is coherent when the
 * receipt lists every row it holds. The reference must be a generation that
 * the receipt's stages did not act on. Views are read one pair at a time,
 * because two generations of both views do not fit one heap comfortably.
 */
export function readHumanSourceCoherence(reference: string, candidate: string, receiptFile: string): IHumanSourceCoherence {
  const sha = (bytes: Buffer): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const receiptBytes = fs.readFileSync(receiptFile);
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as IHumanSourceEditReceipt;
  const read = <T>(directory: string, name: string): T => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(directory, name))).toString("utf8")) as T;
  const stageSha = (directory: string, name: string): string | null => {
    const file = path.join(`${directory}-source-stage`, name);
    return fs.existsSync(file) ? sha(fs.readFileSync(file)) : null;
  };
  const files = HUMAN_SOURCE_STAGE_STRUCTURE_FILES.map((file): IHumanSourceCoherenceFile => {
    const referenceSha256 = stageSha(reference, file), candidateSha256 = stageSha(candidate, file);
    return { file, referenceSha256, candidateSha256, equal: referenceSha256 !== null && referenceSha256 === candidateSha256 };
  });
  const headTables = (head: IAutoMovieHumanPersonHeadView): IHumanSourceCoherenceTable[] => {
    const tables = head.face.surfaces.map((surface): IHumanSourceCoherenceTable => ({ view: "head", surface: surface.id, positions: surface.positions, indices: surface.indices, targets: surface.targets }));
    if (head.face.landmarks !== undefined)
      tables.push({ view: "head", surface: "landmarks", positions: head.face.landmarks.positions, indices: null, targets: head.face.landmarks.targets });
    return tables;
  };
  const bodyTables = (body: IAutoMovieHumanPersonBodyView): IHumanSourceCoherenceTable[] => {
    const tables = body.body.surfaces.map((surface): IHumanSourceCoherenceTable => ({ view: "body", surface: surface.id, positions: surface.positions, indices: surface.indices, targets: surface.targets }));
    tables.push({ view: "body", surface: "landmarks", positions: body.body.landmarks.positions, indices: null, targets: body.body.landmarks.targets });
    return tables;
  };
  const pair = (before: IHumanSourceCoherenceTable[], after: IHumanSourceCoherenceTable[]): IHumanSourceCoherenceSurface[] => {
    if (before.length !== after.length || before.some((table, at) => table.surface !== after[at].surface))
      throw new Error("The candidate generation publishes a different surface population than its reference.");
    return before.map((table, at) => measureHumanSourceCoherence(table, after[at], receipt));
  };
  const referenceHead = read<IAutoMovieHumanPersonHeadView>(reference, "head.json.gz");
  const surfaces = pair(headTables(referenceHead), headTables(read<IAutoMovieHumanPersonHeadView>(candidate, "head.json.gz")));
  surfaces.push(...pair(bodyTables(read<IAutoMovieHumanPersonBodyView>(reference, "body.json.gz")), bodyTables(read<IAutoMovieHumanPersonBodyView>(candidate, "body.json.gz"))));
  return {
    reference: referenceHead.id, editReceiptSha256: sha(receiptBytes), files, surfaces,
    coherent: files.every((file) => file.equal) && surfaces.every((surface) => surface.indicesEqual && surface.vertices[0] === surface.vertices[1] &&
      surface.untouchedPositionMismatches === 0 && surface.untouchedRowMismatches === 0),
  };
}
