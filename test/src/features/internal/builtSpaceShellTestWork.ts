import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { BUILT_SPACE_SHELL_TEST_HALL as HALL } from "./BUILT_SPACE_SHELL_TEST_HALL";
import { createModel } from "./fixtures";

/** Create the existing scenario environment with fresh mutable records.
 *
 * Supply the existing gallery with an unlocated root and an overridable hall shell. Constructing or locating this fixture alone is not a product behavior proof; its consumers own assertions.
 * The literal identity placement and authored hall shell establish the input geometry; createModel supplies the original ordinary model record without generating expected containment results.
 * Consumers override shell/cells to distinguish either spelling, absent volume and malformed meshes. Each call creates mutable top-level records while retaining the module-owned hall shell reference.
 */
export const builtSpaceShellTestWork: (
  space: Partial<IAutoMovieBuiltSpace>,
) => IAutoMovieBuiltEnvironment = (
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
