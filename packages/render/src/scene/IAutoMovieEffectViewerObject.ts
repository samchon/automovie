import type * as THREE from "three";

import type { IAutoMovieEffectViewerStats } from "./IAutoMovieEffectViewerStats.js";

/**
 * Built deterministic billboard emitter.
 *
 * @evidence contracts/development/design.md#principled-representation Associates a native bounded InstancedMesh with current sampler summary and one absolute-time/camera update; the engine owns seeded fixed-step particle semantics and the viewer owns billboard projection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the actual mesh and summary/update seam rather than a second particle model; no current production host or complete close capability is supplied by the producer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not expose a fabricated measured-success field or substitute a fixture stream; native resource references remain real caller retirement obligations.
 * @evidence contracts/development/common.md#meaningful-documentation States scene attachment, bounded sample summary and camera-facing absolute-time update; producer documentation discloses native geometry/material/instance retirement duties.
 */
export interface IAutoMovieEffectViewerObject {
  /** Add this mesh to the shot scene. */
  object: THREE.InstancedMesh;

  /** Current bounded effect summary. */
  stats: IAutoMovieEffectViewerStats;

  /**
   * Sample one absolute shot time and face particles toward the camera.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the engine's admitted absolute fixed-step sample and camera world quaternion to write live billboard position/scale/opacity, without advancing a frame accumulator; supplied time/camera/effect numeric conventions are the runtime's premises.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Exposes the existing emitter's only frame operation beside its mesh/summary; seeded simulation stays in the engine and this method owns native buffer projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Actual sampled particles determine buffer entries/count, with no expected-frame population, fixture camera or replaced sampler method.
   * @evidence contracts/development/common.md#meaningful-documentation States absolute shot seconds and camera-facing publication; the producer's acknowledgment records capacity, color and resource-lifetime limitations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits N live returned particles to fill fixed-capacity instance/opacity buffers, plus canonical sampler candidate work; per-particle temporary vectors remain O(N) allocations and raster overdraw is separate GPU cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the emitter's geometry/material/instance capacity and working matrix/quaternion/scale while sampling fresh absolute-time data; mutable time/camera/data cannot be equated by runtime handle identity alone.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes caller-retired emitter buffers and mutates one scalar summary; request-local particle/vector data becomes unreachable after return and no extra renderer, worker or running task is retained.
   */
  update(camera: THREE.PerspectiveCamera, time: number): void;
}
