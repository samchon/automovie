import type { IAutoMovieCompiledShotSource } from "@automovie/interface";

import { modelsFixture, sceneFixture } from "./renderFixtures";

/**
 * Preserve the existing preflight input projection and override order. The empty shot and cast supply only fields consumed by these portable cases; this record has not passed complete compiled-shot admission and represents neither an executed capture nor a native renderer observation.
 */
export function compiledShotFixture(
  overrides: Partial<IAutoMovieCompiledShotSource> = {},
): IAutoMovieCompiledShotSource {
  return ({
    eventSamples: [],
    scene: sceneFixture(),
    motions: [],
    models: modelsFixture(),
    formations: [],
    instanceSets: [],
    formationMotions: [],
    formationSlotMotions: [],
    effects: [],
    shot: {},
    ...overrides,
  }) as unknown as IAutoMovieCompiledShotSource;
}
