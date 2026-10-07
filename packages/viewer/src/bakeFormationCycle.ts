import { autoMovieModelGaits, gaitMotion } from "@automovie/engine";
import * as THREE from "three";

import { AUTOMOVIE_FORMATION_CYCLE_SAMPLES } from "./AUTOMOVIE_FORMATION_CYCLE_SAMPLES";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";
import type { IBakeFormationCycleProps } from "./IBakeFormationCycleProps";
import { applyPose } from "./applyPose";
import { formationCycleStride } from "./formationCycleStride";

/**
 * Bake one runtime model's whole repertoire into rigid part-matrix tables.
 *
 * `built` must already be at rest with its world matrices current, because the
 * merged instance geometry was baked from exactly those rest matrices: what is
 * stored per sample is `posed * rest⁻¹`, the transform that carries a
 * rest-space vertex to where the cycle puts it. The object is left at the last
 * sampled pose; callers extract geometry before baking, never after.
 *
 * The pose comes from {@link gaitMotion}, whose keyframe `i` of `samples` sits
 * exactly at cycle position `i / samples`, and is applied through the same
 * {@link applyPose} a named performer goes through, so an anonymous member and a
 * promoted one at the same phase strike the same attitude.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Bakes the declared gait repertoire through the named-performer pose path so unit travel and turn can replay those same rigid-part motions.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Bakes the declared gait repertoire through the named-performer pose path so unit travel and turn can replay those same rigid-part motions.
 */
export const bakeFormationCycle = (
  input: IBakeFormationCycleProps,
): IAutoMovieFormationCycle | null => {
  const skeleton = input.model.skeleton;
  const gaits = autoMovieModelGaits(input.model);
  if (skeleton === null || gaits.length === 0) return null;
  const samples = input.samples ?? AUTOMOVIE_FORMATION_CYCLE_SAMPLES;
  const rest = input.parts.map((part) => part.matrixWorld.clone().invert());
  // The point of a part that can meet the ground: the bottom of its own box,
  // in its own space, so the bake follows the surface a foot stands on rather
  // than the pivot it swings about.
  const soles = input.parts.map((part) => {
    part.geometry.computeBoundingBox();
    const box = part.geometry.boundingBox!;
    return new THREE.Vector3(
      (box.min.x + box.max.x) / 2,
      box.min.y,
      (box.min.z + box.max.z) / 2,
    );
  });
  const takes = gaits.map((gait) => {
    const clip = gaitMotion(
      `${input.model.id}:${gait.name}`,
      skeleton.id,
      gait,
      samples,
    );
    const matrices = new Float32Array(input.parts.length * 3 * samples * 4);
    const tracks = input.parts.map(() => [] as THREE.Vector3[]);
    const posed = new THREE.Matrix4();
    for (let sample = 0; sample < samples; ++sample) {
      applyPose(input.built, clip.keyframes[sample]!.pose, skeleton);
      input.built.object.updateMatrixWorld(true);
      input.parts.forEach((part, index) => {
        const elements = posed.multiplyMatrices(
          part.matrixWorld,
          rest[index]!,
        ).elements;
        for (let row = 0; row < 3; ++row)
          for (let column = 0; column < 4; ++column)
            matrices[((index * 3 + row) * samples + sample) * 4 + column] =
              elements[column * 4 + row]!;
        tracks[index]!.push(
          soles[index]!.clone().applyMatrix4(part.matrixWorld),
        );
      });
    }
    const texture = new THREE.DataTexture(
      matrices,
      samples,
      input.parts.length * 3,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    // Nearest sampling on purpose: linear filtering of 32-bit float textures is
    // an optional extension, and the two-step blend the shader performs itself
    // is the same arithmetic with none of the capability risk.
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.NoColorSpace;
    texture.needsUpdate = true;
    return {
      gait: gait.name,
      strideMeters: formationCycleStride(tracks),
      periodSeconds: gait.period,
      matrices,
      texture,
    };
  });
  const fallback = takes[0]!;
  return {
    samples,
    names: input.parts.map((part) => part.name),
    takes: new Map(takes.map((take) => [take.gait, take] as const)),
    fallback,
    active: fallback,
    uniforms: {
      automovieCycleTexture: { value: fallback.texture },
      automovieCycleSamples: { value: samples },
      automovieCycleRows: { value: input.parts.length * 3 },
      automovieCycleAdvance: { value: 0 },
      automovieCycleTurn: { value: 0 },
    },
  };
};
