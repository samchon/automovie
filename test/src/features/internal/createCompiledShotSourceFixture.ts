import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";

/**
 * A compiled shot of an empty scene: no node, camera, light, model or motion,
 * one shot of the id `shot:fixture`, and the given environment or none.
 */
export function createCompiledShotSourceFixture(
  environment: IAutoMovieSceneEnvironment | null = null,
): IAutoMovieCompiledShotSource {
  return {
    eventSamples: [],
    scene: {
      id: "scene",
      name: null,
      nodes: [],
      cameras: [],
      lights: [],
      environment,
    },
    motions: [],
    shot: {
      id: "shot:fixture",
      name: null,
      scene: "scene",
      camera: "cam",
      cameraMotion: null,
      performances: [],
      objectMotions: [],
      duration: 1,
    },
    models: [],
    formations: [],
    instanceSets: [],
    formationMotions: [],
    formationSlotMotions: [],
    effects: [],
  };
}