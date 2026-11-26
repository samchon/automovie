import { AutoMovieEngineSequence } from "@automovie/engine";
import type { IAutoMovieClip } from "@automovie/interface";
import type * as THREE from "three";

import { applySampledObjectMotion } from "./internal/applySampledObjectMotion.js";

/**
 * Apply a shot's object clips under the engine's per-channel authority rule. A
 * future-only channel writes nothing. As with {@link applyObjectMotion}, a
 * stateful host must restore staged bases before each seek/frame when no active
 * authority should leave the staged value visible. Samples write parent-local
 * transform fields, so their coordinate frame must match each resolved target.
 */
export const applyObjectMotions: (
  clips: readonly IAutoMovieClip[],
  seconds: number,
  resolve: (node: string) => THREE.Object3D | undefined,
) => void = (
  clips: readonly IAutoMovieClip[],
  seconds: number,
  resolve: (node: string) => THREE.Object3D | undefined,
): void => {
  applySampledObjectMotion(AutoMovieEngineSequence.sampleClipSequence(clips, seconds), resolve);
};
