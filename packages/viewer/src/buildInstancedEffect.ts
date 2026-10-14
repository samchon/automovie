import {
  type IAutoMovieEffectParticle,
  type IAutoMovieEffectSample,
  sampleCompiledEffect,
} from "@automovie/engine";
import type { IAutoMovieCompiledEffect } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieEffectViewerObject } from "./IAutoMovieEffectViewerObject.js";
import type { IAutoMovieEffectViewerStats } from "./IAutoMovieEffectViewerStats.js";

/**
 * Build a compiled effect as fixed-capacity camera-facing billboard instances.
 * Numeric particles come from the engine's absolute fixed-step sampler. The
 * current tree exposes this producer without a production scene/film caller.
 * Its returned native mesh exposes resources for caller-owned retirement;
 * no complete disposal handle or partial-setup rollback is supplied here.
 *
 * @evidence contracts/common.md#principled-implementation Samples admitted compiled effects by absolute time and distance, then copies bounded live particle position/size/opacity into camera-world-oriented instance matrices; maxParticles bounds live buffers, recipe ranges/finite coordinates are upstream premises and a smooth radial feather defines billboard appearance rather than physical volumetric scattering.
 * @evidence contracts/common.md#clear-and-simple-design One native instanced plane stream projects the canonical sampler and reports its current scalar summary; there is no production scene/film consumer in the current tree, and no new runtime service is added to conceal that exported-only reach.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual seed/time/particle values and declared cap without fixture particles or GPU random state; radial feather thresholds0.28/0.5 and renderOrder10 are explicit current display conventions. Color uses native hex decoding/global color policy, and this custom shader has no final color-space chunk, so full captured-color parity is not guaranteed.
 * @evidence contracts/common.md#meaningful-documentation Gives fixed-step numerical ownership, camera-facing projection, live capacity, caller native-resource retirement and missing production/rollback boundaries rather than certifying a drawn effect.
 * @evidence contracts/performance.md#efficient-algorithms Allocates B matrix/opacity capacity once for budget B and fills N live sampled particles per update, plus the sampler's candidate/lifetime/LOD cost; per-particle Vector3 temporaries are still allocated and transparent raster overdraw follows screen coverage, not just live count.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses one plane/material/instance buffer and working matrix/scale/camera quaternion across frames; absolute-time sampling recomputes live particles, since matching object identity is not an immutable recipe/time/distance equivalence key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned mesh owns one geometry/material/native instance stream and retains the compiled effect through update, with bytes proportional to cap; no disposer/constructor rollback is returned, so callers must retire all three actual native roles and discard the handle. No worker or decoder is acquired.
 */
export const buildInstancedEffect: (
  effect: IAutoMovieCompiledEffect,
) => IAutoMovieEffectViewerObject = (
  effect: IAutoMovieCompiledEffect,
): IAutoMovieEffectViewerObject => {
  const geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(1, 1);
  const opacity: THREE.InstancedBufferAttribute =
    new THREE.InstancedBufferAttribute(
      new Float32Array(effect.recipe.budget.maxParticles),
      1,
    );
  geometry.setAttribute("automovieOpacity", opacity);
  const material: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      automovieColor: { value: new THREE.Color(effect.recipe.particle.color) },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    vertexShader: `
      attribute float automovieOpacity;
      varying float vAutomovieOpacity;
      varying vec2 vAutomovieUv;
      void main() {
        vAutomovieOpacity = automovieOpacity;
        vAutomovieUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix *
          vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 automovieColor;
      varying float vAutomovieOpacity;
      varying vec2 vAutomovieUv;
      void main() {
        float radius = length(vAutomovieUv - vec2(0.5));
        float feather = 1.0 - smoothstep(0.28, 0.5, radius);
        gl_FragColor = vec4(automovieColor, vAutomovieOpacity * feather);
      }
    `,
  });
  const mesh: THREE.InstancedMesh<
    THREE.PlaneGeometry,
    THREE.ShaderMaterial,
    THREE.Object3DEventMap
  > = new THREE.InstancedMesh(
    geometry,
    material,
    effect.recipe.budget.maxParticles,
  );
  mesh.name = `effect:${effect.zone}:${effect.id}`;
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  mesh.userData.automovieEffect = {
    zone: effect.zone,
    kind: effect.kind,
    digest: effect.digest,
  };
  const stats: IAutoMovieEffectViewerStats = {
    active: false,
    particles: 0,
    cap: effect.recipe.budget.maxParticles,
    intensity: 0,
  };
  const matrix: THREE.Matrix4 = new THREE.Matrix4();
  const scale: THREE.Vector3 = new THREE.Vector3();
  const cameraQuaternion: THREE.Quaternion = new THREE.Quaternion();
  return {
    object: mesh,
    stats,
    update(camera: THREE.PerspectiveCamera, time: number): void {
      const center: THREE.Vector3 = new THREE.Vector3(
        (effect.bounds.min.x + effect.bounds.max.x) / 2,
        (effect.bounds.min.y + effect.bounds.max.y) / 2,
        (effect.bounds.min.z + effect.bounds.max.z) / 2,
      );
      const cameraPosition: THREE.Vector3 = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      camera.getWorldQuaternion(cameraQuaternion);
      const sample: IAutoMovieEffectSample = sampleCompiledEffect(
        effect,
        time,
        cameraPosition.distanceTo(center),
      );
      sample.particles.forEach(
        (particle: IAutoMovieEffectParticle, index: number): void => {
          scale.set(particle.size, particle.size, particle.size);
          matrix.compose(
            new THREE.Vector3(
              particle.position.x,
              particle.position.y,
              particle.position.z,
            ),
            cameraQuaternion,
            scale,
          );
          mesh.setMatrixAt(index, matrix);
          opacity.setX(index, particle.opacity);
        },
      );
      mesh.count = sample.particles.length;
      mesh.visible = sample.active && mesh.count > 0;
      mesh.instanceMatrix.needsUpdate = true;
      opacity.needsUpdate = true;
      stats.active = sample.active;
      stats.particles = sample.particles.length;
      stats.intensity = sample.intensity;
    },
  };
};
