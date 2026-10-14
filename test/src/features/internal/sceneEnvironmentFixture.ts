import type { IAutoMovieSceneEnvironment } from "@automovie/interface";

/** Return the existing authored scene policy with shallow overrides applied last. */
export function sceneEnvironmentFixture(
  overrides: Partial<IAutoMovieSceneEnvironment> = {},
): IAutoMovieSceneEnvironment {
  return {
    image: null,
    background: { r: 0, g: 0, b: 0, a: 1, hex: null },
    intensity: 1,
    rotationDeg: 0,
    exposure: 1.5,
    toneMapping: "acesFilmic",
    shadows: { enabled: true, type: "pcfSoft" },
    ...overrides,
  };
}
