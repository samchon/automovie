import {
  IAutoMovieFormationCadenceSegment,
  IAutoMovieFormationReform,
  IAutoMovieSampledFormationMotion,
  composeFormationHeroTransform,
  formationCadenceSegments,
  formationSlotPosition,
  intersectsPerspectiveFrustumSphere,
  rotateFormationLocalOffset,
  sampleFormationMotion,
  sampleFormationSlotMotion,
  selectFormationLod,
} from "@automovie/engine";
import {
  IAutoMovieCompiledFormationHero,
  IAutoMovieCompiledFormationLod,
  IAutoMovieDeliveryCrop,
  IAutoMovieFormationChunk,
  IAutoMovieFormationSlot,
  IAutoMovieFormationSlotMotion,
  IAutoMovieFormationSlotState,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationViewerObject } from "./IAutoMovieFormationViewerObject.js";
import type { IAutoMovieFormationViewerStats } from "./IAutoMovieFormationViewerStats.js";
import type { IBuildInstancedFormationProps } from "./IBuildInstancedFormationProps.js";
import type { IChunkObject } from "./IChunkObject.js";
import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";
import type { ISlotException } from "./ISlotException.js";
import { bindFormationTierCycle } from "./bindFormationTierCycle.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { createFormationRepresentations } from "./createFormationRepresentations.js";
import { readAutoMovieDeliveryCrop } from "./deliveryCrop.js";
import { describeFormationTextureSources } from "./describeFormationTextureSources.js";
import { disposeFormationRepresentations } from "./disposeFormationRepresentations.js";
import { applyFormationCycleCadence } from "./formationCycle/index.js";
import { formationSpacingOffset } from "./formationSpacingOffset.js";
import { objectTransform } from "./objectTransform.js";
import { regenerateFormationSlot } from "./regenerateFormationSlot.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";
import { slotMatrix } from "./slotMatrix.js";
import { vector } from "./vector.js";

/**
 * Build one compact formation as chunked instance batches.
 *
 * Heroes are deliberately absent: the builder promoted them to explicit scene
 * nodes. Each LOD recipe is flattened into one mesh, keeping exactly one
 * 64-byte instance matrix and one 4-byte phase scalar per anonymous slot and
 * tier.
 *
 * Declared gaits are baked into part-matrix tables and each member reads the selected table at its seeded phase. Positive-stride takes advance by cue travel/turn and the stride heuristic; zero-stride takes instead advance by elapsed time and their declared period. Two scalar uniforms and one texture reference carry a tier's cadence, while culling, spacing/reform and sparse cues require additional update work.
 *
 * No production scene/film caller is connected in the current tree; direct users and owning tests exercise this producer, so this API alone does not establish that compiled shot populations reach the capture application.
 *
 * @evidence contracts/common.md#principled-implementation Uses engine compact slot regeneration, cue sampling, cadence integration and hysteretic LOD, projecting metre placements into chunk InstancedMeshes and baked Float32 part tables; admitted recipes/anchors/tiers are premises, stride is heuristic and cadence matrix interpolation is approximate, while anonymous and caller-supplied hero ownership stay distinct.
 * @evidence contracts/common.md#clear-and-simple-design Builds shared tier resources once and per-chunk matrix/phase buffers separately, with sparse slot exception lookup and hero rest snapshots for updates; no in-tree production shot host consumes this producer, and that unresolved wiring is not repaired by another runtime layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Regenerates authored seeded slots and actual cues without fixture frames or per-member surrogate nodes. The 0.01 chunk-radius and 0.001 distance/depth floors are numerical conventions; culling uses original chunk bounds and supplied projection radius, without recomputing bounds for reform or sparse offsets. Containment of the current deformed arrangement is therefore a remaining premise, not an independently established visibility guarantee.
 * @evidence contracts/common.md#meaningful-documentation States anonymous versus promoted members, metre/phase buffer roles, shared gait repertoire and cadence approximation, update work beyond uniform writes and the currently absent production consumer.
 * @evidence contracts/performance.md#efficient-algorithms Construction regenerates N anonymous slots and fills each resident tier, bakes each tier once and locates E exceptions by scanning C chunks then the matching chunk's slots. Updates visit chunks/tiers and heroes, sample cue lists for each exception, and rewrite N matrices when spacing/reform changes. Cue sampling and native graph updates add their actual costs; retained buffers scale with N times resident tiers rather than one Object3D per member.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares tier geometry/material/cycle textures across chunk meshes, retains tier hysteresis and only rewrites arrangement when spacing/reform inputs change; absolute cue/cadence inputs drive updates, and failed/successful disposal completion is reused without physical retries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Construction scope immediately owns tier retirement and each chunk geometry/mesh, rolling them back independently on later refusal; returned runtime owns all anonymous resources until disposal and borrows hero objects. Disposal stops updates, attempts every unique resource, retains operation closures on failed release and preserves its original completion until the runtime is released.
 */
