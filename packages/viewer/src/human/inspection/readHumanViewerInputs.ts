import { createHash } from "node:crypto";

import { HumanViewerPendingInputError } from "./HumanViewerPendingInputError.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerInputDocument } from "./IHumanViewerInputDocument.js";
import type { IHumanViewerInputFileRead } from "./IHumanViewerInputFileRead.js";
import type { IHumanViewerInputs } from "./IHumanViewerInputs.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";
import type { IReadHumanViewerInputsProps } from "./IReadHumanViewerInputsProps.js";
import { classifyHumanViewerInput } from "./classifyHumanViewerInput.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";
import { humanViewerPersonKey } from "./humanViewerPersonKey.js";
import { humanViewerPublishedBasis } from "./humanViewerPublishedBasis.js";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis.js";
import { readHumanViewerPersonBases } from "./readHumanViewerPersonBases.js";
import { readHumanViewerPublishedGeneration } from "./readHumanViewerPublishedGeneration.js";

/**
 * Offer hand-written input documents and their optional candidate basis files as catalogue entries. One document uses file:name; array members use file:name/id. Domain owners admit these offers through the page, and missing verdicts remain pending rather than accepted.
 *
 * Face/body documents must name their candidate sidecar identity or selected published basis. Person requires both basis identities and uses a whole .person.json.gz packet or paired .head.json.gz/.body.json.gz views with matching generation ids; packet and split forms cannot coexist. A lone .basis.json.gz cannot provide Person's two authorities. Split construction remains with the numerical Person owner.
 *
 * Body can use split generation views with the companion head endpoint, or its separate legacy basis. Document keys include the selected source and basis digests; transport tokens use digest prefixes and do not exclude prefix collisions. This catalogue does not independently prove fresh pixels or full numerical validity.
 *
 * A file refusal does not hide other files. For an invalid array member, earlier offered members can remain while later members in that same array are not processed. Photographs are not read.
 *
 * Memoized entries reuse admitted IO stamp facts, selected sidecars, basis/generation and source authority; admission is projected again. An mtime/size provider can miss an in-place rewrite preserving both values. Current directory membership prunes removed file names even during selected-document reads.
 *
 * @evidence contracts/common.md#principled-implementation File documents and optional candidate packet/split views must name exact basis identities before numerical keys and tokens are offered to the existing domain admission owner.
 * @evidence contracts/common.md#clear-and-simple-design Per-file parsing/memoization separates raw offers from current admitted/pending/refused catalogue projection, preserving other files when one input refuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Person candidates cannot collapse two basis authorities into one sidecar, split/packet overlap refuses and photographs never enter numerical inputs; full schema admission remains with each domain.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines file ids, candidate variants, immutable basis/source key inputs and page-owned pending/refusal visibility.
 * @evidence contracts/performance.md#efficient-algorithms Each selected file parses/hashes documents when its signature changes; sorting file names costs O(n log n), and sidecar facts are consulted rather than inflated on the catalogue path.
 * @evidence contracts/performance.md#reuse-equivalent-work Memo signatures include provider stamp, sidecar facts and shared bases/generation/sources; mtime/size stamps can collide and do not independently prove unchanged bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Memo records for names removed from the complete directory inventory are pruned; live input names have no independent cap, result arrays retain current documents/refusals and worker/GPU ownership remains separate.
 */
