import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IAutoMovieHumanConstructionFailure } from "../../../common/structures/IAutoMovieHumanConstructionFailure";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyLayerThicknessField } from "./IAutoMovieHumanBodyLayerThicknessField";
import type { IHumanBodyLayerConstruction } from "./IHumanBodyLayerConstruction";
import type { IHumanBodyLayerExterior } from "./IHumanBodyLayerExterior";
import type { IHumanBodyLayerObservation } from "./IHumanBodyLayerObservation";
import { createHumanBodyLayerConstruction } from "./createHumanBodyLayerConstruction";

/**
 * Complete skin layers on an already placed body or its final person exterior.
 *
 * Standalone construction uses the final posed native skin. A person supplies actual joined physical incidence and native origins; those final coordinates replace only the layer's query input, not the person's document or body pose. No layer receives the body's root placement again. Legacy absence returns the original build without changing bytes or claiming layer observations. A composing person supplies its own document instance so two people that reuse one body document do not claim identical physical layer points.
 *
 * @evidence contracts/common.md#principled-implementation Actual final posed/native origins feed one layer construction per supplied field, then appended static parts pass resident-model admission without repeating root placement.
 * @evidence contracts/common.md#clear-and-simple-design The body/person completion owner delegates offsets/shells while collecting observations, failures and actual materials into a new build.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent fields preserve the original build, repeated completion refuses, and composed people retain distinct physical instance identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states final-frame inputs, joined incidence, legacy omission and no duplicate placement.
 * @evidence contracts/performance.md#efficient-algorithms Surface/material lookup plus owned layer construction and final model validation drive work; output arrays scale with existing and appended parts, and fieldless sources return the original build.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing build parts/material records are reused in new arrays; each source field constructs once for this final exterior, with no stale posed-layer cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Partial arrays/observations are call-local and discarded on failure; only completed builds escape and original builds remain unchanged.
 */
export function appendHumanBodyLayers(
  basis: IAutoMovieHumanBodyBasis,
  build: IAutoMovieHumanBodyBuild,
  exteriors?: ReadonlyMap<string, IHumanBodyLayerExterior>,
  instance?: string,
): IAutoMovieHumanBodyBuild {
  if (build.layerObservations !== undefined)
    throw new Error("Body skin layers have already been completed.");
  const parts: IAutoMovieModelPart[] = build.model.parts.slice();
  const materials: IAutoMovieMaterial[] = build.model.materials.slice();
  const observations: IHumanBodyLayerObservation[] = [];
  const failures: IAutoMovieHumanConstructionFailure[] = [];
  for (const [index, surface] of basis.surfaces.entries()) {
    const field: IAutoMovieHumanBodyLayerThicknessField | undefined =
      surface.layerThickness;
    if (field === undefined) continue;
    const exterior: IHumanBodyLayerExterior | undefined = exteriors?.get(
      surface.id,
    );
    if (exteriors !== undefined && exterior === undefined)
      throw new Error(
        "Final layer exterior missing for native surface: " + surface.id,
      );
    const material: IAutoMovieMaterial | undefined = build.model.materials.find(
      (finish: IAutoMovieMaterial): boolean =>
        finish.id === surface.regions[0].material,
    );
    if (material === undefined)
      throw new Error(
        "Native layer inspection needs the resident source skin finish: " +
          surface.id,
      );
    const layer: IHumanBodyLayerConstruction = createHumanBodyLayerConstruction(
      {
        basis: basis.id,
        surface: surface.id,
        instance: instance ?? build.evaluatedDocument.id,
        material,
        positions:
          exterior === undefined
            ? build.posedSurfaces[index].positions
            : exterior.originVertices.flatMap((vertex: number): number[] =>
                exterior.mesh.positions.slice(vertex * 3, vertex * 3 + 3),
              ),
        indices: surface.indices,
        field,
        exterior,
        nativeSource:
          basis.anatomicalAssembly?.nativeSubcutaneous?.surface === surface.id
            ? basis.anatomicalAssembly.nativeSubcutaneous
            : undefined,
      },
    );
    parts.push(...layer.parts);
    materials.push(layer.material);
    observations.push(layer.observation);
    failures.push(...layer.admission.failures);
  }
  if (observations.length === 0) return build;
  const model: IAutoMovieModel = { ...build.model, parts, materials };
  const validation: ReturnType<typeof validateModel> = validateModel({ model });
  if (!validation.success)
    throw new Error(
      "Constructed body skin layers are not a valid resident model: " +
        JSON.stringify(validation),
    );
  return {
    ...build,
    model,
    layerObservations: observations,
    layerAdmission: { accepted: failures.length === 0, failures },
  };
}
