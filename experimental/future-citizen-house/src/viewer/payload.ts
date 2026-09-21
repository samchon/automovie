import { lowerBuiltEnvironment, tessellateToMesh, materializeCompiledInstanceSet, instanceSlot, Quaternion, builtEnvironmentBuildingCensus, builtSpaceObservationStations, srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieLibraryBuildContext, IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieColor } from "@automovie/interface";
import { citizenHouseSpaceSource } from "../spaces/citizen-house";

type ViewerPlacement = {
  node: string; model: string; position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3;
  palette?: IAutoMovieColor; traits?: Record<string, number>;
};

/** Resolve the actual library producer through the public engine for display. */
export function createViewerPayload() {
  const context: IAutoMovieLibraryBuildContext = {
    production: "future-citizen-house", branch: "spaces",
    design: "docs/spaces/001-citizen-house.md", anchor: "citizen-house-space",
    derivedArtifacts: {},
  };
  const contribution = citizenHouseSpaceSource.build(context);
  const environment = contribution.environments[0];
  if (!environment) throw new Error("citizenHouseSpaceSource returned no environment");
  const lowered = lowerBuiltEnvironment(environment);
  const models = environment.models.map((model) => {
    if (model.skeleton || model.asset) throw new Error(model.id + ": this static house viewer requires generated rigid parts");
    return {
      id: model.id,
      materials: model.materials,
      parts: model.parts.map((part) => {
        if (part.attachedBone) throw new Error(model.id + "/" + part.id + ": rigid part required");
        return {
          id: part.id, material: part.material, transform: part.transform,
          mesh: part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape),
        };
      }),
    };
  });
  const placements: ViewerPlacement[] = (lowered.set ?? []).map((entry) => ({
    ...entry,
    rotation: entry.rotation ?? Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, entry.facingDeg ?? 0),
    scale: typeof entry.scale === "number" ? { x: entry.scale, y: entry.scale, z: entry.scale } : entry.scale ?? { x: 1, y: 1, z: 1 },
  }));
  for (const design of lowered.instanceSets ?? []) {
    // No route world is supplied by this library. A route-bound set is rejected
    // by the public compiler rather than guessed from architectural connectors.
    const compiled = materializeCompiledInstanceSet({ instanceSet: design, world: { routes: [] } });
    for (let index = 0; index < compiled.count; index++) {
      const member = instanceSlot(compiled, index);
      if (member.visible === false) continue;
      placements.push({
        node: member.node, model: member.modelRecipe, position: member.position,
        palette: srgbHexToLinearColor(member.palette), traits: member.traits,
        rotation: member.rotation ?? Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, member.facingDeg),
        scale: member.scale3 ?? { x: member.scale, y: member.scale, z: member.scale },
      });
    }
  }
  for (const placement of placements)
    if (!models.some((model) => model.id === placement.model))
      throw new Error(placement.node + ": unresolved model " + placement.model);
  return {
    environment, models, placements,
    census: builtEnvironmentBuildingCensus(environment),
    stations: environment.spaces.flatMap((space) => builtSpaceObservationStations(environment, space.id).map((station) => ({ ...station, space: space.id }))),
    // This is renderer transport, not a clearance report or persisted project.
    observationBasis: "Engine diagnostic stations; production eye/inset and complete exterior/reference observations remain unverified.",
  };
}
