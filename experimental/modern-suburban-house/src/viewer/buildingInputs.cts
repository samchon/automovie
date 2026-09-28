/** Assemble authored building fillings for the live viewer. */
import { linearColorToSrgbHex } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { InteriorDoorFills } from "../instances/interior-door-fills";
import { ArchitecturalFitout } from "../instances/architectural-fitout";
import { Baseboards } from "../instances/baseboards";
import { FixedLightFixtures } from "../instances/lighting-fixtures";
import { ExteriorDoorFills } from "../instances/exterior-door-fills";
import { ExteriorRepetition } from "../instances/exterior-repetition";
import { ExteriorEdges } from "../instances/exterior-repetition-edges";
import { OpeningWindowFills } from "../instances/opening-fills";
import { buildingModelFinish } from "../materials/model-bindings";
import type { IHouse } from "../spaces/house";
import type { IViewerModelInputs } from "./modelScene.cjs";

/** The viewer consumes model, placement and finish owners without authoring them. */
export function buildBuildingInputs(
  environment: IAutoMovieBuiltEnvironment,
  house: IHouse,
): IViewerModelInputs {
  const windows = new OpeningWindowFills().build(environment);
  const interiorDoors = new InteriorDoorFills().build(environment);
  const exteriorDoors = new ExteriorDoorFills().build(environment);
  const repetition = new ExteriorRepetition();
  const siding = repetition.buildSiding(house);
  const shingles = repetition.buildShingles(house);
  const edges = new ExteriorEdges();
  const cornerTrim = edges.buildCornerTrim();
  const ridgeCaps = edges.buildRidgeCaps();
  const gutters = edges.buildGutters(house);
  const fitout = new ArchitecturalFitout().build(house);
  const lightFixtures=new FixedLightFixtures().build(house);
  const baseboards = new Baseboards().build(house,[...fitout.prototypes,...interiorDoors.prototypes,...exteriorDoors.prototypes],[...fitout.instances,...interiorDoors.instances,...exteriorDoors.instances]);
  const prototypes = [
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
  const instances = [
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
      const faceId = faceByPart[part.id];
      if (faceId === undefined)
        throw new Error(`model ${model.id}/${part.id} lacks an authored face`);
      const finish = buildingModelFinish(model.id, faceId);
      const material = finish.material;
      const hex = linearColorToSrgbHex(material.baseColor);
      finishes[`${model.id}/${faceId}`] = {
        color: finish.texture === undefined ? Number.parseInt(hex.slice(1), 16) : 0xffffff,
        roughness: material.roughness,
        metalness: material.metallic,
        transmission: material.transmission,
        ior: material.ior,
        thickness: material.thickness,
        doubleSided: material.doubleSided,
        texture: finish.texture === undefined ? undefined : `/textures/${finish.texture.file}`,
        textureMetres: finish.texture?.metres,
      };
    }
  }
  return { prototypes, instances, finishes };
}
