import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { BUILT_SPACE_SHELL_TEST_HALL as HALL } from "./BUILT_SPACE_SHELL_TEST_HALL";
import { createModel } from "./fixtures";

/** Create the existing scenario environment with fresh mutable records. */
export const builtSpaceShellTestWork = (
  space: Partial<IAutoMovieBuiltSpace>,
): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "gallery",
  units: "meter",
  buildings: [{ id: "block", element: "root", space: "whole" }],
  models: [{ ...createModel(null), id: "stone" }],
  modelReferences: [],
  elements: [
    {
      id: "root",
      kind: "building",
      parent: null,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      model: "stone",
      space: "whole",
    },
  ],
  spaces: [
    { id: "whole", kind: "building", parent: null, cells: [] },
    {
      id: "hall",
      kind: "room",
      parent: "whole",
      cells: [],
      shell: HALL,
      ...space,
    },
  ],
  boundaries: [],
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});