export function readHumanViewerInputs(
  props: IReadHumanViewerInputsProps,
): IHumanViewerInputs {
  const hash: (bytes: string | Uint8Array) => string = (bytes: string | Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");
  const available: Set<string> = new Set(props.io.names());
  for (const retained of props.memo?.keys() ?? [])
    if (!available.has(retained)) props.memo?.delete(retained);
  const documents: IHumanViewerCatalogue["documents"] = [];
  const rejected: IHumanViewerRejectedInput[] = [];
  // A document is drawable only after its owner admitted it in the page; a
  // pending or refused one is listed with the file and its reason instead.
  let file: string = "";
  const accept: (entry: IHumanViewerCatalogueEntry) => void = (entry: IHumanViewerCatalogueEntry): void => {
    if (props.selectedDoc !== undefined && entry.id !== props.selectedDoc) return;
    const admission: ReturnType<IReadHumanViewerInputsProps["admission"]> = props.admission(entry);
    if (admission.state === "admitted") documents.push(entry);
    else
      rejected.push({
        file,
        id: entry.id,
        reason: `${entry.id}: ${admission.reason ?? admission.state}`,
        pending: admission.state === "pending",
        ...(admission.state === "pending" ? { candidate: entry } : {}),
      });
  };
  /** What every file's result depends on besides its own bytes and sidecars. */
  const shared: string = JSON.stringify([props.bases, props.generation, props.sources]);
  /** One file's entries and refusal, reused while nothing it depends on changed. */
  const readFile: (input: string) => IHumanViewerInputFileRead = (input: string): IHumanViewerInputFileRead => {
    const name: string = input.slice(0, -".json".length);
    const facts: (sidecar: string) => string = (sidecar: string): string =>
      available.has(sidecar)
        ? JSON.stringify(props.sidecar(sidecar))
        : "absent";
    const signature: string = [
      props.io.stamp?.(input) ?? "",
      facts(`${name}.basis.json.gz`),
      facts(`${name}.person.json.gz`),
      facts(`${name}.head.json.gz`),
      facts(`${name}.body.json.gz`),
      shared,
    ].join("|");
    const kept: IHumanViewerInputFileRead | undefined = props.memo?.get(input);
    if (
      kept !== undefined &&
      kept.signature === signature &&
      props.io.stamp !== undefined
    )
      return kept;
    const entries: IHumanViewerCatalogueEntry[] = [];
    let refusal: string | null = null;
    const offer: (entry: IHumanViewerCatalogueEntry) => void = (entry: IHumanViewerCatalogueEntry): void => {
      entries.push(entry);
    };
    try {
      if (!/^[A-Za-z0-9._-]+$/.test(name))
        throw new Error("Unsupported file name");
      const parsed: unknown = JSON.parse(
        props.io.read(input).toString("utf8"),
      ) as unknown;
      const candidateFile: string = `${name}.basis.json.gz`;
      const packetFile: string = `${name}.person.json.gz`;
      const headFile: string = `${name}.head.json.gz`;
      const bodyFile: string = `${name}.body.json.gz`;
      // A sidecar still being read off the request path holds its documents
      // back; the catalogue is published again when its facts are known.
      const sidecarOf: (sidecar: string) => IHumanViewerSidecarFacts | null = (sidecar: string): IHumanViewerSidecarFacts | null => {
        if (!available.has(sidecar)) return null;
        const facts: IHumanViewerSidecarFacts | null = props.sidecar(sidecar);
        if (facts === null)
          throw new HumanViewerPendingInputError(
            `${sidecar} is still being read; its documents appear when it is`,
          );
        return facts;
      };
      const candidate: IHumanViewerSidecarFacts | null = sidecarOf(candidateFile);
      const packetFacts: IHumanViewerSidecarFacts | null = sidecarOf(packetFile);
      const split: boolean = available.has(headFile) || available.has(bodyFile);
      const many: boolean = Array.isArray(parsed);
      for (const document of many ? (parsed as unknown[]) : [parsed]) {
        const domain: ReturnType<typeof classifyHumanViewerInput> = classifyHumanViewerInput(document);
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
        const named: IHumanViewerInputDocument = document as IHumanViewerInputDocument;
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
          const headFacts: IHumanViewerSidecarFacts | null = sidecarOf(headFile);
          const bodyFacts: IHumanViewerSidecarFacts | null = sidecarOf(bodyFile);
          const generation: ReturnType<typeof readHumanViewerPublishedGeneration> = readHumanViewerPublishedGeneration({
            files: { head: headFile, body: bodyFile },
            exists: (view: "head" | "body"): boolean =>
              available.has(view === "head" ? headFile : bodyFile),
            facts: (view: "head" | "body"): IHumanViewerSidecarFacts | null => (view === "head" ? headFacts : bodyFacts),
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
          const person: ReturnType<typeof readHumanViewerPersonBases> = readHumanViewerPersonBases(document as object);
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
            const headFacts: IHumanViewerSidecarFacts | null = sidecarOf(headFile);
            const bodyFacts: IHumanViewerSidecarFacts | null = sidecarOf(bodyFile);
            const generation: ReturnType<typeof readHumanViewerPublishedGeneration> = readHumanViewerPublishedGeneration({
              files: { head: headFile, body: bodyFile },
              exists: (view: "head" | "body"): boolean =>
                available.has(view === "head" ? headFile : bodyFile),
              facts: (view: "head" | "body"): IHumanViewerSidecarFacts | null => (view === "head" ? headFacts : bodyFacts),
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
            const digest: string = packetFacts.digest;
            const packet: NonNullable<IHumanViewerSidecarFacts["packet"]> = packetFacts.packet;
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
          const generation: IReadHumanViewerInputsProps["generation"] = props.generation;
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
        const generation: IReadHumanViewerInputsProps["generation"] = props.generation;
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
        const identity: string =
          candidate === null ? props.bases[domain].id : candidate.basis!;
        if (named.basis !== identity)
          throw new Error(
            `The document names basis ${String(named.basis)} but is built on ${identity}`,
          );
        const digest: string =
          candidate === null ? props.bases[domain].digest : candidate.digest;
        const id: string = many ? `file:${name}/${named.id}` : `file:${name}`;
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
  for (file of [...available].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!file.endsWith(".json") || file.endsWith(".basis.json")) continue;
    if (props.selectedDoc !== undefined &&
        (!props.selectedDoc.startsWith("file:") ||
         file !== props.selectedDoc.slice(5).split("/")[0] + ".json")) continue;
    try {
      const read: IHumanViewerInputFileRead = readFile(file);
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
