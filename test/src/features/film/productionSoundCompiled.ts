import type { IAutoMovieCompiledShotSource } from "@automovie/interface";

import { materializeCompiledFormation } from "@automovie/engine";
import { materializeCompiledInstanceSet } from "@automovie/engine";
import { productionSoundTransform } from "./productionSoundTransform";

/**
 * The compiled shot those events resolve against.
 *
 * The actor moves from `x = 4` to `x = 6`. The formation cue adds zero through ten metres to its `x = -4` anchor, placing the sampled arrival and reveal on opposite sides of the lens.
 *
 * Behavior: Constructs the original moving actor, formation and instance source consumed by real spatial sound planning; the entries assert pan signs and event-time formation positions.
 * Expectation basis: Literal anchors, track keys and event times supply input geometry independently of the planner; materialization is the actual Engine operation and is not an independent materializer oracle.
 * Cases: Preserves the singleton node/formation/instance records, actor translation and live formation cue, including the event beyond trim; controlled population/spread geometry is owned by its dedicated entries.
 * Execution: The existing owning entries call productionSoundCompiled during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function productionSoundCompiled(): IAutoMovieCompiledShotSource {
  return {
    eventSamples: [
      { id: "contact", time: 0.2 },
      { id: "arrival", time: 0.45 },
      { id: "impact", time: 0.7 },
      { id: "break", time: 0.95 },
      { id: "reveal", time: 1.2 },
      { id: "transition", time: 1.45 },
      { id: "trimmed", time: 2.8 },
    ],
    scene: {
      id: "scene",
      name: null,
      nodes: [
        {
          id: "actor",
          model: "actor-model",
          transform: productionSoundTransform(2, 0, -3),
          motion: null,
          pose: null,
        },
      ],
      cameras: [
        {
          id: "camera",
          transform: productionSoundTransform(0, 1, 0),
          fovY: 50,
          near: 0.1,
          far: 100,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
      lights: [],
    },
    motions: [],
    formationMotions: [
      {
        id: "formation-advance",
        formation: "formation",
        action: "advance",
        start: 0,
        end: 2,
        from: {
          translation: { x: 0, y: 0, z: 0 },
          facingOffsetDeg: 0,
          spacingScale: { lateral: 1, depth: 1 },
        },
        to: {
          translation: { x: 10, y: 0, z: 0 },
          facingOffsetDeg: 0,
          spacingScale: { lateral: 1, depth: 1 },
        },
        easing: "linear",
      },
    ],
    formationSlotMotions: [],
    effectCues: [],
    shot: {
      id: "sound-shot",
      name: null,
      scene: "scene",
      duration: 3,
      camera: "camera",
      cameraMotion: null,
      performances: [],
      objectMotions: [
        {
          id: "actor-flight",
          name: null,
          duration: 3,
          loop: false,
          tracks: [
            {
              channel: {
                kind: "node",
                node: "actor",
                path: "translation",
              },
              times: [0, 3],
              values: [4, 0, -3, 6, 0, -3],
              interpolation: "linear",
            },
          ],
        },
      ],
    },
    models: [],
    formations: [
      materializeCompiledFormation({
        formation: {
          id: "formation",
          modelRecipe: "formation-model",
          count: 1,
          layout: {
            kind: "line",
            ranks: 1,
            files: 1,
            spacing: { lateral: 1, depth: 1 },
          },
          anchor: { x: -4, y: 0, z: -6 },
          facingDeg: 0,
          seed: 1,
          capabilities: ["advance"],
          heroOverrides: [],
        },
      }),
    ],
    instanceSets: [
      materializeCompiledInstanceSet({
        instanceSet: {
          id: "instances",
          modelRecipe: "instance-model",
          count: 1,
          layout: {
            kind: "grid",
            rows: 1,
            columns: 1,
            spacing: { x: 1, z: 1 },
          },
          anchor: { x: 0, y: 0, z: -8 },
          facingDeg: 0,
          seed: 1,
          variation: {
            scale: { min: 1, max: 1 },
            palette: ["#ffffff"],
            traits: [],
          },
        },
        world: { routes: [] },
      }),
    ],
    effects: [],
  } satisfies IAutoMovieCompiledShotSource;
}
