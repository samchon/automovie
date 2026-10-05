/**
 * Read the numerical study inputs and name their model-cache keys. The
 * server owns source watching; this function names the catalogue's groups
 * and their order: face documents, subject people, the standard people and
 * standard body states (viewer-authored, built on the published one-skin
 * generation and admitted by their owner in the page), and hand-written
 * inputs. Each group is read by its own owner. It never reads reference
 * photographs. A basis without its opening identity refuses before
 * catalogue publication; without a usable generation the standard people and
 * body states are listed as rejected with the reason instead of falling back
 * to the legacy bases.
 *
 * @evidence contracts/common.md#principled-implementation Document, basis and source digests identify the numerical generation independently of display state.
 * @evidence contracts/common.md#clear-and-simple-design A small orchestrator names the group order; every group has its own reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Published subjects and standard states supply the population without consumer-specific cases.
 * @evidence contracts/common.md#meaningful-documentation Describes the groups, their order, cache authority and identity refusal.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps";
import { admitHumanViewerAuthoredEntries } from "./admitHumanViewerAuthoredEntries";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";
import { readHumanViewerFaceDocuments } from "./readHumanViewerFaceDocuments";
import { readHumanViewerInputs } from "./readHumanViewerInputs";
import { readHumanViewerStandardBodies } from "./readHumanViewerStandardBodies";
import { readHumanViewerStandardPeople } from "./readHumanViewerStandardPeople";
import { readHumanViewerSubjectPeople } from "./readHumanViewerSubjectPeople";

export function readHumanViewerCatalogue(props: IReadHumanViewerCatalogueProps): IHumanViewerCatalogue {
  const sources = props.revisions;
  const readBasis = (file: string): IHumanViewerBasisIdentity => {
    if (props.basisOf !== undefined) return props.basisOf(file);
    const bytes = fs.readFileSync(file);
    return { id: readHumanViewerBasisIdentity(bytes), digest: createHash("sha256").update(bytes).digest("hex") };
  };
  const bases = { face: readBasis(props.basisFiles.face), body: readBasis(props.basisFiles.body) };
  const admit = props.admission ?? ((): IHumanViewerAdmission =>
    ({ state: "pending", reason: "awaiting admission: no viewer page admits documents" }));
  // The subject list is re-read and re-keyed only when it, the face basis or
  // the face source changed: an admission verdict republishes the catalogue.
  const subjectsStat = fs.statSync(props.documentsFile);
  const faceSignature = `${subjectsStat.mtimeMs}:${subjectsStat.size}|${bases.face.digest}|${sources.face}`;
  const faces = props.faceMemo !== undefined && props.faceMemo.signature === faceSignature && props.faceMemo.value !== null
    ? props.faceMemo.value
    : readHumanViewerFaceDocuments({ face: bases.face, documentsFile: props.documentsFile, sources });
  if (props.faceMemo !== undefined) {
    props.faceMemo.signature = faceSignature;
    props.faceMemo.value = faces;
  }
  const subjectPeople = readHumanViewerSubjectPeople({ subjects: faces.subjects, bases, sources });
  const generation = (props.generation ?? ((): IHumanViewerRejectedInput => ({
    file: "test/studies/human-person/generation", pending: false,
    reason: "person generation files are not published yet" })))();
  const authored = "reason" in generation
    ? { documents: [], rejected: [generation] }
    : admitHumanViewerAuthoredEntries([
      ...readHumanViewerStandardBodies({ generation, sources }),
      ...readHumanViewerStandardPeople({ reference: faces.reference, generation, sources }),
    ], admit);
  const inputs =
    props.inputsDirectory !== undefined && fs.existsSync(props.inputsDirectory)
      ? readHumanViewerInputs({
          io: {
            names: () => fs.readdirSync(props.inputsDirectory!),
            read: (name) => fs.readFileSync(path.join(props.inputsDirectory!, name)),
            stamp: (name) => {
              const stat = fs.statSync(path.join(props.inputsDirectory!, name));
              return `${stat.mtimeMs}:${stat.size}`;
            },
          },
          memo: props.inputsMemo,
          bases,
          generation: "reason" in generation ? null : generation,
          sources,
          sidecar: props.sidecar ?? (() => null),
          admission: admit,
        })
      : { documents: [], rejected: [] };
  return {
    revision: sources.browser,
    rejected: [...authored.rejected, ...inputs.rejected],
    documents: [...faces.entries, ...subjectPeople, ...authored.documents, ...inputs.documents],
  };
}
