import { admitHumanPersonDocument } from "@automovie/human";
import { createHash } from "node:crypto";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { IHumanViewerInputs } from "./IHumanViewerInputs";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";
import type { IReadHumanViewerInputsProps } from "./IReadHumanViewerInputsProps";
import { classifyHumanViewerInput } from "./classifyHumanViewerInput";
import { humanViewerPersonKey } from "./humanViewerPersonKey";

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
 * is built against and the digest of the source its domain's build reads, so editing a file or the builder
 * gives a new resident and never a stale frame. Photographs are never read.
 * A Person uses both published basis identities and digests, both anatomy
 * sources and the actual composer's numerical source. Its paired schema is
 * admitted by the Person owner. A `<name>.basis.json.gz` sidecar refuses for
 * a Person: one basis file does not specify the two independent basis
 * authorities. A Person built on candidates instead takes
 * `<name>.person.json.gz`, one person generation packet that opens with its
 * `id` and carries whole `face` and `body` bases; the document's face basis must be the
 * packet's face `id` and its body basis the packet's body `id`, the entry's
 * `basis` is `<name>@<digest12>` like a face or body candidate, and the key
 * hashes the packet's digest in place of both published bases.
 */
export function readHumanViewerInputs(props: IReadHumanViewerInputsProps): IHumanViewerInputs {
  const hash = (bytes: string | Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");
  const available = new Set(props.io.names());
  const documents: HumanViewerCatalogue["documents"] = [];
  const rejected: IHumanViewerRejectedInput[] = [];
  for (const file of [...available].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!file.endsWith(".json") || file.endsWith(".basis.json")) continue;
    const name = file.slice(0, -".json".length);
    try {
      if (!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error("Unsupported file name");
      const parsed = JSON.parse(props.io.read(file).toString("utf8")) as unknown;
      const candidateFile = `${name}.basis.json.gz`;
      const packetFile = `${name}.person.json.gz`;
      // A sidecar still being read off the request path holds its documents
      // back; the catalogue is published again when its facts are known.
      const sidecarOf = (sidecar: string): IHumanViewerSidecarFacts | null => {
        if (!available.has(sidecar)) return null;
        const facts = props.sidecar(sidecar);
        if (facts === null) throw new Error(`${sidecar} is still being read; its documents appear when it is`);
        return facts;
      };
      const candidate = sidecarOf(candidateFile);
      const packetFacts = sidecarOf(packetFile);
      const many = Array.isArray(parsed);
      for (const document of many ? (parsed as unknown[]) : [parsed]) {
        const domain = classifyHumanViewerInput(document);
        if (domain !== "person" && packetFacts !== null)
          throw new Error(`${packetFile} is a person packet; a ${domain} document takes ${candidateFile}`);
        const named = document as Partial<Record<"id" | "basis", unknown>>;
        if (typeof named.id !== "string" || named.id === "")
          throw new Error("A document needs an id");
        if (domain === "person") {
          if (candidate !== null)
            throw new Error("Person inputs use the published face and body bases; a candidate Person sidecar is unsupported.");
          const person = admitHumanPersonDocument(document);
          if (packetFacts !== null) {
            if (packetFacts.packet === null)
              throw new Error(`${packetFile}: ${packetFacts.failure ?? "not a person packet"}`);
            const digest = packetFacts.digest;
            const packet = packetFacts.packet;
            if (person.face.basis !== packet.face)
              throw new Error(`The person names face basis ${person.face.basis} but its packet ${packetFile} carries face basis ${packet.face}`);
            if (person.body.basis !== packet.body)
              throw new Error(`The person names body basis ${person.body.basis} but its packet ${packetFile} carries body basis ${packet.body}`);
            documents.push({
              id: many ? `file:${name}/${person.id}` : `file:${name}`,
              domain: "person",
              document: person,
              key: humanViewerPersonKey({ document: person,
                bases: { face: { digest }, body: { digest } }, sources: props.sources }),
              basis: `${name}@${digest.slice(0, 12)}`,
            });
            continue;
          }
          if (person.face.basis !== props.bases.face.id)
            throw new Error(`The person names face basis ${person.face.basis} but is built on ${props.bases.face.id}`);
          if (person.body.basis !== props.bases.body.id)
            throw new Error(`The person names body basis ${person.body.basis} but is built on ${props.bases.body.id}`);
          documents.push({
            id: many ? `file:${name}/${person.id}` : `file:${name}`,
            domain: "person",
            document: person,
            key: humanViewerPersonKey({ document: person, bases: props.bases, sources: props.sources }),
          });
          continue;
        }
        if (candidate !== null && candidate.basis === null)
          throw new Error(`${candidateFile}: ${candidate.failure ?? "not a basis"}`);
        const identity =
          candidate === null
            ? props.bases[domain].id
            : candidate.basis!;
        if (named.basis !== identity)
          throw new Error(
            `The document names basis ${String(named.basis)} but is built on ${identity}`,
          );
        const digest = candidate === null ? props.bases[domain].digest : candidate.digest;
        const id = many ? `file:${name}/${named.id}` : `file:${name}`;
        documents.push({
          id,
          domain,
          document,
          key: hash(JSON.stringify(document) + digest + props.sources[domain]),
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
