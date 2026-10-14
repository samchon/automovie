import { autoMovieModelGaits, gaitMotion } from "@automovie/engine";
import * as THREE from "three";
import type { IAutoMovieSkeleton, IAutoMovieGait, IAutoMovieMotion } from "@automovie/interface";

import { AUTOMOVIE_FORMATION_CYCLE_SAMPLES } from "./AUTOMOVIE_FORMATION_CYCLE_SAMPLES.js";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IBakeFormationCycleProps } from "./IBakeFormationCycleProps.js";
import { applyPose } from "./applyPose.js";
import { formationCycleStride } from "./formationCycleStride.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

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
 * {@link applyPose} used by named performers. This bake passes default
 * joint axes and no clinical rest frames; a caller using different explicit
 * axes/rest frames may therefore obtain a different attitude at the same phase.
 *
 * The table is a sampled Float32 affine approximation, not an exact continuous
 * rigid rotation or a proof of no-slip foot contact. Its stride uses the
 * existing lowest-part trajectory heuristic. Returned take textures transfer
 * to the representation owner; a later take's refusal retires earlier textures.
 *
 * @evidence contracts/common.md#principled-implementation Samples canonical gaitMotion/applyPose and stores posedWorld*inverseRestWorld affine rows per rigid part; admitted invertible rest matrices, ordered parts and positive integral sample count are premises. Float32 matrix interpolation and lowest-part stride estimation remain approximate, and the caller's object stays at the last attempted pose even on refusal.
 * @evidence contracts/common.md#clear-and-simple-design Owns one figure repertoire bake after rigid rest geometry extraction; each take carries timing/stride/table/texture together and the returned uniform cells bind the same fallback/active take consumed by cadence/shader helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual gait declarations/rig parts and native nearest texture sampling, avoiding extension-dependent float linear filtering; sole box-bottom trajectory and fixed sample count are explicit bake heuristics, not asset-name exceptions or patched solvers.
 * @evidence contracts/common.md#meaningful-documentation States rest-before-bake ordering, mutable final-pose effect, affine table meaning, sampled precision/contact limitations and take texture transfer/failure rollback.
 * @evidence contracts/performance.md#efficient-algorithms For G gaits, S samples, P parts and B bones, baking costs gait synthesis/FK plus S world-graph updates and P matrix/trajectory writes per gait; matrix bytes are 48*G*S*P, with temporary Vector3 tracks proportional to S*P per take and no anonymous-member dimension.
 * @evidence contracts/performance.md#reuse-equivalent-work Computes inverse rest matrices/box-bottom anchors once and reuses one working Matrix4 across samples; all formation members borrow the baked tables later, while mutable rig/model inputs have no immutable revision key for cross-build memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Immediately registers each DataTexture during repertoire construction and independently retires all prior takes on later refusal; success transfers finite G table textures/arrays to the representation owner. Borrowed rig/part resources are not disposed or pose-restored by the bake, and returned arrays remain until their representation is released.
 */
export const bakeFormationCycle: (input: IBakeFormationCycleProps) => IAutoMovieFormationCycle | null = (
  input: IBakeFormationCycleProps,
): IAutoMovieFormationCycle | null => {
  const skeleton: IAutoMovieSkeleton | null = input.model.skeleton;
  const gaits: readonly IAutoMovieGait[] = autoMovieModelGaits(input.model);
  if (skeleton === null || gaits.length === 0) return null;
  const samples: number = input.samples ?? AUTOMOVIE_FORMATION_CYCLE_SAMPLES;
  const rest: THREE.Matrix4[] = input.parts.map((part: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): THREE.Matrix4 => part.matrixWorld.clone().invert());
  // The point of a part that can meet the ground: the bottom of its own box,
  // in its own space, so the bake follows the surface a foot stands on rather
  // than the pivot it swings about.
  const soles: THREE.Vector3[] = input.parts.map((part: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): THREE.Vector3 => {
    part.geometry.computeBoundingBox();
    const box: THREE.Box3 = part.geometry.boundingBox!;
    return new THREE.Vector3(
      (box.min.x + box.max.x) / 2,
      box.min.y,
      (box.min.z + box.max.z) / 2,
    );
  });
  const takes: IAutoMovieFormationCycleTake[] = constructAutoMovieOwnedResources((own: <Resource extends { dispose(): void; }>(resource: Resource) => Resource): { gait: string; strideMeters: number; periodSeconds: number; matrices: Float32Array<ArrayBuffer>; texture: THREE.DataTexture; }[] => gaits.map((gait: IAutoMovieGait): { gait: string; strideMeters: number; periodSeconds: number; matrices: Float32Array<ArrayBuffer>; texture: THREE.DataTexture; } => {
    const clip: IAutoMovieMotion = gaitMotion(
      `${input.model.id}:${gait.name}`,
      skeleton.id,
      gait,
      samples,
    );
    const matrices: Float32Array<ArrayBuffer> = new Float32Array(input.parts.length * 3 * samples * 4);
    const tracks: THREE.Vector3[][] = input.parts.map((): THREE.Vector3[] => [] as THREE.Vector3[]);
    const posed: THREE.Matrix4 = new THREE.Matrix4();
    for (let sample: number = 0; sample < samples; ++sample) {
      applyPose(input.built, clip.keyframes[sample]!.pose, skeleton);
      input.built.object.updateMatrixWorld(true);
      input.parts.forEach((part: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, index: number): void => {
        const elements: THREE.Matrix4Tuple = posed.multiplyMatrices(
          part.matrixWorld,
          rest[index]!,
        ).elements;
        for (let row: number = 0; row < 3; ++row)
          for (let column: number = 0; column < 4; ++column)
            matrices[((index * 3 + row) * samples + sample) * 4 + column] =
              elements[column * 4 + row]!;
        tracks[index]!.push(
          soles[index]!.clone().applyMatrix4(part.matrixWorld),
        );
      });
    }
    const texture: THREE.DataTexture = own(new THREE.DataTexture(
      matrices,
      samples,
      input.parts.length * 3,
      THREE.RGBAFormat,
      THREE.FloatType,
    ));
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
  }));
  const fallback: IAutoMovieFormationCycleTake = takes[0]!;
  return {
    samples,
    names: input.parts.map((part: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>): string => part.name),
    takes: new Map(takes.map((take: IAutoMovieFormationCycleTake): readonly [string, IAutoMovieFormationCycleTake] => [take.gait, take] as const)),
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
