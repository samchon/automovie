/**
 * Viewer payload. Run the actual production producer and public engine lowering
 * once in CJS, forwarding their geometry, placements, spaces and observations.
 * Unbound parts retain null materials. Site ground, curbs and distant ridges
 * arrive as models in the same environment.
 */
import {
  builtEnvironmentBuildingCensus,
  lowerBuiltEnvironment,
  tessellateToMesh,
} from "@automovie/engine";
import type {
  IAutoMovieHeightRule,
  IAutoMovieMesh,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { templeViewerLens } from "../geometry/observation-datum";
import { createTempleBuildingScene } from "../instances/building";
import { addTempleSiteInstances } from "../instances/site";
import { addTempleObjectInstances } from "../instances/objects";
import { bindTempleMaterials } from "../materials/bindings";
import { templeObservations, templeSpaceNames } from "../spaces/observations";

export interface ViewerPart {
  id: string;
  material: string | null;
  mesh: IAutoMovieMesh;
}

export interface ViewerPlacement {
  node: string;
  model: string;
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  scale: IAutoMovieVector3;
}

export const createViewerPayload = () => {
  const environment = bindTempleMaterials(
    addTempleObjectInstances(addTempleSiteInstances(createTempleBuildingScene())),
  );
  const lowered = lowerBuiltEnvironment(environment);
  const models = environment.models.map((model) => ({
    id: model.id,
    name: model.name,
    materials: model.materials,
    parts: model.parts.map((part): ViewerPart => {
      if (part.transform !== null) throw new Error(`${model.id}/${part.id}: part transforms are unsupported by this delivery path.`);
      return {
        id: part.id,
        material: part.material,
        mesh: part.geometry.type === "mesh"
          ? part.geometry.mesh
          : tessellateToMesh(part.geometry.shape),
      };
    }),
  }));
  const placements: ViewerPlacement[] = (lowered.set ?? []).map((entry) => ({
    node: entry.node,
    model: entry.model,
    position: entry.position,
    rotation: entry.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
    scale: typeof entry.scale === "number"
      ? { x: entry.scale, y: entry.scale, z: entry.scale }
      : (entry.scale ?? { x: 1, y: 1, z: 1 }),
  }));
  for (const placement of placements) {
    if (!models.some((m) => m.id === placement.model)) throw new Error(`${placement.node}: missing model ${placement.model}`);
  }
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const triangles = models.reduce((sum, m) => sum + m.parts.reduce((s, part) =>
    s + (part.mesh.indices?.length ?? part.mesh.positions.length / 3) / 3, 0), 0);
  return {
    environmentId: environment.id,
    lens: {
      verticalDegrees: templeViewerLens.verticalDegrees,
      aspect: templeViewerLens.aspect,
      near: templeViewerLens.near,
      far: templeViewerLens.far,
    },
    models,
    placements,
    spaces: environment.spaces.filter((s) => s.cells.length > 0).map((s) => ({
      id: s.id,
      kind: s.kind,
      name: templeSpaceNames[s.id] ?? s.id,
      cellCount: s.cells.length,
    })),
    supports: environment.surfaces.map((entry) => ({
      space: entry.space,
      id: entry.surface.id,
      polygon: entry.surface.polygon,
      holes: entry.surface.holes ?? [],
      plane: supportPlane(entry.surface.id, entry.surface.height),
    })),
    openings: environment.openings.map((o) => ({
      id: o.id,
      kind: o.kind,
      boundary: o.boundary,
      fill: o.fill,
    })),
    observations: templeObservations(environment),
    census: {
      facades: census?.facades.length ?? 0,
      corners: census?.corners.length ?? 0,
      roofs: census?.roofs.length ?? 0,
      undersides: census?.undersides.length ?? 0,
      entrances: census?.entrances.length ?? 0,
      spaces: census?.spaces.length ?? 0,
      connectors: census?.connectors.length ?? 0,
      boundaries: environment.boundaries.length,
      openings: environment.openings.length,
      models: models.length,
      triangles,
    },
    notices: [
      "The reviewed material palette is bound to the current building's spatial surfaces and separate members.",
      "The local site contains three neighboring envelopes, two narrow and two broad trees, and six grass tufts along wall bases.",
      "Columns, door leaves, frames, timberwork, tiles and the fountain are placed in the current building scene.",
      "Props in the sanctuary, offering room, administration, records, storage, service yard and courtyard edges use actual support heights.",
      "Lighting is undecided: the systems layer has not begun. The viewer follows the configured daylight direction and elevation (upper front left, 45°), with review defaults for intensity and exposure.",
    ],
  };
};

/** Support height plane for inspection; this delivery path does not use grid heightfields. */
const supportPlane = (id: string, rule: IAutoMovieHeightRule | undefined) => {
  if (rule === undefined) return { origin: 0, slopeX: 0, slopeZ: 0 };
  if (rule.kind === "constant") return {
    origin: rule.value,
    slopeX: 0,
    slopeZ: 0,
  };
  if (rule.kind === "plane") return {
    origin: rule.originHeight,
    slopeX: rule.slopeX,
    slopeZ: rule.slopeZ,
  };
  throw new Error(
    `${id}: grid heightfield supports are unsupported by this delivery path.`,
  );
};

export type ViewerPayload = ReturnType<typeof createViewerPayload>;