export const buildInstancedFormation: (
  input: IBuildInstancedFormationProps,
) => IAutoMovieFormationViewerObject = (
  input: IBuildInstancedFormationProps,
): IAutoMovieFormationViewerObject => {
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): IAutoMovieFormationViewerObject => {
      const root: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
      root.name = `formation:${input.formation.id}`;
      root.position.copy(vector(input.formation.anchor));
      const heroes: Set<number> = new Set(
        input.formation.heroes.map(
          (hero: IAutoMovieCompiledFormationHero): number => hero.slot,
        ),
      );
      const representations: Map<
        "hero" | "near" | "far",
        IFormationTierRepresentation
      > = createFormationRepresentations(input);
      own({
        dispose: (): void =>
          disposeFormationRepresentations(representations.values()),
      });
      const cycles: IAutoMovieFormationCycle[] = [
        ...representations.values(),
      ].flatMap(
        (
          representation: IFormationTierRepresentation,
        ): IAutoMovieFormationCycle[] => {
          const cycle: IAutoMovieFormationCycle | null = representation.cycle;
          return cycle === null ? [] : [cycle];
        },
      );
      const selectionRadius: number = input.formation.projectionRadius;
      const chunks: IChunkObject[] = input.formation.chunks.map(
        (chunk: IAutoMovieFormationChunk): IChunkObject => {
          const slots: IAutoMovieFormationSlot[] = [];
          for (
            let slot: number = chunk.start;
            slot < chunk.start + chunk.count;
            ++slot
          )
            if (heroes.has(slot) === false)
              slots.push(regenerateFormationSlot(input.formation, slot));
          const tiers: Map<
            "hero" | "near" | "far",
            THREE.InstancedMesh<
              THREE.BufferGeometry<
                THREE.NormalBufferAttributes,
                THREE.BufferGeometryEventMap
              >,
              | THREE.Material<THREE.MaterialEventMap>
              | THREE.Material<THREE.MaterialEventMap>[],
              THREE.Object3DEventMap
            >
          > = new Map<
            IAutoMovieCompiledFormationLod["tier"],
            THREE.InstancedMesh
          >();
          for (const lod of slots.length === 0 ? [] : input.formation.lod) {
            const representation: IFormationTierRepresentation =
              representations.get(lod.tier)!;
            const geometry: THREE.BufferGeometry<
              THREE.NormalBufferAttributes,
              THREE.BufferGeometryEventMap
            > = own(representation.geometry.clone());
            geometry.setAttribute(
              "automoviePhase",
              new THREE.InstancedBufferAttribute(
                new Float32Array(
                  slots.map(
                    (slot: IAutoMovieFormationSlot): number => slot.motionPhase,
                  ),
                ),
                1,
              ),
            );
            const mesh: THREE.InstancedMesh<
              THREE.BufferGeometry<
                THREE.NormalBufferAttributes,
                THREE.BufferGeometryEventMap
              >,
              THREE.Material<THREE.MaterialEventMap>[],
              THREE.Object3DEventMap
            > = own(
              new THREE.InstancedMesh(
                geometry,
                representation.materials,
                slots.length,
              ),
            );
            mesh.name = `${input.formation.id}:${chunk.index}:${lod.tier}`;
            bindFormationTierCycle(mesh, representation);
            slots.forEach(
              (slot: IAutoMovieFormationSlot, index: number): void => {
                mesh.setMatrixAt(
                  index,
                  slotMatrix(slot, input.formation.anchor),
                );
              },
            );
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingBox();
            mesh.computeBoundingSphere();
            mesh.frustumCulled = false;
            mesh.visible = false;
            root.add(mesh);
            tiers.set(lod.tier, mesh);
          }
          return {
            runtime: chunk,
            radius: Math.max(
              0.01,
              ...[chunk.bounds.min.x, chunk.bounds.max.x].flatMap(
                (x: number): number[] =>
                  [chunk.bounds.min.y, chunk.bounds.max.y].flatMap(
                    (y: number): number[] =>
                      [chunk.bounds.min.z, chunk.bounds.max.z].map(
                        (z: number): number =>
                          Math.hypot(
                            x - chunk.centroid.x,
                            y - chunk.centroid.y,
                            z - chunk.centroid.z,
                          ),
                      ),
                  ),
              ),
            ),
            slots,
            tiers,
            selected: null,
            removed: 0,
          };
        },
      );
      const drawableTiers: Set<"hero" | "near" | "far"> = new Set(
        chunks.flatMap((chunk: IChunkObject): ("hero" | "near" | "far")[] => [
          ...chunk.tiers.keys(),
        ]),
      );
      // The cues a unit was built with are the cues it performs, resolved once.
      // Which members are singled out is settled here and never revisited, so a
      // frame that re-read the caller's list would sample cues against a set of
      // exceptions that no longer answers to them: a member named after the build
      // has no instance to write, and one named before it would keep performing
      // whatever the new list happened to say. Reading it twice also left the second
      // `?? []` an arm no input could take, since a unit whose cues are absent has
      // no exception to sample for.
      const slotMotions: readonly IAutoMovieFormationSlotMotion[] =
        input.slotMotions ?? [];
      // Every member a cue singles out, located once. Nothing is stored for the
      // members no cue names, which is what keeps a crowd of a hundred thousand
      // paying for the three exceptions it has and not for its own size.
      const exceptions: ISlotException[] = [];
      for (const slot of new Set(
        slotMotions.flatMap((cue: IAutoMovieFormationSlotMotion): number[] =>
          cue.formation === input.formation.id ? cue.slots : [],
        ),
      )) {
        const chunk: IChunkObject | undefined = chunks.find(
          (candidate: IChunkObject): boolean =>
            slot >= candidate.runtime.start &&
            slot < candidate.runtime.start + candidate.runtime.count,
        );
        const index: number =
          chunk?.slots.findIndex(
            (member: IAutoMovieFormationSlot): boolean => member.slot === slot,
          ) ?? -1;
        if (chunk === undefined || index < 0) continue;
        exceptions.push({ slot, chunk, index, designed: chunk.slots[index]! });
      }
      let spacing: { lateral: number; depth: number } = {
        lateral: 1,
        depth: 1,
      };
      // The arrangement currently written into the instance matrices, so a
      // frame that changes neither spacing nor arrangement writes nothing.
      let reform: IAutoMovieFormationReform | null = null;
      const initialHeroSources: Map<string, IAutoMovieTransform> = new Map(
        [...(input.heroObjects ?? [])].map(
          ([actor, object]: [
            string,
            THREE.Object3D<THREE.Object3DEventMap>,
          ]): readonly [string, IAutoMovieTransform] =>
            [actor, objectTransform(object)] as const,
        ),
      );
      const stats: IAutoMovieFormationViewerStats = {
        visible: { hero: 0, near: 0, far: 0 },
        culled: 0,
        removed: 0,
        heroes: input.formation.heroes.length,
      };
      let disposed: boolean = false;
      let disposalFailure: { error: unknown } | undefined;
      let retirements: (() => void)[] | undefined;
      return {
        object: root,
        stats,
        describeTextureSources: (): ReturnType<
          typeof describeFormationTextureSources
        > =>
          describeFormationTextureSources(
            input.formation.id,
            representations,
            drawableTiers,
          ),
        dispose(): void {
          if (disposed) {
            if (disposalFailure !== undefined) throw disposalFailure.error;
            return;
          }
          disposed = true;
          const ownedTiers: IFormationTierRepresentation[] = [
            ...representations.values(),
          ];
          retirements = [
            (): void => {
              root.removeFromParent();
            },
            ...chunks.flatMap((chunk: IChunkObject): (() => void)[] =>
              [...chunk.tiers.values()].flatMap(
                (mesh: THREE.InstancedMesh): (() => void)[] => [
                  (): void => mesh.geometry.dispose(),
                  (): void => mesh.dispose(),
                ],
              ),
            ),
            (): void => disposeFormationRepresentations(ownedTiers),
            (): void => {
              root.clear();
            },
          ];
          try {
            reportAutoMovieResourceRetirement(retirements);
            for (const chunk of chunks) {
              chunk.tiers.clear();
              chunk.slots.length = 0;
            }
            representations.clear();
            drawableTiers.clear();
            cycles.length = 0;
            chunks.length = 0;
            exceptions.length = 0;
            initialHeroSources.clear();
            retirements = undefined;
          } catch (error) {
            disposalFailure = { error };
            throw error;
          }
        },
        update(
          camera: THREE.PerspectiveCamera,
          viewportHeight: number,
          time: number | undefined,
          heroSources: ReadonlyMap<string, IAutoMovieTransform> | undefined,
        ): void {
          if (disposed)
            throw new Error(`Formation "${input.formation.id}" is disposed.`);
          stats.visible = { hero: 0, near: 0, far: 0 };
          stats.culled = 0;
          stats.removed = 0;
          const sampled: IAutoMovieSampledFormationMotion =
            sampleFormationMotion(
              input.motions ?? [],
              input.formation.id,
              time ?? 0,
            );
          // What the unit has done up to this instant, cut into the intervals its
          // cadence is made of. Every member lands somewhere else in the resulting
          // cycle, because the phase it adds is its own; every tier folds the same
          // intervals against its own figure's strides, because a near stickman and
          // a far one cover ground with the same feet.
          const cadence: IAutoMovieFormationCadenceSegment[] =
            formationCadenceSegments(
              input.motions ?? [],
              input.formation.id,
              time ?? 0,
            );
          for (const cycle of cycles)
            applyFormationCycleCadence(cycle, cadence);
          root.position.set(
            input.formation.anchor.x + sampled.translation.x,
            input.formation.anchor.y + sampled.translation.y,
            input.formation.anchor.z + sampled.translation.z,
          );
          root.quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            THREE.MathUtils.degToRad(sampled.facingOffsetDeg),
          );
          // Spacing opens and closes an arrangement; a re-form changes which
          // arrangement it is. Both move a member relative to its neighbours, so
          // neither can ride on the group transform above and both rewrite the
          // same instance matrices -- together, so a frame that changes both pays
          // for one pass and cannot apply one against the other's stale reading.
          if (
            sampled.spacingScale.lateral !== spacing.lateral ||
            sampled.spacingScale.depth !== spacing.depth ||
            sampled.reform?.layout !== reform?.layout ||
            sampled.reform?.progress !== reform?.progress
          ) {
            spacing = { ...sampled.spacingScale };
            reform = sampled.reform;
            for (const chunk of chunks)
              for (const mesh of chunk.tiers.values()) {
                chunk.slots.forEach(
                  (slot: IAutoMovieFormationSlot, index: number): void => {
                    mesh.setMatrixAt(
                      index,
                      slotMatrix(
                        reform === null
                          ? slot
                          : {
                              ...slot,
                              position: formationSlotPosition(
                                input.formation,
                                slot.slot,
                                reform,
                              ),
                            },
                        input.formation.anchor,
                        spacing,
                        input.formation.facingDeg,
                      ),
                    );
                  },
                );
                mesh.instanceMatrix.needsUpdate = true;
              }
          }
          // The members singled out, written after the unit-wide pass so a spacing
          // rewrite cannot undo them. Only the exceptions are touched, so this costs
          // what the author authored rather than what the crowd holds.
          //
          // The offset is authored in the unit's own frame and is turned by the
          // unit's designed heading alone, because the scene graph above already
          // carries the cue's own turn and its travel. That is the same composition
          // the engine's placement performs in one step for a gate that has no
          // scene graph to carry half of it.
          for (const exception of exceptions) exception.chunk.removed = 0;
          for (const exception of exceptions) {
            const state: IAutoMovieFormationSlotState =
              sampleFormationSlotMotion(
                slotMotions,
                input.formation.id,
                exception.slot,
                time ?? 0,
              );
            const offset: IAutoMovieVector3 = rotateFormationLocalOffset(
              state.offset,
              input.formation.facingDeg,
            );
            const position: THREE.Vector3 = formationSpacingOffset(
              exception.designed.position,
              input.formation.anchor,
              spacing,
              input.formation.facingDeg,
            );
            position.x += offset.x;
            position.y += offset.y;
            position.z += offset.z;
            // A member out of the shot is written at zero scale rather than dropped
            // from the buffer. Restacking an instance buffer would renumber every
            // member after it and cost the crowd's own size every time one member
            // left; a degenerate matrix rasterizes nothing and costs one write.
            const matrix: THREE.Matrix4 = new THREE.Matrix4().compose(
              position,
              new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                THREE.MathUtils.degToRad(
                  exception.designed.facingDeg + state.facingOffsetDeg,
                ),
              ),
              state.present
                ? new THREE.Vector3(1, 1, 1)
                : new THREE.Vector3(0, 0, 0),
            );
            for (const mesh of exception.chunk.tiers.values()) {
              mesh.setMatrixAt(exception.index, matrix);
              mesh.instanceMatrix.needsUpdate = true;
            }
            if (state.present === false) {
              ++exception.chunk.removed;
              ++stats.removed;
            }
          }
          root.updateMatrixWorld(true);
          camera.updateMatrixWorld(true);
          camera.updateProjectionMatrix();
          const projection: THREE.Matrix4 =
            new THREE.Matrix4().multiplyMatrices(
              camera.projectionMatrix,
              camera.matrixWorldInverse,
            );
          const frustum: THREE.Frustum =
            new THREE.Frustum().setFromProjectionMatrix(projection);
          const cameraPosition: THREE.Vector3 = new THREE.Vector3();
          const cameraRotation: THREE.Quaternion = new THREE.Quaternion();
          camera.getWorldPosition(cameraPosition);
          camera.getWorldQuaternion(cameraRotation);
          const halfY: number = Math.tan(
            THREE.MathUtils.degToRad(camera.fov) / 2,
          );
          const deliveryCrop: IAutoMovieDeliveryCrop | undefined =
            readAutoMovieDeliveryCrop(camera);
          const effectiveHalfY: number =
            halfY *
            (deliveryCrop === undefined
              ? 1
              : deliveryCrop.bottom - deliveryCrop.top);
          for (const hero of input.formation.heroes) {
            const object: THREE.Object3D<THREE.Object3DEventMap> | undefined =
              input.heroObjects?.get(hero.actor);
            if (object === undefined) continue;
            const source: IAutoMovieTransform = (heroSources?.get(hero.actor) ??
              initialHeroSources.get(hero.actor))!;
            const transformed: IAutoMovieTransform =
              composeFormationHeroTransform(
                hero.transform,
                source,
                input.formation.anchor,
                sampled,
                input.formation.facingDeg,
              );
            object.position.copy(vector(transformed.translation));
            object.quaternion.set(
              transformed.rotation.x,
              transformed.rotation.y,
              transformed.rotation.z,
              transformed.rotation.w,
            );
            object.scale.set(
              transformed.scale.x,
              transformed.scale.y,
              transformed.scale.z,
            );
            object.updateMatrixWorld(true);
            const visualObject: THREE.Object3D<THREE.Object3DEventMap> =
              input.heroVisualObjects?.get(hero.actor) ?? object;
            const worldPosition: THREE.Vector3 = new THREE.Vector3();
            visualObject.getWorldPosition(worldPosition);
            const worldRadius: number =
              selectionRadius *
              Math.max(
                Math.abs(transformed.scale.x),
                Math.abs(transformed.scale.y),
                Math.abs(transformed.scale.z),
              );
            object.visible = intersectsPerspectiveFrustumSphere({
              camera: {
                position: {
                  x: cameraPosition.x,
                  y: cameraPosition.y,
                  z: cameraPosition.z,
                },
                rotation: {
                  x: cameraRotation.x,
                  y: cameraRotation.y,
                  z: cameraRotation.z,
                  w: cameraRotation.w,
                },
              },
              center: {
                x: worldPosition.x,
                y: worldPosition.y,
                z: worldPosition.z,
              },
              radius: worldRadius,
              near: camera.near,
              far: camera.far,
              halfY,
              aspect: camera.aspect,
              crop: deliveryCrop,
            });
            if (object.visible) ++stats.visible.hero;
          }
          for (const chunk of chunks) {
            const localCenter: THREE.Vector3 = formationSpacingOffset(
              chunk.runtime.centroid,
              input.formation.anchor,
              spacing,
              input.formation.facingDeg,
            );
            const center: THREE.Vector3 = root.localToWorld(localCenter);
            const sphere: THREE.Sphere = new THREE.Sphere(
              center,
              chunk.radius *
                Math.max(
                  sampled.spacingScale.lateral,
                  sampled.spacingScale.depth,
                ) +
                selectionRadius,
            );
            if (frustum.intersectsSphere(sphere) === false) {
              for (const mesh of chunk.tiers.values()) mesh.visible = false;
              stats.culled += chunk.runtime.anonymousCount - chunk.removed;
              continue;
            }
            const distance: number = Math.max(
              0.001,
              cameraPosition.distanceTo(center),
            );
            const cameraDepth: number = Math.max(
              0.001,
              -center.clone().applyMatrix4(camera.matrixWorldInverse).z,
            );
            const projectedPixels: number =
              (selectionRadius * viewportHeight) /
              (effectiveHalfY * cameraDepth);
            const selected: IAutoMovieCompiledFormationLod = selectFormationLod(
              {
                lod: input.formation.lod,
                distance,
                projectedPixels,
                previous: chunk.selected,
              },
            ).lod;
            chunk.selected = selected.tier;
            for (const [tier, mesh] of chunk.tiers)
              mesh.visible = tier === selected.tier;
            stats.visible[selected.tier] +=
              chunk.runtime.anonymousCount - chunk.removed;
          }
        },
      };
    },
  );
};
