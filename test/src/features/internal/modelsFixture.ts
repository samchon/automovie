import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

import { boxModel } from "./boxModel";
import { material } from "./material";

/**
 * Five one-box numerical models resolving the tower, prop and window references.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing material-resolution, semantic and inventory units consume these model records and assert actual resolution/costs rather than comparing fixture source or file arrangement.
 * @evidence contracts/testing.md#independent-expectations Wall and slab use stone with textures/stone.png; door, prop and window use untextured oak. All five have one unit-box part, fixing the independently countable geometry and material populations.
 * @evidence contracts/testing.md#distinguishing-cases Each call creates two new material records and five models; stone and oak are shared across their respective models within that call. There is no texture decode or model admission in this helper.
 * @evidence contracts/testing.md#execution-ownership Numerical fixture construction feeding existing discovered tests without a file, renderer, process, worker or dynamic case host.
 */
export const modelsFixture: () => IAutoMovieModel[] = (): IAutoMovieModel[] => {
  const stone: IAutoMovieMaterial = material("stone", "textures/stone.png");
  const oak: IAutoMovieMaterial = material("oak");
  return [
    boxModel({ id: "wall-model", materials: [stone] }),
    boxModel({ id: "door-model", materials: [oak] }),
    boxModel({ id: "slab-model", materials: [stone] }),
    boxModel({ id: "prop-model", materials: [oak] }),
    boxModel({ id: "window-model", materials: [oak] }),
  ];
};
