import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanSourcePublicationAdmission } from "./structures/IHumanSourcePublicationAdmission.ts";
import type { IHumanSourcePublicationRecord } from "./structures/IHumanSourcePublicationRecord.ts";

/** Admit an explicitly qualified publication and capture its exact output bytes.
 * Normal generation admission refuses inspection-only, pending, refused and
 * legacy unqualified directories. The explicit inspection route requires a
 * completed inspection artifact set and never normal-generation authority.
 * Every recorded output is verified, including receipts and the manifest. The
 * returned owned buffers close the verify-then-reread race for normal consumers.
 * File integrity and full source-stage qualification certify no clinical fit.
 * @author Samchon
 */
export function readHumanSourcePublication(directory: string,
  required: readonly string[], purpose: "generation" | "inspection" | "component" = "generation"): IHumanSourcePublicationAdmission {
  const root = path.resolve(directory);
  const authority = path.join(root, "source-publication.json");
  const authorityBytes = fs.readFileSync(authority);
  const record = JSON.parse(authorityBytes.toString("utf8")) as IHumanSourcePublicationRecord;
  if ((purpose !== "generation" && purpose !== "inspection" && purpose !== "component") ||
      record.schema !== "automovie-source-publication/1" || record.state !== "complete" ||
      record.completeGeneration !== (purpose === "generation") || record.inspectionOnly !== (purpose === "inspection") || record.refusal !== null ||
      typeof record.generation !== "string" || record.generation.trim() === "" ||
      record.outputs === null || typeof record.outputs !== "object" || Array.isArray(record.outputs))
    throw new Error("Source admission requires its explicit completed generation or inspection authority.");
  const outputs = new Map<string, Buffer>();
  for (const [name, expected] of Object.entries(record.outputs)) {
    if (name === "" || path.basename(name) !== name || name === "." || name === ".." ||
        name.includes("/") || name.includes("\\") || name.includes(":") ||
        expected === null || typeof expected !== "object" ||
        !Number.isSafeInteger(expected.bytes) || expected.bytes < 0 ||
        typeof expected.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(expected.sha256))
      throw new Error("Source publication has an invalid output identity or digest record.");
    const bytes = fs.readFileSync(path.join(root, name));
    if (bytes.length !== expected.bytes || crypto.createHash("sha256").update(bytes).digest("hex") !== expected.sha256)
      throw new Error(`Source publication output no longer matches: ${name}.`);
    outputs.set(name, bytes);
  }
  if (required.some((name) => !outputs.has(name)))
    throw new Error("Source publication does not own every requested normal input.");
  if (purpose === "generation") {
    const manifestBytes = outputs.get("generation-manifest.json");
    if (manifestBytes === undefined) throw new Error("Normal source publication has no generation manifest.");
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    if (manifest.generation !== record.generation || manifest.completeGeneration !== true || manifest.inspectionOnly !== false)
      throw new Error("Source manifest and completed publication authority disagree.");
  }
  if (!authorityBytes.equals(fs.readFileSync(authority)))
    throw new Error("Source publication authority changed during admission.");
  return { record, outputs };
}
