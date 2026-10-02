import {
  Quaternion,
  builtEnvironmentBuildingCensus,
  instanceSlot,
  lowerBuiltEnvironment,
  materializeCompiledInstanceSet,
  srgbHexToLinearColor,
  tessellateToMesh,
} from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type State, initialState } from "../house/assembly";
import { auditHouse } from "../house/audit";
import { buildHouse } from "../house/build";
import type { auditCanopy } from "../house/canopy-audit";
import { pvCellTexture } from "../house/canopy-finish";
import { observations } from "../house/observations";
import { passageClearance } from "../house/passage-clearance";
import { materialFrameQuestions } from "../materials/007-observation";
import { makeTextureAssets } from "../materials/generate-textures.cjs";
import type { MaterialTextureScaleAudit } from "../materials/observation";
import { instancePaletteReference } from "./instance-palette";

// The deterministic texels are prepared once; each state receives the same
// native image resources and the same declared material references.
const finishTextures = makeTextureAssets();

type ViewerPlacement = {
  node: string;
  model: string;
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  scale: IAutoMovieVector3;
  palette?: IAutoMovieColor;
  paletteReference?: IAutoMovieColor;
  traits?: Record<string, number>;
};

/** Resolve the actual library producer through the public engine for display. */
export function createViewerPayload(state: State = initialState) {
  let canopyAudit: ReturnType<typeof auditCanopy> | undefined;
  let materialTextureScaleAudit: MaterialTextureScaleAudit | undefined;
  const environment = buildHouse(
    state,
    (result) => {
      canopyAudit = result;
    },
    (result) => {
      materialTextureScaleAudit = result;
    },
  );
  const audit = auditHouse(environment);
  if (audit.errors.length) throw new Error(audit.errors.join("\n"));
  const lowered = lowerBuiltEnvironment(environment);
  const models = environment.models.map((model) => {
    if (model.skeleton || model.asset)
      throw new Error(
        model.id + ": this static house viewer requires generated rigid parts",
      );
    return {
      id: model.id,
      materials: model.materials,
      parts: model.parts.map((part) => {
        if (part.attachedBone)
          throw new Error(model.id + "/" + part.id + ": rigid part required");
        return {
          id: part.id,
          material: part.material,
          transform: part.transform,
          mesh:
            part.geometry.type === "mesh"
              ? part.geometry.mesh
              : tessellateToMesh(part.geometry.shape),
        };
      }),
    };
  });
  const placements: ViewerPlacement[] = (lowered.set ?? []).map((entry) => ({
    ...entry,
    rotation:
      entry.rotation ??
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, entry.facingDeg ?? 0),
    scale:
      typeof entry.scale === "number"
        ? { x: entry.scale, y: entry.scale, z: entry.scale }
        : (entry.scale ?? { x: 1, y: 1, z: 1 }),
  }));
  for (const design of lowered.instanceSets ?? []) {
    // No route world is supplied by this library. A route-bound set is rejected
    // by the public compiler rather than guessed from architectural connectors.
    const compiled = materializeCompiledInstanceSet({
      instanceSet: design,
      world: { routes: [] },
    });
    for (let index = 0; index < compiled.count; index++) {
      const member = instanceSlot(compiled, index);
      if (member.visible === false) continue;
      const selectedModel = environment.models.find(
        (model) => model.id === member.modelRecipe,
      );
      if (!selectedModel)
        throw Error(member.node + ": unresolved model " + member.modelRecipe);
      const paletteReference = instancePaletteReference(
        selectedModel.materials,
        member.traits,
        `${member.node}/${member.modelRecipe}`,
      );
      placements.push({
        node: member.node,
        model: member.modelRecipe,
        position: member.position,
        palette: srgbHexToLinearColor(member.palette),
        traits: member.traits,
        ...(paletteReference ? { paletteReference } : {}),
        rotation:
          member.rotation ??
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, member.facingDeg),
        scale: member.scale3 ?? {
          x: member.scale,
          y: member.scale,
          z: member.scale,
        },
      });
    }
  }
  for (const placement of placements)
    if (!models.some((model) => model.id === placement.model))
      throw new Error(placement.node + ": unresolved model " + placement.model);
  const clearance = passageClearance({ environment, models, placements });
  const stations = observations(environment, canopyAudit);
  return {
    environment,
    models,
    placements,
    audit,
    canopyAudit,
    materialTextureScaleAudit,
    state,
    clearance,
    textures: [pvCellTexture(), ...finishTextures],
    census: builtEnvironmentBuildingCensus(environment),
    stations,
    materialFrameQuestions: materialFrameQuestions(stations),
    // This is renderer transport, not a clearance report or persisted project.
    observationBasis:
      "Current environment cells, surfaces, connectors, faces and opening profiles; eye 1.60m, inset 0.25m; failed positions retained. Cylinder clearance and visual verdict are separate.",
  };
}
