import { AutoMovieEngineModel, AutoMovieEngineMotionClip } from "@automovie/engine";
import type {
  IAutoMovieFormationPoseTake,
  IAutoMovieGait,
  IAutoMovieKeyframe,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import * as THREE from "three";

import { AUTOMOVIE_FORMATION_CYCLE_SAMPLES } from "../AUTOMOVIE_FORMATION_CYCLE_SAMPLES.js";
import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "../IAutoMovieFormationCycleTake.js";
import type { IBakeFormationCycleProps } from "../IBakeFormationCycleProps.js";
import { applyPose } from "./applyPose.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { formationCycleStride } from "./formationCycleStride.js";

/**
 * Bake one runtime model's whole repertoire into rigid part-matrix tables.
 *
 * `built` must already be at rest with its world matrices current, because the
 * merged instance geometry was baked from exactly those rest matrices: what is
 * stored per sample is `posed * rest⁻¹`, the transform that carries a
 * rest-space vertex to where the cycle puts it. The object is left at the last
 * sampled pose; callers extract geometry before baking, never after.
 *
 * The poses are the given pose takes (`IBakeFormationCycleProps.takes`, a
 * performed member's cycle) or, without them, come from {@link gaitMotion},
 * whose keyframe `i` of `samples` sits exactly at cycle position `i / samples`.
 * The loop-closing duplicate is omitted because texture playback wraps the last
 * column to the first. Each sample passes through the same {@link applyPose}
 * used by named performers. This bake passes default joint axes and no clinical
 * rest frames; a caller using different explicit axes/rest frames may therefore
 * obtain a different attitude at the same phase.
 *
 * The table is a sampled Float32 affine approximation, not an exact continuous
 * rigid rotation or a proof of no-slip foot contact. Its stride uses the
 * existing lowest-part trajectory heuristic. Returned take textures transfer to
 * the representation owner; a later take's refusal retires earlier textures.
 */
export const bakeFormationCycle: (
  input: IBakeFormationCycleProps,
) => IAutoMovieFormationCycle | null = (
  input: IBakeFormationCycleProps,
): IAutoMovieFormationCycle | null => {
  const skeleton: IAutoMovieSkeleton | null = input.model.skeleton;
  if (skeleton === null) return null;

  // The cycles to bake: the given pose tables, or each gait of the model synthesised at even phases.
  const samples: number =
    input.takes?.[0]?.poses.length ??
    input.samples ??
    AUTOMOVIE_FORMATION_CYCLE_SAMPLES;
  const sources: readonly IAutoMovieFormationPoseTake[] =
    input.takes ??
    AutoMovieEngineModel.gaits(input.model).map(
      (gait: IAutoMovieGait): IAutoMovieFormationPoseTake => ({
        gait: gait.name,
        periodSeconds: gait.period,
        poses: AutoMovieEngineMotionClip.gaitMotion(
          `${input.model.id}:${gait.name}`,
          skeleton.id,
          gait,
          samples,
        )
          .keyframes.slice(0, samples)
          .map((k: IAutoMovieKeyframe): IAutoMoviePose => k.pose),
      }),
    );
  if (sources.length === 0) return null;
  if (
    sources.some(
      (t: IAutoMovieFormationPoseTake): boolean =>
        t.poses.length !== samples || samples < 1,
    )
  )
    throw new Error(
      "bakeFormationCycle: every pose take holds the same positive count of poses",
    );
  const rest: THREE.Matrix4[] = input.parts.map(
    (
      part: THREE.Mesh<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): THREE.Matrix4 => part.matrixWorld.clone().invert(),
  );
  // The point of a part that can meet the ground: the bottom of its own box,
  // in its own space, so the bake follows the surface a foot stands on rather
  // than the pivot it swings about.
  const soles: THREE.Vector3[] = input.parts.map(
    (
      part: THREE.Mesh<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >,
        | THREE.Material<THREE.MaterialEventMap>
        | THREE.Material<THREE.MaterialEventMap>[],
        THREE.Object3DEventMap
      >,
    ): THREE.Vector3 => {
      part.geometry.computeBoundingBox();
      const box: THREE.Box3 = part.geometry.boundingBox!;
      return new THREE.Vector3(
        (box.min.x + box.max.x) / 2,
        box.min.y,
        (box.min.z + box.max.z) / 2,
      );
    },
  );
  const takes: IAutoMovieFormationCycleTake[] =
    constructAutoMovieOwnedResources(
      (
        own: <Resource extends { dispose(): void }>(
          resource: Resource,
        ) => Resource,
      ): {
        gait: string;
        strideMeters: number;
        periodSeconds: number;
        matrices: Float32Array<ArrayBuffer>;
        texture: THREE.DataTexture;
      }[] =>
        sources.map(
          (
            take: IAutoMovieFormationPoseTake,
          ): {
            gait: string;
            strideMeters: number;
            periodSeconds: number;
            matrices: Float32Array<ArrayBuffer>;
            texture: THREE.DataTexture;
          } => {
            const matrices: Float32Array<ArrayBuffer> = new Float32Array(
              input.parts.length * 3 * samples * 4,
            );
            const tracks: THREE.Vector3[][] = input.parts.map(
              (): THREE.Vector3[] => [],
            );
            const posed: THREE.Matrix4 = new THREE.Matrix4();
            for (let sample: number = 0; sample < samples; ++sample) {
              applyPose(input.built, take.poses[sample]!, skeleton);
              input.built.object.updateMatrixWorld(true);
              input.parts.forEach(
                (
                  part: THREE.Mesh<
                    THREE.BufferGeometry<
                      THREE.NormalBufferAttributes,
                      THREE.BufferGeometryEventMap
                    >,
                    | THREE.Material<THREE.MaterialEventMap>
                    | THREE.Material<THREE.MaterialEventMap>[],
                    THREE.Object3DEventMap
                  >,
                  index: number,
                ): void => {
                  const elements: THREE.Matrix4Tuple = posed.multiplyMatrices(
                    part.matrixWorld,
                    rest[index]!,
                  ).elements;
                  for (let row: number = 0; row < 3; ++row)
                    for (let column: number = 0; column < 4; ++column)
                      matrices[
                        ((index * 3 + row) * samples + sample) * 4 + column
                      ] = elements[column * 4 + row]!;
                  tracks[index]!.push(
                    soles[index]!.clone().applyMatrix4(part.matrixWorld),
                  );
                },
              );
            }
            const texture: THREE.DataTexture = own(
              new THREE.DataTexture(
                matrices,
                samples,
                input.parts.length * 3,
                THREE.RGBAFormat,
                THREE.FloatType,
              ),
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
              gait: take.gait,
              strideMeters: take.strideMeters ?? formationCycleStride(tracks),
              periodSeconds: take.periodSeconds,
              matrices,
              texture,
            };
          },
        ),
    );
  const fallback: IAutoMovieFormationCycleTake = takes[0]!;
  return {
    samples,
    names: input.parts.map(
      (
        part: THREE.Mesh<
          THREE.BufferGeometry<
            THREE.NormalBufferAttributes,
            THREE.BufferGeometryEventMap
          >,
          | THREE.Material<THREE.MaterialEventMap>
          | THREE.Material<THREE.MaterialEventMap>[],
          THREE.Object3DEventMap
        >,
      ): string => part.name,
    ),
    takes: new Map(
      takes.map(
        (
          take: IAutoMovieFormationCycleTake,
        ): readonly [string, IAutoMovieFormationCycleTake] =>
          [take.gait, take] as const,
      ),
    ),
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
