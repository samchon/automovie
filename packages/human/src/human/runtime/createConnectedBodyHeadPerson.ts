import type { IAutoMovieHumanPersonHeadView } from "../../index";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { parseHumanBodyBasisDocument } from "../../body/document/parseHumanBodyBasisDocument";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import { serializeHumanPersonDocument } from "../document/serializeHumanPersonDocument";

import { createConnectedBodyDefaultFace } from "./createConnectedBodyDefaultFace";

/**
 * The person the body editor's head is drawn from: the edited body document
 * with the head view's default face, linked population. A person states its
 * skin colour once, on the face; the body editor's document carries its own
 * cheek albedo, so that cheek moves onto the face's skin material and the
 * head is drawn in the colour the body wears.
 *
 * @author Samchon
 */
export function createConnectedBodyHeadPerson(
  head: IAutoMovieHumanPersonHeadView,
  document: string,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): string {
  const { skinColour, ...body } = parseHumanBodyBasisDocument(document, source);
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
