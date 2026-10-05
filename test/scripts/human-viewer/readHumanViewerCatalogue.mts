/**
 * Read the immutable numerical study inputs and name their model-cache keys.
 * The server owns source watching; this reader owns basis identity, document
 * population and digest composition. It never reads reference photographs.
 * A basis without its opening identity refuses before catalogue publication.
 *
 * @evidence contracts/common.md#principled-implementation Document, basis and source digests identify the numerical generation independently of display state.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue reading is one responsibility separated from HTTP and browser lifecycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Published subjects and standard states supply the population without consumer-specific cases.
 * @evidence contracts/common.md#meaningful-documentation Describes immutable inputs, cache authority and identity refusal.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument";
import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps";
import { humanViewerPersonKey } from "./humanViewerPersonKey";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";
import { readHumanViewerInputs } from "./readHumanViewerInputs";

/** The person basis token the numerical worker reads as the published generation views. */
const PUBLISHED_GENERATION = "published-generation";

export function readHumanViewerCatalogue(props: IReadHumanViewerCatalogueProps): IHumanViewerCatalogue {
  const hash = (bytes: string | Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");
  const sources = props.revisions;
  const readBasis = (file: string): IHumanViewerBasisIdentity => {
    if (props.basisOf !== undefined) return props.basisOf(file);
    const bytes = fs.readFileSync(file);
    return { id: readHumanViewerBasisIdentity(bytes), digest: hash(bytes) };
  };
  const bases = {
    face: readBasis(props.basisFiles.face),
    body: readBasis(props.basisFiles.body),
  };
  const subjects = JSON.parse(
    fs.readFileSync(props.documentsFile, "utf8"),
  ) as IHumanViewerSubjectDocument[];
  const faces = [
    {
      id: "connected-reference",
      name: "CC0 connected reference",
      basis: bases.face.id,
      shape: {},
      expression: {},
    },
    ...subjects,
  ];
  // Each published subject on the neutral body stays on the legacy published
  // face and body bases: those documents use the population macros the
  // one-skin generation does not carry.
  const subjectPeople = faces.slice(1).map((document) => ({
    id: "person:" + document.id,
    name: document.name ?? document.id,
    face: document,
    body: {
      id: "person-body",
      name: "neutral body",
      basis: bases.body.id,
      shape: {},
    },
  }));
  // The standard people are drawn on the published one-skin generation:
  // their documents name its view bases and the worker builds them from
  // `/basis/person/head` and `/basis/person/body` (basis token below). Without
  // a usable generation they are listed as rejected with the reason, never
  // drawn on the legacy pair.
  const generation = (props.generation ?? ((): IHumanViewerRejectedInput => ({
    file: "test/studies/human-person/generation", pending: false,
    reason: "person generation files are not published yet" })))();
  const generationRejected: IHumanViewerRejectedInput[] = "reason" in generation ? [generation] : [];
  const standardPeople = "reason" in generation ? [] : [
    {
      id: "person:connected-reference",
      name: faces[0].name ?? faces[0].id,
      face: { ...faces[0], basis: generation.face },
      body: { id: "person-body", name: "neutral body", basis: generation.body, shape: {} },
    },
    ...Object.entries(standardBodyReviewStates()).map(([name, state]) => ({
      id: "person:reference:" + name,
      name: "reference " + name,
      // Age and sex are stated once, on the person: the head follows the body state.
      population: "linked",
      face: { ...faces[0], basis: generation.face },
      body: { id: "person-body:" + name, name, basis: generation.body, ...state },
    })),
  ];
  // The viewer authors these documents, so they take the same owner admission
  // in the page as hand-written inputs: a wrong shape is listed among the
  // rejected entries by name instead of surfacing only as a render refusal.
  // Published source documents (subjects, standard body states) are not
  // admitted here, as before.
  const admit = props.admission ?? ((): IHumanViewerAdmission =>
    ({ state: "pending", reason: "awaiting admission: no viewer page admits documents" }));
  const standardEntries: IHumanViewerCatalogueEntry[] = "reason" in generation ? [] :
    standardPeople.map((document) => ({
      id: document.id,
      domain: "person" as const,
      document,
      // The worker reads this token as the published generation views.
      basis: PUBLISHED_GENERATION,
      key: humanViewerPersonKey({ document,
        bases: { face: { digest: generation.headDigest }, body: { digest: generation.bodyDigest } },
        sources }),
    }));
  const judged = new Map(standardEntries.map((entry) => [entry.id, admit(entry)]));
  const standardRejected: IHumanViewerRejectedInput[] = standardEntries
    .filter((entry) => judged.get(entry.id)!.state !== "admitted")
    .map((entry) => ({ file: `viewer-authored ${entry.id}`,
      reason: `${entry.id}: ${judged.get(entry.id)!.reason ?? judged.get(entry.id)!.state}`,
      pending: judged.get(entry.id)!.state === "pending" }));
  const inputs =
    props.inputsDirectory !== undefined && fs.existsSync(props.inputsDirectory)
      ? readHumanViewerInputs({
          io: {
            names: () => fs.readdirSync(props.inputsDirectory!),
            read: (name) => fs.readFileSync(path.join(props.inputsDirectory!, name)),
          },
          bases,
          sources,
          sidecar: props.sidecar ?? (() => null),
          admission: admit,
        })
      : { documents: [], rejected: [] };
  return {
    revision: sources.browser,
    rejected: [...generationRejected, ...standardRejected, ...inputs.rejected],
    documents: [
      ...faces.map((document) => ({
        id: document.id,
        domain: "face" as const,
        document,
        key: hash(JSON.stringify(document) + bases.face.digest + sources.face),
      })),
      ...Object.entries(standardBodyReviewStates()).map(([name, state]) => {
        const document = {
          id: "body:" + name,
          name,
          basis: bases.body.id,
          ...state,
        };
        return {
          id: document.id,
          domain: "body" as const,
          document,
          key: hash(JSON.stringify(document) + bases.body.digest + sources.body),
        };
      }),
      ...subjectPeople.map((document) => ({
        id: document.id,
        domain: "person" as const,
        document,
        key: humanViewerPersonKey({ document, bases, sources }),
      })),
      ...standardEntries.filter((entry) => judged.get(entry.id)?.state === "admitted"),
      ...inputs.documents,
    ],
  };
}
