import type {
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonHeadView,
} from "../../index";

/**
 * The face the body editor's person is drawn with: the head view's default
 * face, neutral shape and expression. The head shown on the neck and the
 * whole-person readers of the simple tier both use this one document, so the
 * stature and volume the simple tier reads belong to the head the page shows.
 *
 * @author Samchon
 */
export function createConnectedBodyDefaultFace(
  head: IAutoMovieHumanPersonHeadView,
): IAutoMovieHumanFaceBasisDocument {
  return {
    id: "body-editor-face",
    name: "default face",
    basis: head.face.id,
    shape: {},
    expression: {},
  };
}
