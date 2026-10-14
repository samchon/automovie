import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerGenerationSubjectsFile } from "./IHumanViewerGenerationSubjectsFile.js";
import type { IHumanViewerInputs } from "./IHumanViewerInputs.js";
import type { IReadHumanViewerGenerationSubjectsProps } from "./IReadHumanViewerGenerationSubjectsProps.js";
import { humanViewerPersonKey } from "./humanViewerPersonKey.js";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis.js";
import { readHumanViewerPersonBases } from "./readHumanViewerPersonBases.js";
import type { IHumanViewerPersonBases } from "./IHumanViewerPersonBases.js";

/**
 * The published subjects as whole people on the one-skin generation, `person:<subject>`, from the source owner's subject people file. Each person must name both of the published generation's view bases; one that names others (the file belongs to a generation not yet or no longer tracked) is refused by name with both identities, never drawn on another generation. Entries take the standard people's token and key, so they follow the view files' bytes. They are returned for admission like the other documents the viewer serves.
 *
 * @evidence contracts/common.md#principled-implementation Parsed subject entries must carry person ids and exact published face/body basis names before receiving the paired generation token and canonical numerical key.
 * @evidence contracts/common.md#clear-and-simple-design One result accumulator distinguishes file parsing refusal, per-person identity refusal and admitted catalogue candidates without constructing Person geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null/primitive people and malformed basis members become named rejected inputs instead of throwing away the whole catalogue; full Person schema admission remains downstream.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies published view authority, per-person refusal and actual source-key/token reuse before later owner admission.
 * @evidence contracts/performance.md#efficient-algorithms One person traversal reads fixed identity/basis fields and hashes each accepted document through the canonical numerical key owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Subject candidates share the same paired token/key authority as standard people rather than another generation or legacy basis fallback.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result arrays retain accepted document references and refusal strings proportional to the supplied people list; no numerical realm, geometry or background build is acquired here.
 */
export function readHumanViewerGenerationSubjects(
  props: IReadHumanViewerGenerationSubjectsProps,
): IHumanViewerInputs {
  const result: IHumanViewerInputs = { documents: [], rejected: [] };
  let parsed: IHumanViewerGenerationSubjectsFile;
  try {
    parsed = JSON.parse(props.text) as IHumanViewerGenerationSubjectsFile;
    if (!Array.isArray(parsed.people)) throw new Error("it has no people list");
  } catch (error) {
    result.rejected.push({
      file: props.file,
      pending: false,
      reason:
        "the subject people file cannot be read: " +
        (error instanceof Error ? error.message : String(error)),
    });
    return result;
  }
  const { generation }: Pick<IReadHumanViewerGenerationSubjectsProps, "generation"> = props;
  for (const document of parsed.people) {
    const id: unknown = typeof document === "object" && document !== null && "id" in document ? document.id : undefined;
    if (typeof id !== "string" || !id.startsWith("person:")) {
      result.rejected.push({
        file: props.file,
        pending: false,
        reason: "a subject person needs an id starting with person:",
      });
      continue;
    }
    let bases: IHumanViewerPersonBases;
    try {
      bases = readHumanViewerPersonBases(document as object);
    } catch (error) {
      result.rejected.push({
        file: props.file,
        id,
        pending: false,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (bases.face !== generation.face || bases.body !== generation.body) {
      result.rejected.push({
        file: props.file,
        id,
        pending: false,
        reason:
          `${id} names face ${bases.face} and body ${bases.body}, but the published generation is face ` +
          `${generation.face} and body ${generation.body} (subjects.json generation ${parsed.generation})`,
      });
      continue;
    }
    const entry: IHumanViewerCatalogueEntry = {
      id,
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
    };
    result.documents.push(entry);
  }
  return result;
}
