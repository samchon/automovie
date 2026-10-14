import type { IAutoMovieModel } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { IBakeFormationCycleProps } from "./IBakeFormationCycleProps.js";
import { bakeFormationCycle } from "./bakeFormationCycle.js";
import { buildModel } from "./buildModel.js";
import { flattenRigidParts } from "./flattenRigidParts.js";
import { instancedModelParts } from "./instancedModelParts.js";
import { collectAutoMovieOwnedResources } from "./collectAutoMovieOwnedResources.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";
import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry.js";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

/**
 * Flatten one runtime model for a chunked instancing consumer.
 *
 * buildModel creates this entry's materials; the returned representation hands
 * them to the consumer along with the owned merged geometry. Lower-level
 * flattening retains those objects rather than allocating a second material.
 *
 * The merge is still one geometry per LOD tier, so a chunk is still one draw
 * call, but every vertex now also carries the index of the rigid part it
 * belongs to. That single float is what lets a shader put the part where a
 * cycle says it should be instead of where the rest pose left it, and it costs
 * four bytes per vertex of shared geometry rather than anything per member.
 *
 * Passing `bake` additionally bakes the model's whole repertoire
 * ({@link bakeFormationCycle}); a model that declares no gait, or carries no
 * skeleton to move, returns a null cycle and renders exactly as before.
 * The generated model's original geometries/skeletons are temporary extraction
 * inputs and retire after successful merge/bake; materials and emitted tables
 * transfer to the returned representation. Refusal independently rolls back
 * all acquisitions that this child completed before its parent receives a result.
 *
 * @evidence contracts/common.md#principled-implementation Builds the declared model, captures rigid world-rest part order, merges buffers before optional canonical gait bake and returns matching part/cycle identity; admitted rigid source and valid rest matrices are premises, and no skeleton/gait or unrequested bake produces null rather than synthetic motion.
 * @evidence contracts/common.md#clear-and-simple-design Owns the generated-source-to-resident representation transaction; lower rigid flattening borrows materials, while this owner transfers those generated materials and retires temporary source geometries/skeletons without another material clone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual recipe/gaits and canonical geometry-before-bake order with no source-id exception or replaced native methods; failed children release their own unreturned work instead of shifting hidden leaks to the parent runtime.
 * @evidence contracts/common.md#meaningful-documentation Gives source/generated material ownership, affine part indexing, optional bake/null semantics and temporary/source versus transferred geometry/table lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Adds source-resource snapshot and temporary identity collection around model build, V-vertex rigid merge and G*S*P bake work; peak storage includes generated and flattened geometry plus temporary clones/tables, not anonymous formation-member buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Transfers generated source material objects directly and reuses canonical build/flatten/bake routines; separate prototype requests remain independent mutable owner transactions, while the parent shares a returned tier across chunks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This child owns generated source geometry/material/skeleton resources and any completed merged geometry until success; refusal independently retires them and later bake refusal rolls its own take textures back. Success retires temporary source geometry/skeletons and transfers merged geometry/material/tables; temporary-release failure retires all otherwise transferable resources before refusing.
 */
export const flattenInstancedModel: (model: IAutoMovieModel, owner?: string, bake?: Pick<IBakeFormationCycleProps, "samples">) => IAutoMovieInstancedModelRepresentation = (
  model: IAutoMovieModel,
  owner: string = `Instanced runtime model "${model.id}"`,
  bake?: Pick<IBakeFormationCycleProps, "samples">,
): IAutoMovieInstancedModelRepresentation => {
  const built: ReturnType<typeof buildModel> = buildModel(model);
  const sourceResources: readonly { dispose(): void }[] = collectAutoMovieOwnedResources(built.object);
  const temporary: Set<THREE.BufferGeometry | THREE.Skeleton> = new Set();
  built.object.traverse((object: THREE.Object3D): void => {
    if (!(object instanceof THREE.Mesh)) return;
    temporary.add(object.geometry);
    if (object instanceof THREE.SkinnedMesh) temporary.add(object.skeleton);
  });
  let representation: IAutoMovieInstancedGeometry | undefined;
  let cycle: IAutoMovieFormationCycle | null = null;
  try {
  built.object.updateMatrixWorld(true);
  const parts: ReturnType<typeof instancedModelParts> = instancedModelParts(built.object);
  representation = flattenRigidParts(parts, owner);
  // Geometry first, then the bake: baking poses the built object, and the
  // flattened vertices above are the rest-space ones the bake's matrices are
  // measured against.
  cycle = bake === undefined
        ? null
        : bakeFormationCycle({
            model,
            built,
            parts,
            samples: bake.samples,
          });
  } catch (error) {
    const skeletons: THREE.Skeleton[] = [...temporary].filter((resource: THREE.BufferGeometry | THREE.Skeleton): resource is THREE.Skeleton => resource instanceof THREE.Skeleton);
    reportAutoMovieResourceRetirement([
      ...sourceResources.map((resource: { dispose(): void }): (() => void) => (): void => resource.dispose()),
      ...skeletons.map((resource: THREE.Skeleton): (() => void) => (): void => resource.dispose()),
      ...(representation === undefined ? [] : [(): void => representation!.geometry.dispose()]),
    ], { error });
    throw error;
  }
  try {
    reportAutoMovieResourceRetirement(
      [...temporary].map((resource: THREE.BufferGeometry | THREE.Skeleton): (() => void) => (): void => resource.dispose()),
    );
  } catch (error) {
    const transferred: Set<{ dispose(): void }> = new Set([
      representation!.geometry,
      ...representation!.materials,
      ...(cycle === null ? [] : [...cycle.takes.values()].map((take: IAutoMovieFormationCycleTake): THREE.Texture => take.texture)),
    ]);
    reportAutoMovieResourceRetirement([
      ...[...transferred].map((resource: { dispose(): void }): (() => void) => (): void => resource.dispose()),
    ], { error });
    throw error;
  }
  return { ...representation!, cycle };
};
