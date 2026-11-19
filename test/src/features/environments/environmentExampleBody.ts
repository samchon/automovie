import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanParameters,
} from "@automovie/interface";

import PEOPLE from "../internal/MOTION_HUMAN_PEOPLE.json";

/**
 * Prepare the surveyed average actor shared by the compiled examples and capture.
 * The Human package supplies both the canonical rig and the polygon geometry basis.
 */
export function environmentExampleBody(): IAutoMovieHumanCanonicalBody.IBody {
  const person: (typeof PEOPLE)["m-average"] = PEOPLE["m-average"];
  return AutoMovieHumanCanonicalBody.prepare(
    person.params as IAutoMovieHumanParameters,
    { id: "m-average", mass: person.mass },
  );
}
