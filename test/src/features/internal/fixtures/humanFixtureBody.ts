import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { createHumanBody } from "@automovie/motions";

import type { IHumanFixture } from "./IHumanFixture";
import { humanFixture } from "./humanFixture";

/**
 * The motions package's body of a stored person, built from the stored rig and
 * profile by `createHumanBody`, without preparing a Human figure.
 *
 * Use it only for a function whose input is the whole body record, which holds
 * closures and maps and so cannot be stored. A function that reads the rig, the
 * profile, the measure or the surfaces takes them from `humanFixture` instead.
 * The body is built on every call, which solves its quiet stance (150 to 350
 * ms), and kept by no one: there is no cache, so tests never share a body.
 *
 * @param name The stored person.
 * @returns A new body.
 */
export async function humanFixtureBody(
  name: humanFixture.Name,
): Promise<IAutoMovieMotionHumanBody> {
  const stored: IHumanFixture = await humanFixture(name);
  return createHumanBody(stored.skeleton, stored.profile);
}
