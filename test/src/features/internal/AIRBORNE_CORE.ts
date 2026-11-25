import type { IAutoMovieResolveCenterOfMass } from "@automovie/interface";

import { AIRBORNE_CORE_END_MASS } from "./AIRBORNE_CORE_END_MASS";
import { airbornePrimitive } from "./airbornePrimitive";

/**
 * A three-mass body: a 30 kg core of moments (1.2, 0.4, 1.1) kg m^2 and two 5
 * kg ends of moments 0.02 kg m^2 that ride the head and the left foot, which a
 * test places at a reach above and below the core.
 */
export const AIRBORNE_CORE: IAutoMovieResolveCenterOfMass.IModel =
  airbornePrimitive([
    { bone: "hips", mass: 30, inertia: { x: 1.2, y: 0.4, z: 1.1 } },
    {
      bone: "head",
      mass: AIRBORNE_CORE_END_MASS,
      inertia: { x: 0.02, y: 0.02, z: 0.02 },
    },
    {
      bone: "leftFoot",
      mass: AIRBORNE_CORE_END_MASS,
      inertia: { x: 0.02, y: 0.02, z: 0.02 },
    },
  ]);
