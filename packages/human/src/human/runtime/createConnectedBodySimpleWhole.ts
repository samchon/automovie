import type {
  IAutoMovieHumanBodySimpleWhole,
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "../../index";
import { compileHumanPersonGeneration } from "../build/compileHumanPersonGeneration";
import { joinHumanPersonGeneration } from "../build/joinHumanPersonGeneration";
import { createHumanPersonSimpleWhole } from "../measure/createHumanPersonSimpleWhole";

import { createConnectedBodyDefaultFace } from "./createConnectedBodyDefaultFace";

/**
 * The whole-person stature and volume readers the body editor's simple tier
 * and humeral-head estimate use: the published generation's head and body
 * views joined and compiled once, read as a linked person with the editor's
 * default face. The caller supplies the same loaded body view its evaluator
 * uses; this factory performs no second asset read. Joining the views refuses
 * mixed generations before compiling a whole-person reader. The readers
 * replace the body shape with each trial shape and
 * keep this face, so stature and mass belong to the head the page shows.
 *
 * @author Samchon
 */
export function createConnectedBodySimpleWhole(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
): IAutoMovieHumanBodySimpleWhole {
  return createHumanPersonSimpleWhole(
    compileHumanPersonGeneration(joinHumanPersonGeneration(head, body)),
    {
      id: "body-editor-person",
      name: "body editor person",
      population: "linked",
      face: createConnectedBodyDefaultFace(head),
      body: {
        id: "body-editor-body",
        name: "body editor body",
        basis: body.body.id,
        shape: {},
      },
    },
  );
}
