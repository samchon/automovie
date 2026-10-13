import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps.js";
import { admitHumanViewerAuthoredEntries } from "./admitHumanViewerAuthoredEntries.js";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity.js";
import { readHumanViewerFaceDocuments } from "./readHumanViewerFaceDocuments.js";
import { readHumanViewerGenerationSubjects } from "./readHumanViewerGenerationSubjects.js";
import { readHumanViewerInputs } from "./readHumanViewerInputs.js";
import { readHumanViewerStandardBodies } from "./readHumanViewerStandardBodies.js";

/**
 * Read the application-authored numerical inputs and name their model-cache keys. The
 * server owns source watching; this function names the catalogue's groups
 * and their order: face documents, subject people, the standard people and
 * standard body states (viewer-authored, built on the published one-skin
 * generation and admitted through their owner's numerical bridge), and hand-written
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Document, basis and source digests identify the numerical generation independently of display state.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view A small orchestrator names the group order; every group has its own reader.
 */
export function readHumanViewerCatalogue(
  props: IReadHumanViewerCatalogueProps,
): IHumanViewerCatalogue {
  const sources = props.revisions;
  const readBasis = (file: string): IHumanViewerBasisIdentity => {
    if (props.basisOf !== undefined) return props.basisOf(file);
    const bytes = fs.readFileSync(file);
    return {
      id: readHumanViewerBasisIdentity(bytes),
      digest: createHash("sha256").update(bytes).digest("hex"),
    };
  };
  const bases = {
    face: readBasis(props.basisFiles.face),
    body: readBasis(props.basisFiles.body),
  };
  const admit =
    props.admission ??
    ((): IHumanViewerAdmission => ({
      state: "pending",
      reason: "awaiting admission: no viewer page admits documents",
    }));
  // The subject list is re-read and re-keyed only when it, the face basis or
  // the face source changed: an admission verdict republishes the catalogue.
  const subjectsStat = fs.statSync(props.documentsFile);
  const reference = props.exampleSources.reference(bases.face);
  const faceSignature = `${subjectsStat.mtimeMs}:${subjectsStat.size}|${bases.face.digest}|${sources.face}|${JSON.stringify(reference)}`;
  const faces =
    props.faceMemo !== undefined &&
    props.faceMemo.signature === faceSignature &&
    props.faceMemo.value !== null
      ? props.faceMemo.value
      : readHumanViewerFaceDocuments({
          reference,
          face: bases.face,
          documentsFile: props.documentsFile,
          sources,
        });
  if (props.faceMemo !== undefined) {
    props.faceMemo.signature = faceSignature;
    props.faceMemo.value = faces;
  }
  const generation = props.independentInput === true ? null : (
    props.generation ??
    ((): IHumanViewerRejectedInput => ({
      file: "packages/human/assets/person",
      pending: false,
      reason: "person generation files are not published yet",
    }))
  )();
  // Subject people come from the source owner's generation subject file when
  // it exists (drawn on the one-skin generation); otherwise from the legacy
  // published face and body pair.
  const generationSubjects =
    generation === null || "reason" in generation ||
    props.subjectPeopleFile === undefined ||
    !fs.existsSync(props.subjectPeopleFile)
      ? null
      : readHumanViewerGenerationSubjects({
          text: fs.readFileSync(props.subjectPeopleFile, "utf8"),
          file: path
            .relative(
              path.resolve(props.subjectPeopleFile, "../../../.."),
              props.subjectPeopleFile,
            )
            .replaceAll("\\", "/"),
          generation,
          sources,
        });
  const subjectPeople =
    generationSubjects === null
      ? props.exampleSources.subjectPeople({
          subjects: faces.subjects,
          bases,
          sources,
        })
      : [];
  const authored =
    generation === null || "reason" in generation
      ? { documents: [], rejected: generation === null ? [] : [generation] }
      : admitHumanViewerAuthoredEntries(
          [
            ...readHumanViewerStandardBodies({ generation, sources, examples: props.bodyExamples }),
            ...props.exampleSources.standardPeople({
              reference: faces.reference,
              generation,
              sources,
              examples: props.bodyExamples,
            }),
            ...(generationSubjects?.documents ?? []),
          ].filter((entry) => props.selectedDoc === undefined || entry.id === props.selectedDoc),
          admit,
        );
  if (generationSubjects !== null)
    authored.rejected.push(...generationSubjects.rejected);
  const inputs =
    props.inputsDirectory !== undefined && fs.existsSync(props.inputsDirectory)
      ? readHumanViewerInputs({
          selectedDoc: props.selectedDoc,
          io: {
            names: () => fs.readdirSync(props.inputsDirectory!),
            read: (name) =>
              fs.readFileSync(path.join(props.inputsDirectory!, name)),
            stamp: (name) => {
              const stat = fs.statSync(path.join(props.inputsDirectory!, name));
              return `${stat.mtimeMs}:${stat.size}`;
            },
          },
          memo: props.inputsMemo,
          bases,
          generation: generation === null || "reason" in generation ? null : generation,
          sources,
          sidecar: props.sidecar ?? (() => null),
          admission: admit,
        })
      : { documents: [], rejected: [] };
  return {
    revision: sources.browser,
    rejected: [...authored.rejected, ...inputs.rejected],
    documents: [
      ...faces.entries,
      ...subjectPeople,
      ...authored.documents,
      ...inputs.documents,
    ].filter((entry) => props.selectedDoc === undefined || entry.id === props.selectedDoc),
  };
}
