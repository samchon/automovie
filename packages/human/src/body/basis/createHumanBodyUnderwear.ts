import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { HUMAN_BODY_UNDERWEAR } from "../constants/HUMAN_BODY_UNDERWEAR";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyUnderwear } from "../structures/IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearParts } from "../structures/IAutoMovieHumanBodyUnderwearParts";
import type { IAutoMovieHumanBodyUnderwearProps } from "../structures/IAutoMovieHumanBodyUnderwearProps";
import { createHumanBodyUnderwearCoverage } from "./createHumanBodyUnderwearCoverage";
import { humanBodyGpuRegion } from "./humanBodyGpuRegion";

/**
 * Compile landmark-based rest coverage and the costume's normal lift.
 * Each document evaluates coverage on its shaped rest skin once. Final Body
 * and Person consumers cut their performed skin by this same field and lift
 * independent fabric there. Shape, pose, sag and the person's shared skin
 * remain the geometry authority. The conventional normal offset restores the
 * r16 costume representation without fitting or cloth dynamics. Style and colour retain their
 * normal document, editor, save and portable static-material export meaning.
 */
export function createHumanBodyUnderwear(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodyUnderwear.ITable = HUMAN_BODY_UNDERWEAR,
): (props: IAutoMovieHumanBodyUnderwearProps) => IAutoMovieHumanBodyUnderwearParts {
  if (basis.materials.some((material) => material.id === table.material))
    throw new Error("Body underwear needs an unused material id: " + table.material);
  if (!Number.isFinite(table.offsetMetres))
    throw new Error("Body underwear needs a finite normal lift in metres.");
  const uncovered = new Set<AutoMovieHumanoidBone>(table.uncovered);
  for (const joint of basis.joints)
    if (joint.parent !== null && uncovered.has(joint.parent)) uncovered.add(joint.bone);
  const arms = basis.surfaces.map((surface) => {
    const weights = new Array<number>(surface.positions.length / 3).fill(0);
    weights.forEach((_, vertex) => {
      for (let corner = 0; corner < 4; corner++)
        if (uncovered.has(surface.skin.joints[surface.skin.boneIndices[vertex * 4 + corner]]))
          weights[vertex] += surface.skin.weights[vertex * 4 + corner];
    });
    return weights;
  });
  const regions = basis.surfaces.flatMap((surface, index) => surface.regions.map((region) => ({
    id: region.id, surface: index,
    sources: humanBasisRegionCorners(humanBodyGpuRegion(region)).sources,
  })));
  return ({ underwear, rest }) => {
    const color = underwear.color ?? table.color;
    if (![color.r, color.g, color.b].every((value) => Number.isFinite(value) && value >= 0 && value <= 1))
      throw new Error("Body underwear needs finite linear RGB in [0,1].");
    const coverage = createHumanBodyUnderwearCoverage({ table, style: underwear.style, basis, rest });
    const sourceFields = rest.surfaces.map((positions, surface) => {
      const canonical = new Map<number, number>();
      const samples = basis.surfaces[surface].sourcePartition?.samples;
      return arms[surface].map((arm, vertex) => {
        const sample = samples?.[vertex] ?? vertex;
        let value = canonical.get(sample);
        if (value === undefined) {
          value = coverage(positions[vertex * 3], positions[vertex * 3 + 1], positions[vertex * 3 + 2], arm);
          canonical.set(sample, value);
        }
        return value;
      });
    });
    if (sourceFields.some((field) => !field.every(Number.isFinite)))
      throw new Error("Body underwear coverage is not finite on its actual shaped rest skin.");
    return {
      offsetMetres: table.offsetMetres,
      sourceFields,
      regions: new Map(regions.map((region) => [region.id, {
        surface: region.surface, sources: region.sources,
        field: region.sources.map((source) => sourceFields[region.surface][source]),
      }])),
      material: {
        id: table.material, name: table.material,
        baseColor: { ...color, a: 1, hex: null }, metallic: 0,
        roughness: table.roughness, emissive: null, opacity: 1,
        baseColorTexture: null, doubleSided: true,
      },
    };
  };
}
