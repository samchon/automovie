import {
  type IAutoMovieHumanFaceDocument,
  portraitEarShape,
} from "@automovie/human";

import { humanFaceBindingsFixture } from "./humanFaceBindingsFixture";
import { humanFaceHostPositionsFixture } from "./humanFaceHostPositionsFixture";
import { humanFaceHostTopologyFixture } from "./humanFaceHostTopologyFixture";
import { humanFaceRecipeFixture } from "./humanFaceRecipeFixture";

/**
 * Independent in-memory input for document, state and interpretation scenarios.
 * The four data owners retain the former fixture's exact numerical arrangement;
 * changes to a historical portrait experiment can no longer alter these tests.
 * Each invocation owns its nested data, so negative cases and editor mutations
 * cannot contaminate another scenario. This is a test input, not a likeness or
 * complete-anatomy oracle. Coarse assembly sampling is selected separately below.
 */
export const humanFaceFixture = (
  id = "unit-face",
): IAutoMovieHumanFaceDocument => ({
  version: "human-face/1",
  id,
  name: id,
  basis: {
    id: "unit-observed-basis",
    topology: "mediapipe-478/1",
    host: structuredClone({
      positions: humanFaceHostPositionsFixture,
      indices: humanFaceHostTopologyFixture,
      viewRay: [0.1505110114812851, 0.17655004560947418, 0.9727165699005127],
    }),
    bindings: structuredClone(humanFaceBindingsFixture),
    recipe: structuredClone(humanFaceRecipeFixture),
    expression: {},
  },
});

/** Smallest sampled complete face for assembly scenarios; detailed geometry has its own unit cases. */
export const coarseHumanFaceFixture = (
  id: string,
): IAutoMovieHumanFaceDocument => {
  const document = humanFaceFixture(id);
  document.basis.recipe.eye = {
    ...document.basis.recipe.eye,
    browFibres: 0,
    upperLashes: 1,
    sampling: { eyeColumns: 4, eyeRows: 2, irisColumns: 6, irisRows: 2 },
  };
  delete document.basis.recipe.eye.lowerLidProfile;
  delete document.basis.recipe.eye.aegyoSal;
  delete document.basis.recipe.eye.skinAttachment;
  document.basis.recipe.mouth.crowns = [];
  document.basis.recipe.ear = {
    ...portraitEarShape,
    sampling: { columns: 12, frontRows: 8, backRows: 6 },
  };
  document.basis.expression = { lipPart: 10 };
  return document;
};
