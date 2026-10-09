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
 * Compile landmark-based coverage for a zero-thickness skin-attached garment.
 * Each document evaluates coverage on its shaped rest skin once. Final Body
 * and Person consumers partition their performed skin by this same field and
 * assign the fabric material to covered triangles instead of keeping a second
 * coincident surface. Shape, pose, sag and the person's shared skin remain the
 * only geometry authority. This basic garment adds no thickness, crease fit,
 * support mechanics or independent cloth shape. Style and colour retain their
 * normal document, editor, save and portable static-material export meaning.
 *
 * @evidence contracts/common.md#principled-implementation Existing landmark coverage and source corner correspondence define a material partition of the same skin; no independent geometry or displaced envelope is solved.
 * @evidence contracts/common.md#clear-and-simple-design One compiled coverage owner returns the fabric material and source fields; final mesh partition stays with the actual performed-skin consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The existing two closed styles use one landmark formula without person constants, contour repairs or renderer depth bias.
 * @evidence contracts/common.md#meaningful-documentation States rest attachment, zero thickness, final consumer ownership and the lack of cloth mechanics.
 * @evidence contracts/modeling.md#part-identity-and-grouping Final consumers retain uncovered skin identities and name the covered fabric region separately.
 * @evidence contracts/modeling.md#parameter-channels Closed style determines coverage and optional linear RGB determines fabric colour; performance changes only the shared skin.
 * @evidence contracts/modeling.md#spatial-conventions Coverage uses source-aligned shaped rest metre coordinates; final performed coordinates are consumed without a second pose transform.
 * @evidence contracts/modeling.md#shared-boundaries Complementary material clipping uses the same original edges and fractions on the actual final skin.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The partition owner decides emitted triangles.
 * @evidenceExclude contracts/modeling.md#rendered-observation Body and Person final consumers own garment observation.
 * @evidence contracts/anatomy.md#anatomical-source Coverage reads the admitted joint and named skin landmarks; costume fractions are conventions rather than clinical measurements.
 * @evidence contracts/anatomy.md#permitted-range Existing coverage refuses absent landmarks and fabric colour must be finite in [0,1], leaving caller-owned data unchanged.
 * @evidence contracts/anatomy.md#parametric-authority Authoring remains a closed style and colour, with no personal mesh or sculpt input.
 */
export function createHumanBodyUnderwear(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodyUnderwear.ITable = HUMAN_BODY_UNDERWEAR,
): (props: IAutoMovieHumanBodyUnderwearProps) => IAutoMovieHumanBodyUnderwearParts {
  if (basis.materials.some((material) => material.id === table.material))
    throw new Error("Body underwear needs an unused material id: " + table.material);
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
