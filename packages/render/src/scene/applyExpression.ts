import {
  AUTOMOVIE_ARKIT_CHANNELS,
  AUTOMOVIE_EXPRESSION_PRESETS,
  GAZE_PRESET_CHANNELS,
} from "@automovie/engine";
import {
  AutoMovieArkitChannel,
  AutoMovieExpressionPreset,
  IAutoMovieExpression,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import { invalidateAutoMovieSkinnedPose } from "./invalidateAutoMovieSkinnedPose.js";

// One list with engine admission, which refuses a pose-driven morph target
// under any of these names because this reset would overwrite it.
const EXPRESSION_RESET_NAMES: readonly string[] = [
  ...AUTOMOVIE_EXPRESSION_PRESETS,
  ...AUTOMOVIE_ARKIT_CHANNELS,
];

const PRESET_CHANNELS: Partial<
  Record<
    AutoMovieExpressionPreset,
    readonly (readonly [AutoMovieArkitChannel, number])[]
  >
> = {
  happy: [
    ["mouthSmileLeft", 1],
    ["mouthSmileRight", 1],
    ["cheekSquintLeft", 0.35],
    ["cheekSquintRight", 0.35],
  ],
  angry: [
    ["browDownLeft", 1],
    ["browDownRight", 1],
    ["eyeSquintLeft", 0.35],
    ["eyeSquintRight", 0.35],
  ],
  sad: [
    ["mouthFrownLeft", 0.75],
    ["mouthFrownRight", 0.75],
    ["browInnerUp", 0.45],
  ],
  relaxed: [
    ["eyeSquintLeft", 0.25],
    ["eyeSquintRight", 0.25],
    ["mouthSmileLeft", 0.2],
    ["mouthSmileRight", 0.2],
  ],
  surprised: [
    ["browInnerUp", 1],
    ["eyeWideLeft", 0.8],
    ["eyeWideRight", 0.8],
    ["jawOpen", 0.75],
  ],
  aa: [["jawOpen", 1]],
  ih: [
    ["jawOpen", 0.35],
    ["mouthSmileLeft", 0.45],
    ["mouthSmileRight", 0.45],
  ],
  ou: [
    ["mouthFunnel", 0.8],
    ["mouthPucker", 0.55],
  ],
  ee: [
    ["mouthSmileLeft", 0.75],
    ["mouthSmileRight", 0.75],
  ],
  oh: [
    ["jawOpen", 0.6],
    ["mouthFunnel", 0.75],
  ],
  blink: [
    ["eyeBlinkLeft", 1],
    ["eyeBlinkRight", 1],
  ],
  blinkLeft: [["eyeBlinkLeft", 1]],
  blinkRight: [["eyeBlinkRight", 1]],
  // The gaze rows are shared with the engine's eye-bone gaze.
  ...GAZE_PRESET_CHANNELS,
};

/**
 * Apply a sampled automovie expression to a viewer model.
 *
 * VRM-style expression targets receive preset and ARKit names directly.
 * Imported meshes with `morphTargetDictionary` receive exact or
 * case-insensitive matching names; generated primitive models simply no-op.
 * Skinned meshes then start a new pose revision, because morphs precede
 * skinning and move their bounds.
 */
export const applyExpression: (
  target: IAutoMovieModelObject,
  expression: IAutoMovieExpression | null,
) => void = (
  target: IAutoMovieModelObject,
  expression: IAutoMovieExpression | null,
): void => {
  const weights: ReadonlyMap<string, number> = expressionWeights(expression);
  applyMorphTargets(target.object, weights);

  // Morphs precede skinning, so a skinned mesh's bounds follow the new weights.
  invalidateAutoMovieSkinnedPose(target.object);
  for (const sink of target.expressionTargets ?? []) {
    for (const name of EXPRESSION_RESET_NAMES) sink.setExpressionValue(name, 0);
    for (const [name, weight] of weights) sink.setExpressionValue(name, weight);
  }
};

/** Convert a semantic expression into direct channel weights. */
const expressionWeights: (
  expression: IAutoMovieExpression | null,
) => ReadonlyMap<string, number> = (
  expression: IAutoMovieExpression | null,
): ReadonlyMap<string, number> => {
  const weights: Map<string, number> = new Map<string, number>();
  if (expression === null) return weights;

  const intensity: number = clamp01(expression.intensity);
  if (expression.preset !== "neutral") {
    setMax(weights, expression.preset, intensity);
    for (const [channel, factor] of PRESET_CHANNELS[expression.preset] ?? [])
      setMax(weights, channel, intensity * factor);
  }
  for (const blendshape of expression.blendshapes ?? [])
    weights.set(blendshape.channel, clamp01(blendshape.weight));
  return weights;
};

const applyMorphTargets: (
  root: THREE.Object3D,
  weights: ReadonlyMap<string, number>,
) => void = (
  root: THREE.Object3D,
  weights: ReadonlyMap<string, number>,
): void => {
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    const mesh: THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      | THREE.Material<THREE.MaterialEventMap>
      | THREE.Material<THREE.MaterialEventMap>[],
      THREE.Object3DEventMap
    > = object as THREE.Mesh;
    if (
      mesh.isMesh !== true ||
      mesh.morphTargetDictionary === undefined ||
      mesh.morphTargetInfluences === undefined
    )
      return;

    const dictionary: { [key: string]: number } = mesh.morphTargetDictionary;
    const influences: number[] = mesh.morphTargetInfluences;
    const folded: Map<string, number> = new Map(
      Object.entries(dictionary).map(
        ([name, index]: [string, number]): [string, number] => [
          name.toLowerCase(),
          index,
        ],
      ),
    );
    const setInfluence: (name: string, weight: number) => void = (
      name: string,
      weight: number,
    ): void => {
      const index: number | undefined =
        dictionary[name] ?? folded.get(name.toLowerCase());
      if (index !== undefined && index < influences.length)
        influences[index] = weight;
    };

    for (const name of EXPRESSION_RESET_NAMES) setInfluence(name, 0);
    for (const [name, weight] of weights) setInfluence(name, weight);
  });
};

const setMax: (
  weights: Map<string, number>,
  name: string,
  weight: number,
) => void = (
  weights: Map<string, number>,
  name: string,
  weight: number,
): void => {
  weights.set(name, Math.max(weights.get(name) ?? 0, clamp01(weight)));
};

const clamp01: (value: number) => number = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
