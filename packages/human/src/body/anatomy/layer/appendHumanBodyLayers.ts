import { validateModel } from "@automovie/engine";

import type { IAutoMovieHumanConstructionFailure } from "../../../common/structures/IAutoMovieHumanConstructionFailure";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyLayerExterior } from "./IHumanBodyLayerExterior";
import type { IHumanBodyLayerObservation } from "./IHumanBodyLayerObservation";
import { createHumanBodyLayerConstruction } from "./createHumanBodyLayerConstruction";

/**
 * Complete skin layers on an already placed body or its final person exterior.
 *
 * Standalone construction uses the final posed native skin. A person supplies
 * actual joined physical incidence and native origins; those final coordinates
 * replace only the layer's query input, not the person's document or body pose.
 * No layer receives the body's root placement again. Legacy absence returns
 * the original build without changing bytes or claiming layer observations.
 * A composing person supplies its own document instance so two people that
 * reuse one body document do not claim identical physical layer points.
 */
export function appendHumanBodyLayers(
  basis: IAutoMovieHumanBodyBasis,
  build: IAutoMovieHumanBodyBuild,
  exteriors?: ReadonlyMap<string, IHumanBodyLayerExterior>,
  instance?: string,
): IAutoMovieHumanBodyBuild {
  if (build.layerObservations !== undefined)
    throw new Error("Body skin layers have already been completed.");
  const parts = build.model.parts.slice();
  const materials = build.model.materials.slice();
  const observations: IHumanBodyLayerObservation[] = [];
  const failures: IAutoMovieHumanConstructionFailure[] = [];
  for (const [index, surface] of basis.surfaces.entries()) {
    const field = surface.layerThickness;
    if (field === undefined) continue;
    const exterior = exteriors?.get(surface.id);
    if (exteriors !== undefined && exterior === undefined)
      throw new Error("Final layer exterior missing for native surface: " + surface.id);
    const material = build.model.materials.find((finish) => finish.id === surface.regions[0].material);
    if (material === undefined)
      throw new Error("Native layer inspection needs the resident source skin finish: " + surface.id);
    const layer = createHumanBodyLayerConstruction({
      basis: basis.id,
      surface: surface.id,
      instance: instance ?? build.evaluatedDocument.id,
      material,
      positions: exterior === undefined ? build.posedSurfaces[index].positions :
        exterior.originVertices.flatMap((vertex) => exterior.mesh.positions.slice(vertex * 3, vertex * 3 + 3)),
      indices: surface.indices,
      field,
      exterior,
      nativeSource: basis.anatomicalAssembly?.nativeSubcutaneous?.surface === surface.id
        ? basis.anatomicalAssembly.nativeSubcutaneous : undefined,
    });
    parts.push(...layer.parts);
    materials.push(layer.material);
    observations.push(layer.observation);
    failures.push(...layer.admission.failures);
  }
  if (observations.length === 0) return build;
  const model = { ...build.model, parts, materials };
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error("Constructed body skin layers are not a valid resident model: " + JSON.stringify(validation));
  return {
    ...build,
    model,
    layerObservations: observations,
    layerAdmission: { accepted: failures.length === 0, failures },
  };
}
