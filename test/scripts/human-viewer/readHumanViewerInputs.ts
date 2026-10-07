import { createHash } from "node:crypto";

import { HumanViewerPendingInputError } from "./HumanViewerPendingInputError";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerInputDocument } from "./IHumanViewerInputDocument";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead";
import type { IHumanViewerInputs } from "./IHumanViewerInputs";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";
import type { IReadHumanViewerInputsProps } from "./IReadHumanViewerInputsProps";
import { classifyHumanViewerInput } from "./classifyHumanViewerInput";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";
import { humanViewerPersonKey } from "./humanViewerPersonKey";
import { humanViewerPublishedBasis } from "./humanViewerPublishedBasis";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis";
import { readHumanViewerPersonBases } from "./readHumanViewerPersonBases";
import { readHumanViewerPublishedGeneration } from "./readHumanViewerPublishedGeneration";

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
 * may instead provide `<name>.head.json.gz` and `<name>.body.json.gz`, the
 * existing typed partition views of one generation. Their generation ids
 * must agree and their basis ids must match the document. Both byte digests
 * enter the key and `candidate-generation:<name>@<head12>.<body12>` token;
 * the numerical worker
 * joins the exact views through the Person owner's normal consumer. A single
 * packet and split views cannot author the same input together. This split
 * avoids constructing one JSON string for the whole generation without
 * changing personal document admission or reducing the source geometry.
 * A Person
 * that names the published one-skin generation's view bases (both of them)
 * is drawn on that generation, with the standard people's token and key.
 * A Body can also select the same split views: its numerical document names
 * only the body basis, while the constructor consumes the exact companion
 * head endpoint source. Both digests and source owners enter its token/key.
 * A Body without a candidate sidecar that names that generation's body view
 * uses the same paired token and key inputs as a standard body state; legacy
 * body documents still name and consume their separate published basis.
 * With `props.memo` and a stamping `io`, a file's entries are reused while
 * its bytes, its sidecars, the bases, the generation and the source digests
 * are unchanged, so republishing the catalogue for an admission verdict does
 * not re-read and re-hash every input; only admission is applied again.
 */
