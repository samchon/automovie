/** Assemble authored building fillings for the live viewer. */
import { linearColorToSrgbHex } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { ArchitecturalFitout } from "../instances/ArchitecturalFitout";
import { Baseboards } from "../instances/Baseboards";
import { ExteriorDoorFills } from "../instances/ExteriorDoorFills";
import { ExteriorRepetition } from "../instances/ExteriorRepetition";
import { ExteriorEdges } from "../instances/ExteriorEdges";
import { InteriorDoorFills } from "../instances/InteriorDoorFills";
import { FixedLightFixtures } from "../instances/FixedLightFixtures";
import { OpeningWindowFills } from "../instances/OpeningWindowFills";
import { buildingModelFinish } from "../materials/buildingModelFinish";
import type { IHouse } from "../spaces/IHouse";
import type { IViewerModelInputs } from "./IViewerModelInputs";
import type { Face } from "../geometry/Face";
import type { Instance } from "../instances/Instance";
import type { Model } from "../instances/Model";
import type { FittingBuilt } from "../models/furnishings/FittingBuilt";
import type { HouseFinish } from "../materials/HouseFinish";

/**
 * Build fresh authored model prototypes, world-metre placements and per-face finishes for the house viewer.
 *
 * environment and house must describe the same building. The optional inspection pose opens windows, exterior doors and fixed fit-out; maximum-opposite selects the opposite fit-out limit while interior doors retain their maximum pose. Baseboards consume the built fit-out and door placements to derive their exclusions. Every model part must have a face binding, and unresolved finish or producer failures propagate.
 *
 * Prototype/instance order follows the listed owners. Finish records use model/face keys and repeated keys overwrite, assuming those faces have one authored finish. Work includes every producer's geometry and baseboard scans, plus a pass over prototype parts; results are rebuilt on each call and owned by the consumer. This function acquires no browser or GPU resources and does not establish visual acceptance.
 */
export function buildBuildingInputs(
  environment: IAutoMovieBuiltEnvironment,
  house: IHouse,
  inspectionPose?: "closed" | "maximum" | "maximum-opposite",
): IViewerModelInputs {
  const maximum: boolean = inspectionPose !== undefined && inspectionPose !== "closed";
  const windows: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "frame" | "sash" | "mullion" | "muntin" | "glass" | "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing">>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new OpeningWindowFills().build(environment, maximum);
  const interiorDoors: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "jamb-a" | "jamb-b" | "jamb-core" | "casing-a" | "casing-b" | "leaf" | "leaf-panel" | "handle" | "hinge">>; hingePivot: readonly [number, number, number]; angle: number; clearWidth: number; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new InteriorDoorFills().build(
    environment,
    inspectionPose === "maximum-opposite" ? "maximum" : inspectionPose,
  );
  const exteriorDoors: { prototypes: ({ model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, Face>>; } | { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "sash" | "glass" | "exterior-trim" | "leaf-panel" | "jamb" | "leaf-exterior" | "leaf-interior" | "panel-edge" | "rail">>; joints: readonly Readonly<{ z: number; y: number; }>[]; } | { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "leaf-panel" | "handle" | "hinge" | "gate-batten">>; })[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new ExteriorDoorFills().build(environment, maximum);
  const repetition: ExteriorRepetition = new ExteriorRepetition();
  const siding: { models: Model[]; instances: Instance[]; } = repetition.buildSiding(house);
  const shingles: { models: Model[]; instances: Instance[]; } = repetition.buildShingles(house);
  const edges: ExteriorEdges = new ExteriorEdges();
  const cornerTrim: { models: Model[]; instances: Instance[]; } = edges.buildCornerTrim();
  const ridgeCaps: { models: Model[]; instances: Instance[]; } = edges.buildRidgeCaps();
  const gutters: { models: Model[]; instances: Instance[]; } = edges.buildGutters(house);
  const fitout: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new ArchitecturalFitout().build(
    house,
    maximum,
    inspectionPose === "maximum-opposite",
  );
  const lightFixtures: { prototypes: FittingBuilt[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new FixedLightFixtures().build(house);
  const baseboards: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new Baseboards().build(
    house,
    [
      ...fitout.prototypes,
      ...interiorDoors.prototypes,
      ...exteriorDoors.prototypes,
    ],
    [
      ...fitout.instances,
      ...interiorDoors.instances,
      ...exteriorDoors.instances,
    ],
  );
  const prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[] = [
    ...lightFixtures.prototypes,
    ...baseboards.prototypes,
    ...fitout.prototypes,
    ...windows.prototypes,
    ...interiorDoors.prototypes,
    ...exteriorDoors.prototypes,
    ...siding.models,
    ...shingles.models,
    ...cornerTrim.models,
    ...ridgeCaps.models,
    ...gutters.models,
  ];
  const instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[] = [
    ...lightFixtures.instances,
    ...baseboards.instances,
    ...fitout.instances,
    ...windows.instances,
    ...interiorDoors.instances,
    ...exteriorDoors.instances,
    ...siding.instances,
    ...shingles.instances,
    ...cornerTrim.instances,
    ...ridgeCaps.instances,
    ...gutters.instances,
  ];
  const finishes: Record<string, IViewerModelInputs["finishes"][string]> = {};
  for (const { model, faceByPart } of prototypes) {
    for (const part of model.parts) {
      const faceId: string = faceByPart[part.id];
      if (faceId === undefined)
        throw new Error(`model ${model.id}/${part.id} lacks an authored face`);
      const finish: HouseFinish = buildingModelFinish(model.id, faceId);
      const material: import("@automovie/interface").IAutoMovieMaterial = finish.material;
      const hex: string = linearColorToSrgbHex(material.baseColor);
      finishes[`${model.id}/${faceId}`] = {
        color:
          finish.texture === undefined
            ? Number.parseInt(hex.slice(1), 16)
            : 0xffffff,
        roughness: material.roughness,
        metalness: material.metallic,
        transmission: material.transmission,
        ior: material.ior,
        thickness: material.thickness,
        doubleSided: material.doubleSided,
        texture:
          finish.texture === undefined
            ? undefined
            : `/textures/${finish.texture.file}`,
        textureMetres: finish.texture?.metres,
      };
    }
  }
  return { prototypes, instances, finishes };
}
