import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanSourcePublication } from "./structures/IHumanSourcePublication.ts";
import type { IHumanSourcePublicationRecord } from "./structures/IHumanSourcePublicationRecord.ts";
import type { IHumanSourceSampleFile } from "./structures/IHumanSourceSampleFile.ts";

/** Own candidate writes and one atomic pending/refused/complete authority.
 * A new authority and each output use exclusive creation. Failed bytes remain
 * beside the refused or pending authority; no failure cleanup erases evidence.
 * Rename of the completed authority is the only admission commit point.
 * The caller verifies inputs before completion. This owner rereads outputs.
 * @author Samchon
 */
export function createHumanSourcePublication(
  directory: string,
  authorityName: string = "source-publication.json",
): IHumanSourcePublication {
  const root = path.resolve(directory);
  const child = (name: string): string => {
    if (
      name === "" ||
      path.basename(name) !== name ||
      name === "." ||
      name === ".." ||
      name.includes("\\") ||
      name.includes("/") ||
      name.includes(":")
    )
      throw new Error(
        "Source publication requires a direct child output name.",
      );
    return path.join(root, name);
  };
  const authority = child(authorityName),
    next = child(`${authorityName}.next`);
  if (fs.existsSync(authority) || fs.existsSync(next))
    throw new Error("Source publication authority already exists.");
  fs.mkdirSync(root, { recursive: true });
  const outputs = new Map<string, IHumanSourceSampleFile>();
  let state: IHumanSourcePublicationRecord["state"] = "pending";
  const record: IHumanSourcePublicationRecord = {
    schema: "automovie-source-publication/1",
    state,
    generation: null,
    completeGeneration: false,
    inspectionOnly: false,
    outputs: {},
    refusal: null,
  };
  fs.writeFileSync(authority, JSON.stringify(record) + "\n", { flag: "wx" });
  const digest = (bytes: Uint8Array): IHumanSourceSampleFile => ({
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  });
  const commit = (candidate: IHumanSourcePublicationRecord): void => {
    fs.writeFileSync(next, JSON.stringify(candidate) + "\n", { flag: "wx" });
    fs.renameSync(next, authority);
    state = candidate.state;
  };
  const files = (): Record<string, IHumanSourceSampleFile> =>
    Object.fromEntries(
      [...outputs].map(([name, value]) => [name, { ...value }]),
    );
  return {
    write: (name, bytes) => {
      if (
        state !== "pending" ||
        name === authorityName ||
        name === `${authorityName}.next`
      )
        throw new Error(
          "Source publication output is not writable in this state.",
        );
      const buffer =
        typeof bytes === "string"
          ? Buffer.from(bytes, "utf8")
          : Buffer.from(bytes);
      fs.writeFileSync(child(name), buffer, { flag: "wx" });
      outputs.set(name, digest(buffer));
    },
    files,
    complete: (
      generation,
      completeGeneration,
      inspectionOnly,
      verifyInputs,
    ) => {
      if (
        state !== "pending" ||
        generation.trim() === "" ||
        (completeGeneration && inspectionOnly) ||
        outputs.size === 0
      )
        throw new Error(
          "Source publication needs non-conflicting source-stage qualification.",
        );
      for (const [name, expected] of outputs) {
        const actual = digest(fs.readFileSync(child(name)));
        if (
          actual.bytes !== expected.bytes ||
          actual.sha256 !== expected.sha256
        )
          throw new Error(`Source publication output changed: ${name}.`);
      }
      verifyInputs();
      commit({
        ...record,
        state: "complete",
        generation,
        completeGeneration,
        inspectionOnly,
        outputs: files(),
      });
    },
    refuse: (error) => {
      if (state !== "pending")
        throw new Error(
          "A completed source publication cannot be reclassified.",
        );
      try {
        commit({
          ...record,
          state: "refused",
          outputs: files(),
          refusal: error instanceof Error ? error.message : String(error),
        });
      } catch (publicationError) {
        throw new AggregateError(
          [error, publicationError],
          "Source operation and refusal recording failed.",
        );
      }
    },
  };
}
