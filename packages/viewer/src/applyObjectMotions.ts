import { sampleClipSequence } from "@automovie/engine";
import type { IAutoMovieClip } from "@automovie/interface";
import type * as THREE from "three";

import { applySampledObjectMotion } from "./applySampledObjectMotion.js";

/**
 * Apply a shot's object clips under the engine's per-channel authority rule. A future-only channel writes nothing. As with {@link applyObjectMotion}, a stateful host must restore staged bases before each seek/frame when no active authority should leave the staged value visible. Samples write parent-local transform fields, so their coordinate frame must match each resolved target.
 *
 * @evidence contracts/common.md#principled-implementation Samples the supplied sequence through the engine's per-channel authority rule, then applies only authoritative node channels to matching parent-local target coordinates; seconds and clip content use the engine convention, and future-only channels leave scene state untouched.
 * @evidence contracts/common.md#clear-and-simple-design Sequence authority belongs to sampleClipSequence and scene mutation belongs to applySampledObjectMotion; this adapter connects those existing owners without another frame or scene representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the actual clip sequence, time and resolver without node-name exceptions or replacement methods; skipped future authority is the engine rule rather than a hidden fallback clip.
 * @evidence contracts/common.md#meaningful-documentation States the per-channel authority rule, future-only behavior and the host's responsibility to restore staged bases when seeking between partially authored clips.
 * @evidence contracts/performance.md#efficient-algorithms Engine sequence sampling visits candidate clip channels and resolves active authority; writing visits the authoritative table and descendant meshes for weights, retaining one temporary sample table rather than applying every candidate clip.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the mutation writer with the single-clip entry; sequence samples are not cached because clips, time and mutable target state jointly determine this effectful call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows clips and resolved objects only for this invocation; stores no cross-frame state, running tasks or GPU handles and lets temporary sample data become unreachable on return or throw.
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
  applySampledObjectMotion(sampleClipSequence(clips, seconds), resolve);
};
