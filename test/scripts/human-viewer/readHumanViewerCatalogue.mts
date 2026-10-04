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
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps";
import { humanViewerPersonKey } from "./humanViewerPersonKey";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";
import { readHumanViewerInputs } from "./readHumanViewerInputs";

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
  // a person is a published face on the neutral body, and the reference face
  // on each standard body state, joined at the neck
  const people = [
    ...faces.map((document) => ({
      id: "person:" + document.id,
      name: document.name ?? document.id,
      face: document,
      body: {
        id: "person-body",
        name: "neutral body",
        basis: bases.body.id,
        shape: {},
      },
    })),
    ...Object.entries(standardBodyReviewStates()).map(([name, state]) => ({
      id: "person:reference:" + name,
      name: "reference " + name,
      face: faces[0],
      body: {
        id: "person-body:" + name,
        name,
        basis: bases.body.id,
        ...state,
      },
    })),
  ];
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
          admission: props.admission ?? ((): IHumanViewerAdmission =>
            ({ state: "pending", reason: "awaiting admission: no viewer page admits documents" })),
        })
      : { documents: [], rejected: [] };
  return {
    revision: sources.browser,
    rejected: inputs.rejected,
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
      ...people.map((document) => ({
        id: document.id,
        domain: "person" as const,
        document,
        key: humanViewerPersonKey({ document, bases, sources }),
      })),
      ...inputs.documents,
    ],
  };
}
