import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieHumanCanonicalBody } from "@automovie/interface";

import type { IMotionHumanPerson } from "../internal/people/IMotionHumanPerson";
import { MOTION_HUMAN_PEOPLE } from "../internal/people/MOTION_HUMAN_PEOPLE";

/**
 * Prepare the surveyed average actor shared by the compiled examples and
 * capture. The Human package supplies both the canonical rig and the polygon
 * geometry basis.
 */
export function environmentExampleBody(): IAutoMovieHumanCanonicalBody.IBody {
  const person: IMotionHumanPerson = MOTION_HUMAN_PEOPLE["m-average"];
  return AutoMovieHumanCanonicalBody.prepare(person.params, {
    id: "m-average",
    mass: person.mass,
  });
}
