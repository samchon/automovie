import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";
import type { IReadHumanViewerCatalogueProps } from "./IReadHumanViewerCatalogueProps.js";
import { admitHumanViewerAuthoredEntries } from "./admitHumanViewerAuthoredEntries.js";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity.js";
import { readHumanViewerFaceDocuments } from "./readHumanViewerFaceDocuments.js";
import { readHumanViewerGenerationSubjects } from "./readHumanViewerGenerationSubjects.js";
import { readHumanViewerInputs } from "./readHumanViewerInputs.js";
import { readHumanViewerStandardBodies } from "./readHumanViewerStandardBodies.js";

/**
 * Read the application-authored numerical inputs and name their model-cache keys. The server owns source watching. The published concatenation is face documents, conditional legacy subject people, then admitted standard body states, standard people and generation subjects in that order, followed by hand-written inputs. The generation groups are viewer-authored, built on the published one-skin generation and admitted through their owner's numerical bridge. Each group is read by its own owner; this function never reads reference photographs. A basis without its opening identity refuses before catalogue publication. Without a usable generation the standard people and body states are rejected with their reason instead of falling back to legacy bases.
 *
 * @evidence contracts/common.md#principled-implementation Published face/body identities and actual source revisions feed group owners for faces, subjects, standard generation entries and file inputs, with authored/file candidates admitted by the supplied page owner.
 * @evidence contracts/common.md#clear-and-simple-design One catalogue composition preserves group ordering and joins document/rejection arrays without reading reference photographs or building numerical geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing generation lists its reason instead of silently replacing standard people/body states with legacy bases; face projection remains published-source metadata rather than full schema certification.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies group owners, application-authored examples, basis-opening refusal and generation fallback limits.
 * @evidence contracts/performance.md#efficient-algorithms Memoized face projection avoids repeated parse/hash only under its supplied stamp/basis/source/reference signature; other group and input costs remain with their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Face memo equality uses mtime/size plus numerical/reference identities and cannot detect a same-stamp byte rewrite; source/input and actual page admission remain separate authorities.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned catalogue retains its current documents and refusal records; optional memos live with source ownership and no reference image, GPU resident or numerical process is acquired.
 */
export function readHumanViewerCatalogue(
  props: IReadHumanViewerCatalogueProps,
): IHumanViewerCatalogue {
  const sources: IReadHumanViewerCatalogueProps["revisions"] = props.revisions;
  const readBasis: (file: string) => IHumanViewerBasisIdentity = (
    file: string,
  ): IHumanViewerBasisIdentity => {
    if (props.basisOf !== undefined) return props.basisOf(file);
    const bytes: Buffer = fs.readFileSync(file);
    return {
      id: readHumanViewerBasisIdentity(bytes),
      digest: createHash("sha256").update(bytes).digest("hex"),
    };
  };
  const bases: Record<"face" | "body", IHumanViewerBasisIdentity> = {
    face: readBasis(props.basisFiles.face),
    body: readBasis(props.basisFiles.body),
  };
  const admit: NonNullable<IReadHumanViewerCatalogueProps["admission"]> =
    props.admission ??
    ((): IHumanViewerAdmission => ({
      state: "pending",
      reason: "awaiting admission: no viewer page admits documents",
    }));
  // The subject list is re-read and re-keyed only when it, the face basis or
  // the face source changed: an admission verdict republishes the catalogue.
  const subjectsStat: fs.Stats = fs.statSync(props.documentsFile);
  const reference: ReturnType<
    IReadHumanViewerCatalogueProps["exampleSources"]["reference"]
  > = props.exampleSources.reference(bases.face);
  const faceSignature: string = `${subjectsStat.mtimeMs}:${subjectsStat.size}|${bases.face.digest}|${sources.face}|${JSON.stringify(reference)}`;
  const faces: ReturnType<typeof readHumanViewerFaceDocuments> =
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
  const generation: ReturnType<
    NonNullable<IReadHumanViewerCatalogueProps["generation"]>
  > | null =
    props.independentInput === true
      ? null
      : (
          props.generation ??
          ((): IHumanViewerRejectedInput => ({
            file: "published person generation",
            pending: false,
            reason: "person generation files are not published yet",
          }))
        )();
  // Subject people come from the source owner's generation subject file when
  // it exists (drawn on the one-skin generation); otherwise from the legacy
  // published face and body pair.
  const generationSubjects: ReturnType<
    typeof readHumanViewerGenerationSubjects
  > | null =
    generation === null ||
    "reason" in generation ||
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
  const subjectPeople: IHumanViewerCatalogueEntry[] =
    generationSubjects === null
      ? props.exampleSources.subjectPeople({
          subjects: faces.subjects,
          bases,
          sources,
        })
      : [];
  const authored: ReturnType<typeof admitHumanViewerAuthoredEntries> =
    generation === null || "reason" in generation
      ? { documents: [], rejected: generation === null ? [] : [generation] }
      : admitHumanViewerAuthoredEntries(
          [
            ...readHumanViewerStandardBodies({
              generation,
              sources,
              examples: props.bodyExamples,
            }),
            ...props.exampleSources.standardPeople({
              reference: faces.reference,
              generation,
              sources,
              examples: props.bodyExamples,
            }),
            ...(generationSubjects?.documents ?? []),
          ].filter(
            (entry: IHumanViewerCatalogueEntry): boolean =>
              props.selectedDoc === undefined || entry.id === props.selectedDoc,
          ),
          admit,
        );
  if (generationSubjects !== null)
    authored.rejected.push(...generationSubjects.rejected);
  const inputs: ReturnType<typeof readHumanViewerInputs> =
    props.inputsDirectory !== undefined && fs.existsSync(props.inputsDirectory)
      ? readHumanViewerInputs({
          selectedDoc: props.selectedDoc,
          io: {
            names: (): string[] => fs.readdirSync(props.inputsDirectory!),
            read: (name: string): Buffer =>
              fs.readFileSync(path.join(props.inputsDirectory!, name)),
            stamp: (name: string): string => {
              const stat: fs.Stats = fs.statSync(
                path.join(props.inputsDirectory!, name),
              );
              return `${stat.mtimeMs}:${stat.size}`;
            },
          },
          memo: props.inputsMemo,
          bases,
          generation:
            generation === null || "reason" in generation ? null : generation,
          sources,
          sidecar: props.sidecar ?? ((): null => null),
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
    ].filter(
      (entry: IHumanViewerCatalogueEntry): boolean =>
        props.selectedDoc === undefined || entry.id === props.selectedDoc,
    ),
  };
}
