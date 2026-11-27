import { AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieShot } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";

/**
 * Apply an admitted shot's practical surface cues to built prop instances.
 *
 * Before drawing a frame of the shot, call this with its shot-local seconds in
 * [0, duration). Resolve scene node ids to the distinct model objects mounted
 * for those placements, for example by keeping the results supplied to
 * buildScene. Resolve each model-scoped material id to a prepared, geometry-
 * compatible material for that node and part. The host can use AutoMovieRenderMaterial.build
 * with its existing texture resolver and retains ownership of those materials
 * and textures. An initial key can select the part's original material by
 * supplying that same reference.
 *
 * This updates only tracked parts. When reusing a mounted scene across shots,
 * restore its staged materials or author opening tracks for parts whose prior
 * shot changed their material.
 *
 * @throws {RangeError} The tracked shot sample is outside its local interval.
 * @throws {Error} A target has no distinct single-material mesh, or its
 *   selected variant is unavailable.
 */
export function applyPracticalSurfaceMaterials(
  shot: IAutoMovieShot,
  seconds: number,
  resolveNode: (node: string) => IAutoMovieModelObject | undefined,
  resolveMaterial: (
    node: string,
    part: string,
    material: string,
  ) => THREE.Material | undefined,
): void {
  if (!shot.practicalSurfaces?.length) return;
  if (seconds < 0 || seconds >= shot.duration)
    throw new RangeError("Practical surface sample must be inside the shot");

  const assignments: Map<THREE.Mesh, THREE.Material> = new Map();
  for (const track of shot.practicalSurfaces) {
    const target: THREE.Object3D | undefined = resolveNode(
      track.node,
    )?.parts.get(track.part);
    if (
      target === undefined ||
      !AutoMovieThreeKind.isMesh(target) ||
      !AutoMovieThreeKind.isMaterial(target.material) ||
      assignments.has(target)
    )
      throw new Error(
        `Practical surface "${track.node}" part "${track.part}" has no distinct single-material mesh`,
      );

    const selected: string = AutoMovieEngineFilm.samplePracticalSurfaceTrackMaterial(
      track,
      seconds,
    );
    const material: THREE.Material | undefined = resolveMaterial(
      track.node,
      track.part,
      selected,
    );
    if (material === undefined)
      throw new Error(
        `Practical surface "${track.node}" part "${track.part}" has no prepared material "${selected}"`,
      );
    assignments.set(target, material);
  }

  for (const [target, material] of assignments) target.material = material;
}
