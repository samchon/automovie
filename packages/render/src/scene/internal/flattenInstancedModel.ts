import type { IAutoMovieModel } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind";
import type { IAutoMovieRenderFormationCycle } from "../IAutoMovieRenderFormationCycle";
import type { IAutoMovieRenderFormationCycleTake } from "../IAutoMovieRenderFormationCycleTake";
import type { IAutoMovieInstancedGeometry } from "../IAutoMovieInstancedGeometry";
import type { IAutoMovieInstancedModelRepresentation } from "../IAutoMovieInstancedModelRepresentation";
import type { IAutoMovieRenderBakeFormationCycleProps } from "../IAutoMovieRenderBakeFormationCycleProps";
import { bakeFormationCycle } from "./bakeFormationCycle";
import { AutoMovieRenderSceneLayout } from "../AutoMovieRenderSceneLayout";
import { collectOwnedResources } from "./collectOwnedResources";
import { flattenRigidParts } from "./flattenRigidParts";
import { instancedModelParts } from "./instancedModelParts";
import { reportResourceRetirement } from "./reportResourceRetirement";

/*
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
 * (bakeFormationCycle); a model that declares no gait, or carries no
 * skeleton to move, returns a null cycle and renders exactly as before. The
 * generated model's original geometries/skeletons are temporary extraction
 * inputs and retire after successful merge/bake; materials and emitted tables
 * transfer to the returned representation. Refusal independently rolls back all
 * acquisitions that this child completed before its parent receives a result.
 */
export const flattenInstancedModel: (
  model: IAutoMovieModel,
  owner?: string,
  bake?: Pick<IAutoMovieRenderBakeFormationCycleProps, "samples" | "takes">,
) => IAutoMovieInstancedModelRepresentation = (
  model: IAutoMovieModel,
  owner: string = `Instanced runtime model "${model.id}"`,
  bake?: Pick<IAutoMovieRenderBakeFormationCycleProps, "samples" | "takes">,
): IAutoMovieInstancedModelRepresentation => {
  const built: ReturnType<typeof AutoMovieRenderSceneLayout.buildModel> = AutoMovieRenderSceneLayout.buildModel(model);
  const sourceResources: readonly { dispose(): void }[] =
    collectOwnedResources(built.object);
  const temporary: Set<THREE.BufferGeometry | THREE.Skeleton> = new Set();
  built.object.traverse((object: THREE.Object3D): void => {
    if (!AutoMovieRenderThreeKind.isMesh(object)) return;
    temporary.add(object.geometry);
    if (AutoMovieRenderThreeKind.isSkinnedMesh(object))
      temporary.add(object.skeleton);
  });
  let representation: IAutoMovieInstancedGeometry | undefined;
  let cycle: IAutoMovieRenderFormationCycle | null = null;
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
    reportResourceRetirement(
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
    reportResourceRetirement(
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
            (take: IAutoMovieRenderFormationCycleTake): THREE.Texture => take.texture,
          )),
    ]);
    reportResourceRetirement(
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