export function readHumanViewerInputs(
  props: IReadHumanViewerInputsProps,
): IHumanViewerInputs {
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
    else
      rejected.push({
        file,
        id: entry.id,
        reason: `${entry.id}: ${admission.reason ?? admission.state}`,
        pending: admission.state === "pending",
      });
  };
  /** What every file's result depends on besides its own bytes and sidecars. */
  const shared = JSON.stringify([props.bases, props.generation, props.sources]);
  /** One file's entries and refusal, reused while nothing it depends on changed. */
  const readFile = (input: string): IHumanViewerInputFileRead => {
    const name = input.slice(0, -".json".length);
    const facts = (sidecar: string): string =>
      available.has(sidecar)
        ? JSON.stringify(props.sidecar(sidecar))
        : "absent";
    const signature = [
      props.io.stamp?.(input) ?? "",
      facts(`${name}.basis.json.gz`),
      facts(`${name}.person.json.gz`),
      facts(`${name}.head.json.gz`),
      facts(`${name}.body.json.gz`),
      shared,
    ].join("|");
    const kept = props.memo?.get(input);
    if (
      kept !== undefined &&
      kept.signature === signature &&
      props.io.stamp !== undefined
    )
      return kept;
    const entries: IHumanViewerCatalogueEntry[] = [];
    let refusal: string | null = null;
    const offer = (entry: IHumanViewerCatalogueEntry): void => {
      entries.push(entry);
    };
    try {
      if (!/^[A-Za-z0-9._-]+$/.test(name))
        throw new Error("Unsupported file name");
      const parsed = JSON.parse(
        props.io.read(input).toString("utf8"),
      ) as unknown;
      const candidateFile = `${name}.basis.json.gz`;
      const packetFile = `${name}.person.json.gz`;
      const headFile = `${name}.head.json.gz`;
      const bodyFile = `${name}.body.json.gz`;
      // A sidecar still being read off the request path holds its documents
      // back; the catalogue is published again when its facts are known.
      const sidecarOf = (sidecar: string): IHumanViewerSidecarFacts | null => {
        if (!available.has(sidecar)) return null;
        const facts = props.sidecar(sidecar);
        if (facts === null)
          throw new HumanViewerPendingInputError(
            `${sidecar} is still being read; its documents appear when it is`,
          );
        return facts;
      };
      const candidate = sidecarOf(candidateFile);
      const packetFacts = sidecarOf(packetFile);
      const split = available.has(headFile) || available.has(bodyFile);
      const many = Array.isArray(parsed);
      for (const document of many ? (parsed as unknown[]) : [parsed]) {
        const domain = classifyHumanViewerInput(document);
        if (domain !== "person" && packetFacts !== null)
          throw new Error(
            `${packetFile} is a person packet; a ${domain} document takes ${candidateFile}`,
          );
        if (domain !== "person" && domain !== "body" && split)
          throw new Error(
            "Split generation views belong to a person or body document, not a " +
              domain +
              " document.",
          );
        const named = document as IHumanViewerInputDocument;
        if (typeof named.id !== "string" || named.id === "")
          throw new Error("A document needs an id");
        if (domain === "body" && split) {
          if (candidate !== null || packetFacts !== null)
            throw new Error(
              "A paired body input selects split generation views alone.",
            );
          if (!available.has(headFile) || !available.has(bodyFile))
            throw new Error(
              "A paired body candidate requires both " +
                headFile +
                " and " +
                bodyFile +
                ".",
            );
          const headFacts = sidecarOf(headFile);
          const bodyFacts = sidecarOf(bodyFile);
          const generation = readHumanViewerPublishedGeneration({
            files: { head: headFile, body: bodyFile },
            exists: (view) =>
              available.has(view === "head" ? headFile : bodyFile),
            facts: (view) => (view === "head" ? headFacts : bodyFacts),
          });
          if ("reason" in generation)
            throw new Error("Paired body candidate: " + generation.reason);
          if (named.basis !== generation.body)
            throw new Error(
              "The body must name the exact body basis in its split generation views.",
            );
          offer({
            id: many ? `file:${name}/${named.id}` : `file:${name}`,
            domain,
            document,
            basis: `${humanViewerBasisTokens.candidateGeneration}:${name}@${generation.headDigest.slice(0, 12)}.${generation.bodyDigest.slice(0, 12)}`,
            key: hash(
              JSON.stringify(document) +
                generation.headDigest +
                generation.bodyDigest +
                props.sources.body +
                props.sources.person,
            ),
          });
          continue;
        }
        if (domain === "person") {
          if (candidate !== null)
            throw new Error(
              "Person inputs use the published face and body bases; a candidate Person sidecar is unsupported.",
            );
          const person = readHumanViewerPersonBases(document as object);
          if (split) {
            if (packetFacts !== null)
              throw new Error(
                "A person input must select one packet or split generation views, not both.",
              );
            if (!available.has(headFile) || !available.has(bodyFile))
              throw new Error(
                "A split person candidate requires both " +
                  headFile +
                  " and " +
                  bodyFile +
                  ".",
              );
            const headFacts = sidecarOf(headFile);
            const bodyFacts = sidecarOf(bodyFile);
            const generation = readHumanViewerPublishedGeneration({
              files: { head: headFile, body: bodyFile },
              exists: (view) =>
                available.has(view === "head" ? headFile : bodyFile),
              facts: (view) => (view === "head" ? headFacts : bodyFacts),
            });
            if ("reason" in generation)
              throw new Error("Split person candidate: " + generation.reason);
            if (
              person.face !== generation.face ||
              person.body !== generation.body
            )
              throw new Error(
                "The person must name the exact face and body bases in its split generation views.",
              );
            offer({
              id: many ? `file:${name}/${named.id}` : `file:${name}`,
              domain: "person",
              document,
              basis: `${humanViewerBasisTokens.candidateGeneration}:${name}@${generation.headDigest.slice(0, 12)}.${generation.bodyDigest.slice(0, 12)}`,
              key: humanViewerPersonKey({
                document,
                bases: {
                  face: { digest: generation.headDigest },
                  body: { digest: generation.bodyDigest },
                },
                sources: props.sources,
              }),
            });
            continue;
          }
          if (packetFacts !== null) {
            if (packetFacts.packet === null)
              throw new Error(
                `${packetFile}: ${packetFacts.failure ?? "not a person packet"}`,
              );
            const digest = packetFacts.digest;
            const packet = packetFacts.packet;
            if (person.face !== packet.face)
              throw new Error(
                `The person names face basis ${person.face} but its packet ${packetFile} carries face basis ${packet.face}`,
              );
            if (person.body !== packet.body)
              throw new Error(
                `The person names body basis ${person.body} but its packet ${packetFile} carries body basis ${packet.body}`,
              );
            offer({
              id: many ? `file:${name}/${named.id}` : `file:${name}`,
              domain: "person",
              document,
              key: humanViewerPersonKey({
                document,
                bases: { face: { digest }, body: { digest } },
                sources: props.sources,
              }),
              basis: `${name}@${digest.slice(0, 12)}`,
            });
            continue;
          }
          const generation = props.generation;
          if (
            generation !== null &&
            person.face === generation.face &&
            person.body === generation.body
          ) {
            offer({
              id: many ? `file:${name}/${named.id}` : `file:${name}`,
              domain: "person",
              document,
              basis: humanViewerPublishedGenerationBasis(generation),
              key: humanViewerPersonKey({
                document,
                bases: {
                  face: { digest: generation.headDigest },
                  body: { digest: generation.bodyDigest },
                },
                sources: props.sources,
              }),
            });
            continue;
          }
          if (person.face !== props.bases.face.id)
            throw new Error(
              `The person names face basis ${person.face} but is built on ${props.bases.face.id}` +
                (generation === null
                  ? ""
                  : ` (or, on the published person generation, ${generation.face} with body ${generation.body})`),
            );
          if (person.body !== props.bases.body.id)
            throw new Error(
              `The person names body basis ${person.body} but is built on ${props.bases.body.id}`,
            );
          offer({
            id: many ? `file:${name}/${named.id}` : `file:${name}`,
            domain: "person",
            document,
            basis: humanViewerPublishedBasis(
              props.bases.face.digest,
              props.bases.body.digest,
            ),
            key: humanViewerPersonKey({
              document,
              bases: props.bases,
              sources: props.sources,
            }),
          });
          continue;
        }
        if (candidate !== null && candidate.basis === null)
          throw new Error(
            `${candidateFile}: ${candidate.failure ?? "not a basis"}`,
          );
        const generation = props.generation;
        if (
          domain === "body" &&
          candidate === null &&
          generation !== null &&
          named.basis === generation.body
        ) {
          offer({
            id: many ? `file:${name}/${named.id}` : `file:${name}`,
            domain,
            document,
            key: hash(
              JSON.stringify(document) +
                generation.headDigest +
                generation.bodyDigest +
                props.sources.body +
                props.sources.person,
            ),
            basis: humanViewerPublishedGenerationBasis(generation),
          });
          continue;
        }
        const identity =
          candidate === null ? props.bases[domain].id : candidate.basis!;
        if (named.basis !== identity)
          throw new Error(
            `The document names basis ${String(named.basis)} but is built on ${identity}`,
          );
        const digest =
          candidate === null ? props.bases[domain].digest : candidate.digest;
        const id = many ? `file:${name}/${named.id}` : `file:${name}`;
        offer({
          id,
          domain,
          document,
          key: hash(JSON.stringify(document) + digest + props.sources[domain]),
          basis:
            candidate === null
              ? humanViewerPublishedBasis(digest)
              : `${name}@${digest.slice(0, 12)}`,
        });
      }
    } catch (error) {
      if (error instanceof HumanViewerPendingInputError) throw error;
      refusal = error instanceof Error ? error.message : String(error);
    }
    const result: IHumanViewerInputFileRead = { signature, entries, refusal };
    props.memo?.set(input, result);
    return result;
  };
  for (file of [...available].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!file.endsWith(".json") || file.endsWith(".basis.json")) continue;
    try {
      const read = readFile(file);
      for (const entry of read.entries) accept(entry);
      if (read.refusal !== null)
        rejected.push({ file, reason: read.refusal, pending: false });
    } catch (error) {
      rejected.push({
        file,
        reason: error instanceof Error ? error.message : String(error),
        pending: true,
      });
    }
  }
  return { documents, rejected };
}
