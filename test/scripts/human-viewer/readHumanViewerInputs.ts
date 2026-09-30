import { createHash } from "node:crypto";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { classifyHumanViewerInput } from "./classifyHumanViewerInput";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";

/** The files of the viewer's inputs directory, by name. */
export interface IHumanViewerInputsIo {
  names(): string[];
  read(name: string): Buffer;
}

/**
 * The hand-written documents and candidate bases dropped into the viewer's
 * inputs directory, as catalogue entries.
 *
 * `<name>.json` holds one document or an array of them, and an optional
 * `<name>.basis.json.gz` beside it is the candidate basis those documents are
 * built against in place of the published one. A single document is offered
 * as `file:<name>` and an array member as `file:<name>/<document id>`. A
 * document must name the basis it is built on: the candidate's identity when
 * a sidecar exists, else its domain's published basis; anything else is
 * rejected with the reason and the rest still load, because one wrong file
 * must not hide the others. The key hashes the document, the basis digest it
 * is built against and the source revision, so editing a file or the builder
 * gives a new resident and never a stale frame. Photographs are never read.
 */
export function readHumanViewerInputs(props: {
  io: IHumanViewerInputsIo;
  bases: Record<"face" | "body", { id: string; digest: string }>;
  source: string;
}): {
  documents: HumanViewerCatalogue["documents"];
  rejected: { file: string; reason: string }[];
} {
  const hash = (bytes: string | Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");
  const available = new Set(props.io.names());
  const documents: HumanViewerCatalogue["documents"] = [];
  const rejected: { file: string; reason: string }[] = [];
  for (const file of [...available].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!file.endsWith(".json") || file.endsWith(".basis.json")) continue;
    const name = file.slice(0, -".json".length);
    try {
      if (!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error("Unsupported file name");
      const parsed = JSON.parse(props.io.read(file).toString("utf8")) as unknown;
      const candidateFile = `${name}.basis.json.gz`;
      const candidate = available.has(candidateFile)
        ? props.io.read(candidateFile)
        : null;
      const many = Array.isArray(parsed);
      for (const document of many ? (parsed as unknown[]) : [parsed]) {
        const domain = classifyHumanViewerInput(document);
        const named = (document as { id?: unknown; basis?: unknown });
        if (typeof named.id !== "string" || named.id === "")
          throw new Error("A document needs an id");
        const identity =
          candidate === null
            ? props.bases[domain].id
            : readHumanViewerBasisIdentity(candidate);
        if (named.basis !== identity)
          throw new Error(
            `The document names basis ${String(named.basis)} but is built on ${identity}`,
          );
        const digest = candidate === null ? props.bases[domain].digest : hash(candidate);
        const id = many ? `file:${name}/${named.id}` : `file:${name}`;
        documents.push({
          id,
          domain,
          document,
          key: hash(JSON.stringify(document) + digest + props.source),
          ...(candidate === null
            ? {}
            : { basis: `${name}@${digest.slice(0, 12)}` }),
        } as HumanViewerCatalogue["documents"][number]);
      }
    } catch (error) {
      rejected.push({
        file,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { documents, rejected };
}
