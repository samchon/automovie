import {
  type IAutoMovieHumanPersonHeadView,
  HUMAN_PERSON_SEAM,
  parseHumanBodyBasisDocument,
  serializeHumanPersonDocument,
} from "@automovie/human";

/**
 * The person the body editor's head is drawn from: the edited body document
 * with the head view's default face, linked population. A person states its
 * skin colour once, on the face; the body editor's document carries its own
 * cheek albedo, so that cheek moves onto the face's skin material and the
 * head is drawn in the colour the body wears.
 *
 * @author Samchon
 */
export function createConnectedBodyHeadPerson(head: IAutoMovieHumanPersonHeadView, document: string): string {
  const { skinColour, ...body } = parseHumanBodyBasisDocument(document);
  return serializeHumanPersonDocument({
    id: "body-editor-person",
    name: "body editor person",
    face: {
      id: "body-editor-face",
      name: "default face",
      basis: head.face.id,
      shape: {},
      expression: {},
      ...(skinColour === undefined ? {} : { materials: { [HUMAN_PERSON_SEAM.skinMaterial]: { color: skinColour.cheek } } }),
    },
    body,
    population: "linked",
  });
}
