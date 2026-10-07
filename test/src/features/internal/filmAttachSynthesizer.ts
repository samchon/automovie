import type { IAutoMovieActionSynthesizer } from "@automovie/engine";

import { validSynthesizer } from "./filmFixtures";

/** Preserve object-only launch/attach synthesis in the existing attach scenario. */
export const filmAttachSynthesizer: IAutoMovieActionSynthesizer = (action, actor) =>
  action.verb === "launch" || action.verb === "attachTo"
    ? null
    : validSynthesizer(action, actor);
