import {
  AUTOMOVIE_ARKIT_CHANNELS,
  AUTOMOVIE_EXPRESSION_PRESETS,
} from "@automovie/engine";
import type {
  IAutoMovieExpression,
  IAutoMovieHumanVisemeWeights,
} from "@automovie/interface";
import * as THREE from "three";

import { AUTOMOVIE_EXPRESSION_PRESET_CHANNELS } from "./AUTOMOVIE_EXPRESSION_PRESET_CHANNELS.js";
import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";
import { autoMovieVisemeChannelWeights } from "./autoMovieVisemeChannelWeights.js";
import { invalidateAutoMovieSkinnedPose } from "./invalidateAutoMovieSkinnedPose.js";

// One list with engine admission, which refuses a pose-driven morph target
// under any of these names because this reset would overwrite it.
const EXPRESSION_RESET_NAMES: readonly string[] = [
  ...AUTOMOVIE_EXPRESSION_PRESETS,
  ...AUTOMOVIE_ARKIT_CHANNELS,
];

/*
 * Apply a sampled automovie expression to a viewer model.
 *
 * VRM-style expression targets receive preset and ARKit names directly.
 * Imported meshes with `morphTargetDictionary` receive exact or
 * case-insensitive matching names; generated primitive models simply no-op.
 * Skinned meshes then start a new pose revision, because morphs precede
 * skinning and move their bounds.
 *
 * Optional dialogue viseme weights layer over the authored expression: each
 * MPEG-4 viseme maps onto one of the five mouth presets, and the presets' ARKit
 * channels are summed by weight, so `{ aa: 0.5, O: 0.5 }` opens `jawOpen` to
 * 0.5 × 1 + 0.5 × 0.6 = 0.8. The mouth layer's channels replace the authored
 * values of the same channels.
 */
export const applyExpression: (
  target: IAutoMovieModelObject,
  expression: IAutoMovieExpression | null,
  visemes?: IAutoMovieHumanVisemeWeights,
) => void = (
  target: IAutoMovieModelObject,
  expression: IAutoMovieExpression | null,
  visemes?: IAutoMovieHumanVisemeWeights,
): void => {
  const weights: Map<string, number> = expressionWeights(expression);
  if (visemes !== undefined) layerVisemes(weights, visemes);
  applyMorphTargets(target.object, weights);

  // Morphs precede skinning, so a skinned mesh's bounds follow the new weights.
  invalidateAutoMovieSkinnedPose(target.object);
  for (const sink of target.expressionTargets ?? []) {
    for (const name of EXPRESSION_RESET_NAMES) sink.setExpressionValue(name, 0);
    for (const [name, weight] of weights) sink.setExpressionValue(name, weight);
  }
};

/*
 * Layer viseme weights over an expression's channels: the mouth layer's sums
 * replace the authored values of every channel it sets.
 */
const layerVisemes: (
  weights: Map<string, number>,
  visemes: IAutoMovieHumanVisemeWeights,
) => void = (
  weights: Map<string, number>,
  visemes: IAutoMovieHumanVisemeWeights,
): void => {
  for (const [name, weight] of autoMovieVisemeChannelWeights(visemes))
    weights.set(name, clamp01(weight));
};

/*
 * Convert a semantic expression into direct channel weights.
 */
const expressionWeights: (
  expression: IAutoMovieExpression | null,
) => Map<string, number> = (
  expression: IAutoMovieExpression | null,
): Map<string, number> => {
  const weights: Map<string, number> = new Map<string, number>();
  if (expression === null) return weights;

  const intensity: number = clamp01(expression.intensity);
  if (expression.preset !== "neutral") {
    setMax(weights, expression.preset, intensity);
    for (const [channel, factor] of AUTOMOVIE_EXPRESSION_PRESET_CHANNELS[
      expression.preset
    ] ?? [])
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
    if (!AutoMovieThreeKind.isMesh(object)) return;
    const mesh: THREE.Mesh = object;
    if (
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
  Math.max(0, Math.min(1, value));
