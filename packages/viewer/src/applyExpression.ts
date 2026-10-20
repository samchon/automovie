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
 *
 * @evidence contracts/common.md#principled-implementation Expands semantic presets through the viewer's declared ARKit factor table, whose gaze rows are the engine's `GAZE_PRESET_CHANNELS` so morph and eye-bone gaze expand alike, clamps finite weights to [0,1] with nonfinite inputs treated as zero, lets explicit blendshapes override expanded channels and resolves morph names exact-first then case-insensitively; factors are illustrative expression mappings, not measured anatomical equivalence, and case-fold collisions depend on dictionary insertion order.
 * @evidence contracts/common.md#clear-and-simple-design One channel-weight map feeds native morph influences and optional VRM-style sinks; private helpers own preset expansion, supported-channel reset and name lookup without modifying engine pose or model topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preset factors are explicit supported visual conventions rather than fixture-specific expected weights; no target method/global is replaced, and unsupported names remain untouched instead of inventing morph targets.
 * @evidence contracts/common.md#meaningful-documentation Documents sink/native-name paths and generated-model no-op; the implementation answer makes clamping, preset factor status, explicit override and folded-name collision limits explicit.
 * @evidence contracts/performance.md#efficient-algorithms Builds W requested weights, traverses O objects and builds a folded D-entry dictionary for each morph mesh before supported-name resets/writes; time is O(W+objects+sum(dictionary entries and supported/requested channel writes)), temporary space is one weight map plus each active dictionary map.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares preset/channel tables and the expanded weights between all meshes/sinks in one call; morph dictionaries may mutate, so folded lookups are rebuilt rather than cached without an invalidation key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows model/morph arrays/sinks and creates request-local maps only; owns no texture, geometry, animation task or worker, and channel writes remain in host-owned targets until the next supported-channel reset.
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
