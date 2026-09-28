import type { IAutoMovieCompiledShotSource } from "@automovie/interface";

/**
 * One resident engine result for compiled source-attribution logic cases.
 *
 * No source module or project is executed. The attribution owner must preserve
 * this typed materialized payload while composing its resolved graph identities.
 */
export const materializedShotAttributionInput =
  (): IAutoMovieCompiledShotSource => ({
    eventSamples: [{ id: "door-opens", time: 0.5 }],
    scene: {
      id: "entry-scene",
      name: null,
      nodes: [],
      cameras: [],
      lights: [],
    },
    motions: [],
    models: [],
    formations: [],
    instanceSets: [],
    formationMotions: [],
    formationSlotMotions: [],
    effects: [],
    shot: {
      id: "entry-shot",
      name: null,
      scene: "entry-scene",
      camera: "entry-camera",
      cameraMotion: null,
      performances: [],
      objectMotions: [],
      duration: 1,
    },
  });
