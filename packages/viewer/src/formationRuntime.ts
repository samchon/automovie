/**
 * Stateful formation runtime used by scene construction and player updates.
 * Build immutable tier representations and sparse slot membership once; updates
 * own cadence, placement, hero transforms, culling and hysteretic tier state.
 * Positions are metres, headings are degrees and elapsed time is seconds.
 * Engine placement laws remain authoritative; Three matrices only project them.
 * Shared tier geometry and material/cycle data precede per-chunk instance data.
 * Per-frame counts distinguish removed, culled, anonymous and promoted members.
 */
import {
  IAutoMovieFormationReform,
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
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationLod,
  IAutoMovieFormationMotion,
  IAutoMovieFormationSlot,
  IAutoMovieFormationSlotMotion,
  IAutoMovieModel,
} from "@automovie/interface";
import * as THREE from "three";

import { readAutoMovieDeliveryCrop } from "./deliveryCrop";
import {
  applyFormationCycleCadence,
  applyFormationCycleMaterial,
} from "./formationCycle";
import { flattenInstancedModel } from "./formationGeometry";
import {
  formationSpacingOffset,
  objectTransform,
  regenerateFormationSlot,
  slotMatrix,
  vector,
} from "./formationPlacement";
import type {
  IAutoMovieFormationViewerObject,
  IAutoMovieFormationViewerStats,
  IChunkObject,
  ISlotException,
} from "./formationTypes";

/**
 * Build one compact formation as chunked instance batches.
 *
 * Heroes are deliberately absent: the builder promoted them to explicit scene
 * nodes. Each LOD recipe is flattened into one mesh, keeping exactly one
 * 64-byte instance matrix and one 4-byte phase scalar per anonymous slot and
 * tier.
 *
 * Flat does not mean frozen. When the tier's runtime model declares gaits, each
 * is baked once into a part-matrix table and every member of every chunk reads
 * the playing table at its own seeded phase, so a crowd walks instead of
 * sliding across the ground in one shared attitude. What it performs, and how
 * fast, comes from the unit's own cues: a unit that covers ground steps as many
 * times as that ground requires, one that holds does not step at all, and one
 * that changes action changes table. Nothing about that is per member: the
 * instance buffers are the same size they were, and a frame advances the whole
 * unit by writing two floats.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-group-motion-model-selection Displays this surface from the selected formation motion model.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes the same group-motion and reform state in the viewer.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-transition Carries the prior tier into each camera-driven LOD selection.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements stable logical-to-display tier transitions.
 */
