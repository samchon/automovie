import { createHash } from "node:crypto";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerInputs } from "./IHumanViewerInputs";
import { HumanViewerPendingInputError } from "./HumanViewerPendingInputError";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerInputDocument } from "./IHumanViewerInputDocument";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";
import type { IReadHumanViewerInputsProps } from "./IReadHumanViewerInputsProps";
import { classifyHumanViewerInput } from "./classifyHumanViewerInput";
import { humanViewerPersonKey } from "./humanViewerPersonKey";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis";
import { humanViewerPublishedBasis } from "./humanViewerPublishedBasis";
import { readHumanViewerPersonBases } from "./readHumanViewerPersonBases";

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
 * sources and the actual composer's numerical source. Only its id and its two
 * declared basis names are read here. Every input document, face, body or
 * person, is admitted by its owner in the viewer page (`props.admission`);
 * until that verdict exists it is listed as pending, and an owner refusal is
 * listed with its reason, so schema errors show at `/rescan` and `/docs`. A `<name>.basis.json.gz` sidecar refuses for
 * a Person: one basis file does not specify the two independent basis
 * authorities. A Person built on candidates instead takes
 * `<name>.person.json.gz`, one person generation packet that opens with its
 * `id` and carries whole `face` and `body` bases; the document's face basis must be the
 * packet's face `id` and its body basis the packet's body `id`, the entry's
 * `basis` is `<name>@<digest12>` like a face or body candidate, and the key
 * hashes the packet's digest in place of both published bases. A Person
 * that names the published one-skin generation's view bases (both of them)
 * is drawn on that generation, with the standard people's token and key.
 */
export function readHumanViewerInputs(props: IReadHumanViewerInputsProps): IHumanViewerInputs {
  const hash = (bytes: string | Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");
  const available = new Set(props.io.names());
  const documents: IHumanViewerCatalogue["documents"] = [];
  const rejected: IHumanViewerRejectedInput[] = [];
  // A document is drawable only after its owner admitted it in the page; a
  // pending or refused one is listed with the file and its reason instead.
  let file = "";
  const accept = (entry: IHumanViewerCatalogueEntry): void => {
    const admission = props.admission(entry);
    if (admission.state === "admitted") documents.push(entry);
    else rejected.push({ file, reason: `${entry.id}: ${admission.reason ?? admission.state}`,
      pending: admission.state === "pending" });
  };
  for (file of [...available].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
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
        if (facts === null)
          throw new HumanViewerPendingInputError(`${sidecar} is still being read; its documents appear when it is`);
        return facts;
      };
      const candidate = sidecarOf(candidateFile);
      const packetFacts = sidecarOf(packetFile);
      const many = Array.isArray(parsed);
      for (const document of many ? (parsed as unknown[]) : [parsed]) {
        const domain = classifyHumanViewerInput(document);
        if (domain !== "person" && packetFacts !== null)
          throw new Error(`${packetFile} is a person packet; a ${domain} document takes ${candidateFile}`);
        const named = document as IHumanViewerInputDocument;
        if (typeof named.id !== "string" || named.id === "")
          throw new Error("A document needs an id");
        if (domain === "person") {
          if (candidate !== null)
            throw new Error("Person inputs use the published face and body bases; a candidate Person sidecar is unsupported.");
          const person = readHumanViewerPersonBases(document as object);
          if (packetFacts !== null) {
            if (packetFacts.packet === null)
              throw new Error(`${packetFile}: ${packetFacts.failure ?? "not a person packet"}`);
            const digest = packetFacts.digest;
            const packet = packetFacts.packet;
            if (person.face !== packet.face)
              throw new Error(`The person names face basis ${person.face} but its packet ${packetFile} carries face basis ${packet.face}`);
            if (person.body !== packet.body)
              throw new Error(`The person names body basis ${person.body} but its packet ${packetFile} carries body basis ${packet.body}`);
            accept({
              id: many ? `file:${name}/${named.id}` : `file:${name}`,
              domain: "person",
              document,
              key: humanViewerPersonKey({ document,
                bases: { face: { digest }, body: { digest } }, sources: props.sources }),
              basis: `${name}@${digest.slice(0, 12)}`,
            });
            continue;
          }
          const generation = props.generation;
          if (generation !== null && person.face === generation.face && person.body === generation.body) {
            accept({
              id: many ? `file:${name}/${named.id}` : `file:${name}`,
              domain: "person",
              document,
              basis: humanViewerPublishedGenerationBasis(generation),
              key: humanViewerPersonKey({ document,
                bases: { face: { digest: generation.headDigest }, body: { digest: generation.bodyDigest } },
                sources: props.sources }),
            });
            continue;
          }
          if (person.face !== props.bases.face.id)
            throw new Error(`The person names face basis ${person.face} but is built on ${props.bases.face.id}` +
              (generation === null ? "" : ` (or, on the published person generation, ${generation.face} with body ${generation.body})`));
          if (person.body !== props.bases.body.id)
            throw new Error(`The person names body basis ${person.body} but is built on ${props.bases.body.id}`);
          accept({
            id: many ? `file:${name}/${named.id}` : `file:${name}`,
            domain: "person",
            document,
            basis: humanViewerPublishedBasis(props.bases.face.digest, props.bases.body.digest),
            key: humanViewerPersonKey({ document, bases: props.bases, sources: props.sources }),
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
        accept({
          id,
          domain,
          document,
          key: hash(JSON.stringify(document) + digest + props.sources[domain]),
          basis: candidate === null ? humanViewerPublishedBasis(digest) : `${name}@${digest.slice(0, 12)}`,
        });
      }
    } catch (error) {
      rejected.push({
        file,
        reason: error instanceof Error ? error.message : String(error),
        pending: error instanceof HumanViewerPendingInputError,
      });
    }
  }
  return { documents, rejected };
}
