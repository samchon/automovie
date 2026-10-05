import {
  type IAutoMovieHumanBodySimpleWhole,
  compileHumanPersonGeneration,
  createHumanPersonSimpleWhole,
  joinHumanPersonGeneration,
} from "@automovie/human";

import { createConnectedBodyDefaultFace } from "./createConnectedBodyDefaultFace";
import { readConnectedBodyView } from "./readConnectedBodyView";
import { readConnectedHeadView } from "./readConnectedHeadView";

/**
 * The whole-person stature and volume readers the body editor's simple tier
 * and humeral-head estimate use: the published generation's head and body
 * views joined and compiled once, read as a linked person with the editor's
 * default face. The readers replace the body shape with each trial shape and
 * keep this face, so stature and mass belong to the head the page shows.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Supplies the whole-person stature and volume the requested height and weight are solved against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Compiles the published head and body views once and replaces only the body shape per trial.
 * @author Samchon
 */
export async function createConnectedBodySimpleWhole(): Promise<IAutoMovieHumanBodySimpleWhole> {
  const [head, body] = await Promise.all([readConnectedHeadView(), readConnectedBodyView()]);
  return createHumanPersonSimpleWhole(compileHumanPersonGeneration(joinHumanPersonGeneration(head, body)), {
    id: "body-editor-person",
    name: "body editor person",
    population: "linked",
    face: createConnectedBodyDefaultFace(head),
    body: { id: "body-editor-body", name: "body editor body", basis: body.body.id, shape: {} },
  });
}