export const buildInstancedFormation = (input: {
  formation: IAutoMovieCompiledFormation;
  models: ReadonlyMap<string, IAutoMovieModel>;
  motions?: readonly IAutoMovieFormationMotion[];
  /**
   * Sparse per-member cues, so one member of a crowd can do what its neighbours
   * do not: leave, stop, step out, or stop being drawn at all.
   *
   * Read once, here. Which members the cues single out is settled while the
   * batches are built, so a caller that swapped this list afterwards would be
   * sampling cues against a set of exceptions that no longer answers to them;
   * rebuild the unit instead.
   */
  slotMotions?: readonly IAutoMovieFormationSlotMotion[];
  /** Explicit scene wrappers keyed by promoted hero actor id. */
  heroObjects?: ReadonlyMap<string, THREE.Object3D>;
  /** Pose-root objects whose actual world positions drive hero culling. */
  heroVisualObjects?: ReadonlyMap<string, THREE.Object3D>;
}): IAutoMovieFormationViewerObject => {
  const root = new THREE.Group();
  root.name = `formation:${input.formation.id}`;
  root.position.copy(vector(input.formation.anchor));
  const heroes = new Set(input.formation.heroes.map((hero) => hero.slot));
  const representations = new Map(
    input.formation.lod.map((lod) => {
      const model = input.models.get(lod.model);
      if (model === undefined)
        throw new Error(
          `Formation "${input.formation.id}" LOD "${lod.tier}" references missing runtime model "${lod.model}".`,
        );
      return [
        lod.tier,
        flattenInstancedModel(
          model,
          `Formation "${input.formation.id}" LOD "${lod.tier}"`,
          {},
        ),
      ] as const;
    }),
  );
  // One injection per tier, not per chunk: the tier owns the baked table and
  // the uniform cells, and every chunk drawing that tier shares both. A
  // material object can repeat inside one tier when several parts share a
  // palette entry, so the set is what keeps the injection from stacking.
  const cycles = [...representations.values()].flatMap((representation) => {
    const cycle = representation.cycle;
    if (cycle === null) return [];
    for (const material of new Set(representation.materials))
      applyFormationCycleMaterial(material, cycle);
    return [cycle];
  });
  // A cue that calls for a gait none of the unit's figures declares is an
  // author's mistake, not a taste to be quietly overruled: the crowd would
  // perform something else for the whole cue and every frame would look
  // deliberate. A unit whose figures declare nothing at all is a crowd of props
  // and has no repertoire to disagree with.
  const repertoire = new Set(
    cycles.flatMap((cycle) => [...cycle.takes.keys()]),
  );
  if (repertoire.size !== 0)
    for (const cue of input.motions ?? [])
      if (
        cue.formation === input.formation.id &&
        cue.gait !== undefined &&
        repertoire.has(cue.gait) === false
      )
        throw new Error(
          `Formation "${input.formation.id}" cue "${cue.id}" calls for gait "${cue.gait}", which no runtime model of this unit declares.`,
        );
  const selectionRadius = input.formation.projectionRadius;
  const chunks: IChunkObject[] = input.formation.chunks.map((chunk) => {
    const slots: IAutoMovieFormationSlot[] = [];
    for (let slot = chunk.start; slot < chunk.start + chunk.count; ++slot)
      if (heroes.has(slot) === false)
        slots.push(regenerateFormationSlot(input.formation, slot));
    const tiers = new Map<
      IAutoMovieCompiledFormationLod["tier"],
      THREE.InstancedMesh
    >();
    for (const lod of slots.length === 0 ? [] : input.formation.lod) {
      const representation = representations.get(lod.tier)!;
      const geometry = representation.geometry.clone();
      geometry.setAttribute(
        "automoviePhase",
        new THREE.InstancedBufferAttribute(
          new Float32Array(slots.map((slot) => slot.motionPhase)),
          1,
        ),
      );
      const mesh = new THREE.InstancedMesh(
        geometry,
        representation.materials,
        slots.length,
      );
      mesh.name = `${input.formation.id}:${chunk.index}:${lod.tier}`;
      if (representation.cycle !== null)
        mesh.userData.automovieFormationCycle = representation.cycle;
      slots.forEach((slot, index) => {
        mesh.setMatrixAt(index, slotMatrix(slot, input.formation.anchor));
      });
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
        ...[chunk.bounds.min.x, chunk.bounds.max.x].flatMap((x) =>
          [chunk.bounds.min.y, chunk.bounds.max.y].flatMap((y) =>
            [chunk.bounds.min.z, chunk.bounds.max.z].map((z) =>
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
  });
  // The cues a unit was built with are the cues it performs, resolved once.
  // Which members are singled out is settled here and never revisited, so a
  // frame that re-read the caller's list would sample cues against a set of
  // exceptions that no longer answers to them — a member named after the build
  // has no instance to write, and one named before it would keep performing
  // whatever the new list happened to say. Reading it twice also left the second
  // `?? []` an arm no input could take, since a unit whose cues are absent has
  // no exception to sample for.
  const slotMotions = input.slotMotions ?? [];
  // Every member a cue singles out, located once. Nothing is stored for the
  // members no cue names, which is what keeps a crowd of a hundred thousand
  // paying for the three exceptions it has and not for its own size.
  const exceptions: ISlotException[] = [];
  for (const slot of new Set(
    slotMotions.flatMap((cue) =>
      cue.formation === input.formation.id ? cue.slots : [],
    ),
  )) {
    const chunk = chunks.find(
      (candidate) =>
        slot >= candidate.runtime.start &&
        slot < candidate.runtime.start + candidate.runtime.count,
    );
    const index =
      chunk?.slots.findIndex((member) => member.slot === slot) ?? -1;
    if (chunk === undefined || index < 0) continue;
    exceptions.push({ slot, chunk, index, designed: chunk.slots[index]! });
  }
  let spacing = { lateral: 1, depth: 1 };
  // The arrangement currently written into the instance matrices, so a
  // frame that changes neither spacing nor arrangement writes nothing.
  let reform: IAutoMovieFormationReform | null = null;
  const initialHeroSources = new Map(
    [...(input.heroObjects ?? [])].map(
      ([actor, object]) => [actor, objectTransform(object)] as const,
    ),
  );
  const stats: IAutoMovieFormationViewerStats = {
    visible: { hero: 0, near: 0, far: 0 },
    culled: 0,
    removed: 0,
    heroes: input.formation.heroes.length,
  };
  return {
    object: root,
    stats,
    update(camera, viewportHeight, time, heroSources): void {
      stats.visible = { hero: 0, near: 0, far: 0 };
      stats.culled = 0;
      stats.removed = 0;
      const sampled = sampleFormationMotion(
        input.motions ?? [],
        input.formation.id,
        time ?? 0,
      );
      // What the unit has done up to this instant, cut into the intervals its
      // cadence is made of. Every member lands somewhere else in the resulting
      // cycle, because the phase it adds is its own; every tier folds the same
      // intervals against its own figure's strides, because a near stickman and
      // a far one cover ground with the same feet.
      const cadence = formationCadenceSegments(
        input.motions ?? [],
        input.formation.id,
        time ?? 0,
      );
      for (const cycle of cycles) applyFormationCycleCadence(cycle, cadence);
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
            chunk.slots.forEach((slot, index) => {
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
            });
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
        const state = sampleFormationSlotMotion(
          slotMotions,
          input.formation.id,
          exception.slot,
          time ?? 0,
        );
        const offset = rotateFormationLocalOffset(
          state.offset,
          input.formation.facingDeg,
        );
        const position = formationSpacingOffset(
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
        const matrix = new THREE.Matrix4().compose(
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
      const projection = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      );
      const frustum = new THREE.Frustum().setFromProjectionMatrix(projection);
      const cameraPosition = new THREE.Vector3();
      const cameraRotation = new THREE.Quaternion();
      camera.getWorldPosition(cameraPosition);
      camera.getWorldQuaternion(cameraRotation);
      const halfY = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const deliveryCrop = readAutoMovieDeliveryCrop(camera);
      const effectiveHalfY =
        halfY *
        (deliveryCrop === undefined
          ? 1
          : deliveryCrop.bottom - deliveryCrop.top);
      for (const hero of input.formation.heroes) {
        const object = input.heroObjects?.get(hero.actor);
        if (object === undefined) continue;
        const source = (heroSources?.get(hero.actor) ??
          initialHeroSources.get(hero.actor))!;
        const transformed = composeFormationHeroTransform(
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
        const visualObject = input.heroVisualObjects?.get(hero.actor) ?? object;
        const worldPosition = new THREE.Vector3();
        visualObject.getWorldPosition(worldPosition);
        const worldRadius =
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
        const localCenter = formationSpacingOffset(
          chunk.runtime.centroid,
          input.formation.anchor,
          spacing,
          input.formation.facingDeg,
        );
        const center = root.localToWorld(localCenter);
        const sphere = new THREE.Sphere(
          center,
          chunk.radius *
            Math.max(sampled.spacingScale.lateral, sampled.spacingScale.depth) +
            selectionRadius,
        );
        if (frustum.intersectsSphere(sphere) === false) {
          for (const mesh of chunk.tiers.values()) mesh.visible = false;
          stats.culled += chunk.runtime.anonymousCount - chunk.removed;
          continue;
        }
        const distance = Math.max(0.001, cameraPosition.distanceTo(center));
        const cameraDepth = Math.max(
          0.001,
          -center.clone().applyMatrix4(camera.matrixWorldInverse).z,
        );
        const projectedPixels =
          (selectionRadius * viewportHeight) / (effectiveHalfY * cameraDepth);
        const selected = selectFormationLod({
          lod: input.formation.lod,
          distance,
          projectedPixels,
          previous: chunk.selected,
        }).lod;
        chunk.selected = selected.tier;
        for (const [tier, mesh] of chunk.tiers)
          mesh.visible = tier === selected.tier;
        stats.visible[selected.tier] +=
          chunk.runtime.anonymousCount - chunk.removed;
      }
    },
  };
};
