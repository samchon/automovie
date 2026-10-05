import {
  type IAutoMovieHumanPersonHeadView,
  HUMAN_PERSON_SEAM,
  parseHumanBodyBasisDocument,
  serializeHumanPersonDocument,
} from "@automovie/human";

import { createConnectedBodyDefaultFace } from "./createConnectedBodyDefaultFace";

/**
 * The person the body editor's head is drawn from: the edited body document
 * with the head view's default face, linked population. A person states its
 * skin colour once, on the face; the body editor's document carries its own
 * cheek albedo, so that cheek moves onto the face's skin material and the
 * head is drawn in the colour the body wears.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Draws the companion head with the edited body document so the whole figure is judged together.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps the companion head display-only while it wears the cheek colour the body document carries.
 * @author Samchon
 */
export function createConnectedBodyHeadPerson(head: IAutoMovieHumanPersonHeadView, document: string): string {
  const { skinColour, ...body } = parseHumanBodyBasisDocument(document);
  return serializeHumanPersonDocument({
    id: "body-editor-person",
    name: "body editor person",
    face: {
      ...createConnectedBodyDefaultFace(head),
      ...(skinColour === undefined ? {} : { materials: { [HUMAN_PERSON_SEAM.skinMaterial]: { color: skinColour.cheek } } }),
    },
    body,
    population: "linked",
  });
}
