import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerGenerationSubjectsFile } from "./IHumanViewerGenerationSubjectsFile.js";
import type { IHumanViewerInputs } from "./IHumanViewerInputs.js";
import type { IReadHumanViewerGenerationSubjectsProps } from "./IReadHumanViewerGenerationSubjectsProps.js";
import { humanViewerPersonKey } from "./humanViewerPersonKey.js";
import { humanViewerPublishedGenerationBasis } from "./humanViewerPublishedGenerationBasis.js";
import { readHumanViewerPersonBases } from "./readHumanViewerPersonBases.js";

/**
 * The published subjects as whole people on the one-skin generation,
 * `person:<subject>`, from the source owner's subject people file. Each
 * person must name both of the published generation's view bases; one that
 * names others (the file belongs to a generation not yet or no longer
 * tracked) is refused by name with both identities, never drawn on another
 * generation. Entries take the standard people's token and key, so they
 * follow the view files' bytes. They are returned for admission like the
 * other documents the viewer serves.
 *
 * @evidence contracts/common.md#principled-implementation A subject is drawn only on the generation its document names, checked against the views actually published.
 * @evidence contracts/common.md#clear-and-simple-design The source owner converts subjects; the viewer only checks and keys them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects mismatched declared head/body bases and preserves original documents instead of fitting them onto another generation or bypassing later admission.
 * @evidence contracts/common.md#meaningful-documentation States the generation check, the refusal and the key.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis A subject is drawn only on the generation its document names, checked against the views actually published.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis The source owner converts subjects; the viewer only checks and keys them.
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
  const { generation } = props;
  for (const document of parsed.people) {
    const id = (document as IHumanViewerGenerationIdentity).id;
    if (typeof id !== "string" || !id.startsWith("person:")) {
      result.rejected.push({
        file: props.file,
        pending: false,
        reason: "a subject person needs an id starting with person:",
      });
      continue;
    }
    const bases = readHumanViewerPersonBases(document as object);
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

/**
 * Named local transport for readHumanViewerGenerationSubjects; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerGenerationIdentity {
  id?: unknown;
}
