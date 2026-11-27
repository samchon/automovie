import type { IAutoMovieModel } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "../IAutoMovieFormationCycleTake.js";
import type { IAutoMovieInstancedGeometry } from "../IAutoMovieInstancedGeometry.js";
import type { IAutoMovieInstancedModelRepresentation } from "../IAutoMovieInstancedModelRepresentation.js";
import type { IBakeFormationCycleProps } from "../IBakeFormationCycleProps.js";
import { bakeFormationCycle } from "./bakeFormationCycle.js";
import { buildModel } from "../buildModel.js";
import { collectAutoMovieOwnedResources } from "../collectAutoMovieOwnedResources.js";
import { flattenRigidParts } from "./flattenRigidParts.js";
import { instancedModelParts } from "./instancedModelParts.js";
import { reportAutoMovieResourceRetirement } from "../reportAutoMovieResourceRetirement.js";

/**
 * Flatten one runtime model for a chunked instancing consumer.
 *
 * BuildModel creates this entry's materials; the returned representation hands
 * them to the consumer along with the owned merged geometry. Lower-level
 * flattening retains those objects rather than allocating a second material.
 *
 * The merge produces one geometry per LOD tier with a group and retained
 * material for each source part, so one chunk can require several renderer
 * submissions. Every vertex also carries a Float32 rigid-part index for the
 * cycle shader, costing four bytes per vertex of shared geometry rather than
 * per member; actual submission counts belong to renderer observation.
 *
 * Passing `bake` additionally bakes the model's whole repertoire
 * ({@link bakeFormationCycle}); a model that declares no gait, or carries no
 * skeleton to move, returns a null cycle and renders exactly as before. The
 * generated model's original geometries/skeletons are temporary extraction
 * inputs and retire after successful merge/bake; materials and emitted tables
 * transfer to the returned representation. Refusal independently rolls back all
 * acquisitions that this child completed before its parent receives a result.
 */
export const flattenInstancedModel: (
  model: IAutoMovieModel,
  owner?: string,
  bake?: Pick<IBakeFormationCycleProps, "samples" | "takes">,
) => IAutoMovieInstancedModelRepresentation = (
  model: IAutoMovieModel,
  owner: string = `Instanced runtime model "${model.id}"`,
  bake?: Pick<IBakeFormationCycleProps, "samples" | "takes">,
): IAutoMovieInstancedModelRepresentation => {
  const built: ReturnType<typeof buildModel> = buildModel(model);
  const sourceResources: readonly { dispose(): void }[] =
    collectAutoMovieOwnedResources(built.object);
  const temporary: Set<THREE.BufferGeometry | THREE.Skeleton> = new Set();
  built.object.traverse((object: THREE.Object3D): void => {
    if (!AutoMovieThreeKind.isMesh(object)) return;
    temporary.add(object.geometry);
    if (AutoMovieThreeKind.isSkinnedMesh(object))
      temporary.add(object.skeleton);
  });
  let representation: IAutoMovieInstancedGeometry | undefined;
  let cycle: IAutoMovieFormationCycle | null = null;
  try {
    built.object.updateMatrixWorld(true);
    const parts: ReturnType<typeof instancedModelParts> = instancedModelParts(
      built.object,
    );
    representation = flattenRigidParts(parts, owner);
    // Geometry first, then the bake: baking poses the built object, and the
    // flattened vertices above are the rest-space ones the bake's matrices are
    // measured against.
    cycle =
      bake === undefined
        ? null
        : bakeFormationCycle({
            model,
            built,
            parts,
            samples: bake.samples,
            ...(bake.takes === undefined ? {} : { takes: bake.takes }),
          });
  } catch (error) {
    // The source collection already holds the skinned meshes' skeletons.
    reportAutoMovieResourceRetirement(
      [
        ...sourceResources.map(
          (resource: { dispose(): void }): (() => void) =>
            (): void =>
              resource.dispose(),
        ),
        ...(representation === undefined
          ? []
          : [(): void => representation!.geometry.dispose()]),
      ],
      { error },
    );
    throw error;
  }
  try {
    reportAutoMovieResourceRetirement(
      [...temporary].map(
        (resource: THREE.BufferGeometry | THREE.Skeleton): (() => void) =>
          (): void =>
            resource.dispose(),
      ),
    );
  } catch (error) {
    const transferred: Set<{ dispose(): void }> = new Set([
      representation!.geometry,
      ...representation!.materials,
      ...(cycle === null
        ? []
        : [...cycle.takes.values()].map(
            (take: IAutoMovieFormationCycleTake): THREE.Texture => take.texture,
          )),
    ]);
    reportAutoMovieResourceRetirement(
      [
        ...[...transferred].map(
          (resource: { dispose(): void }): (() => void) =>
            (): void =>
              resource.dispose(),
        ),
      ],
      { error },
    );
    throw error;
  }
  return { ...representation!, cycle };
};
