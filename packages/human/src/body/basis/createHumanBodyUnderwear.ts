import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { HUMAN_BODY_UNDERWEAR } from "../constants/HUMAN_BODY_UNDERWEAR";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyUnderwearParts } from "../structures/IAutoMovieHumanBodyUnderwearParts";
import type { IAutoMovieHumanBodyUnderwearProps } from "../structures/IAutoMovieHumanBodyUnderwearProps";
import type { IAutoMovieHumanBodyUnderwearTable } from "../structures/IAutoMovieHumanBodyUnderwearTable";
import { createHumanBodyUnderwearCoverage } from "./createHumanBodyUnderwearCoverage";
import { humanBodyGpuRegion } from "./humanBodyGpuRegion";

/**
 * Compile landmark-based rest coverage and the costume's normal lift. Each document evaluates coverage on its shaped rest skin once. Final Body and Person consumers cut their performed skin by this same field and lift independent fabric there. Shape, pose, sag and the person's shared skin remain the geometry authority. The conventional normal offset restores the r16 costume representation without fitting or cloth dynamics. Style and colour retain their normal document, editor, save and portable static-material export meaning.
 *
 * @evidence contracts/common.md#principled-implementation Declared landmark coverage evaluates the shaped rest skin and uncovered-bone weights; canonical source samples share one scalar before actual region corners gather that field for final posed cutting.
 * @evidence contracts/common.md#clear-and-simple-design Basis compilation prepares arm weights and region source correspondence, while a document evaluation returns coverage, one material and the finite normal lift to its final skin consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Occupied material identity, nonfinite lift, invalid RGB and nonfinite source coverage refuse; conventional coverage and normal offset supply no cloth fitting, self-contact or clinical guarantee.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes shaped-rest coverage from final performed-skin geometry, source authority, independent fabric and blocking-costume limitations.
 * @evidence contracts/performance.md#efficient-algorithms Preparation walks four influences per vertex and region corners; each request walks rest vertices and gathered corners, with canonical-sample lookups preventing duplicate coverage evaluation within a surface.
 * @evidence contracts/performance.md#reuse-equivalent-work Basis-owned arm weights and corner mapping are reused across documents; each surface's local canonical map shares coverage only among declared equivalent samples in the current rest shape.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains basis/table and compiled weights/corners until unreachable; returned fields/material belong to the consumer, per-request canonical maps expire, and no external resource is acquired.
 */
export function createHumanBodyUnderwear(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodyUnderwearTable = HUMAN_BODY_UNDERWEAR,
): (
  props: IAutoMovieHumanBodyUnderwearProps,
) => IAutoMovieHumanBodyUnderwearParts {
  if (
    basis.materials.some(
      (material: (typeof basis.materials)[number]): boolean =>
        material.id === table.material,
    )
  )
    throw new Error(
      "Body underwear needs an unused material id: " + table.material,
    );
  if (!Number.isFinite(table.offsetMetres))
    throw new Error("Body underwear needs a finite normal lift in metres.");
  const uncovered: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
    table.uncovered,
  );
  for (const joint of basis.joints)
    if (joint.parent !== null && uncovered.has(joint.parent))
      uncovered.add(joint.bone);
  const arms: number[][] = basis.surfaces.map(
    (surface: (typeof basis.surfaces)[number]): number[] => {
      const weights: number[] = new Array<number>(
        surface.positions.length / 3,
      ).fill(0);
      weights.forEach((_: number, vertex: number): void => {
        for (let corner: number = 0; corner < 4; corner++)
          if (
            uncovered.has(
              surface.skin.joints[
                surface.skin.boneIndices[vertex * 4 + corner]
              ],
            )
          )
            weights[vertex] += surface.skin.weights[vertex * 4 + corner];
      });
      return weights;
    },
  );
  const regions: { id: string; surface: number; sources: number[] }[] =
    basis.surfaces.flatMap(
      (
        surface: (typeof basis.surfaces)[number],
        index: number,
      ): { id: string; surface: number; sources: number[] }[] =>
        surface.regions.map(
          (
            region: (typeof surface.regions)[number],
          ): { id: string; surface: number; sources: number[] } => ({
            id: region.id,
            surface: index,
            sources: humanBasisRegionCorners(humanBodyGpuRegion(region))
              .sources,
          }),
        ),
    );
  return ({
    underwear,
    rest,
  }: IAutoMovieHumanBodyUnderwearProps): IAutoMovieHumanBodyUnderwearParts => {
    const color: typeof table.color = underwear.color ?? table.color;
    if (
      ![color.r, color.g, color.b].every(
        (value: number): boolean =>
          Number.isFinite(value) && value >= 0 && value <= 1,
      )
    )
      throw new Error("Body underwear needs finite linear RGB in [0,1].");
    const coverage: ReturnType<typeof createHumanBodyUnderwearCoverage> =
      createHumanBodyUnderwearCoverage({
        table,
        style: underwear.style,
        basis,
        rest,
      });
    const sourceFields: number[][] = rest.surfaces.map(
      (positions: number[], surface: number): number[] => {
        const canonical: Map<number, number> = new Map<number, number>();
        const samples: readonly number[] | undefined =
          basis.surfaces[surface].sourcePartition?.samples;
        return arms[surface].map((arm: number, vertex: number): number => {
          const sample: number = samples?.[vertex] ?? vertex;
          let value: number | undefined = canonical.get(sample);
          if (value === undefined) {
            value = coverage(
              positions[vertex * 3],
              positions[vertex * 3 + 1],
              positions[vertex * 3 + 2],
              arm,
            );
            canonical.set(sample, value);
          }
          return value;
        });
      },
    );
    if (
      sourceFields.some(
        (field: number[]): boolean => !field.every(Number.isFinite),
      )
    )
      throw new Error(
        "Body underwear coverage is not finite on its actual shaped rest skin.",
      );
    return {
      offsetMetres: table.offsetMetres,
      sourceFields,
      regions: new Map(
        regions.map(
          (
            region: (typeof regions)[number],
          ): [
            string,
            IAutoMovieHumanBodyUnderwearParts["regions"] extends ReadonlyMap<
              string,
              infer R
            >
              ? R
              : never,
          ] => [
            region.id,
            {
              surface: region.surface,
              sources: region.sources,
              field: region.sources.map(
                (source: number): number =>
                  sourceFields[region.surface][source],
              ),
            },
          ],
        ),
      ),
      material: {
        id: table.material,
        name: table.material,
        baseColor: { ...color, a: 1, hex: null },
        metallic: 0,
        roughness: table.roughness,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
        doubleSided: true,
      },
    };
  };
}
