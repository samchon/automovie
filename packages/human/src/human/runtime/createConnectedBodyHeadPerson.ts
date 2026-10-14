import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { parseHumanBodyBasisDocument } from "../../body/document/parseHumanBodyBasisDocument";
import type { IAutoMovieHumanPersonHeadView } from "../../index";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import { serializeHumanPersonDocument } from "../document/serializeHumanPersonDocument";
import { createConnectedBodyDefaultFace } from "./createConnectedBodyDefaultFace";

/**
 * Parse the edited body text with its actual optional source authority, remove its cheek-colour field and transfer that colour to the default face's existing skin material override. Serialize one linked person document against the same source. Linked legacy population and registered alias/driver conversion remain separate evaluator branches. This document composition observes no displayed head or clinical/optical equivalence.
 *
 * @evidence contracts/common.md#principled-implementation Actual admitted body shape and cheek albedo become one person record with face-owned colour and the supplied head basis identity.
 * @evidence contracts/common.md#clear-and-simple-design Existing body parsing, neutral face construction and person serialization own their schemas/defaults; this adapter owns editor-to-person field placement only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original body colour is removed before person admission rather than silently retaining two authorities; linked intent is not claimed automatic under registered driver branching or observed rendering.
 * @evidence contracts/common.md#meaningful-documentation Prose states source authority, linear cheek transfer, branch boundary and serialized-document scope.
 * @evidence contracts/performance.md#efficient-algorithms Body parsing and person admission/formatting pay actual text/document size, while fixed wrappers and optional cheek override add no geometry or texture pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied edited text is admitted and composed anew; this adapter owns no source/evaluated-person cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed/wrapper records are call-local and only the owned person JSON escapes; no loaded head geometry, source task or worker is retained here.
 *
 * @author Samchon
 */
export function createConnectedBodyHeadPerson(
  head: IAutoMovieHumanPersonHeadView,
  document: string,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): string {
  const {
    skinColour,
    ...body
  }: ReturnType<typeof parseHumanBodyBasisDocument> =
    parseHumanBodyBasisDocument(document, source);
  return serializeHumanPersonDocument(
    {
      id: "body-editor-person",
      name: "body editor person",
      face: {
        ...createConnectedBodyDefaultFace(head),
        ...(skinColour === undefined
          ? {}
          : {
              materials: {
                [HUMAN_PERSON_SEAM.skinMaterial]: { color: skinColour.cheek },
              },
            }),
      },
      body,
      population: "linked",
    },
    source,
  );
}
