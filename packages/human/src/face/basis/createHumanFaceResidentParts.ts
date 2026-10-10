import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceResidentParts } from "./IHumanFaceResidentParts";
import type { IHumanFaceResidentPartsInput } from "./IHumanFaceResidentPartsInput";
import type { IHumanFaceResidentSourceRegion } from "./IHumanFaceResidentSourceRegion";
import { createHumanFaceSurfaceColours } from "./createHumanFaceSurfaceColours";
import { selectHumanFaceRetainedRegion } from "./selectHumanFaceRetainedRegion";

/**
 * Compile native face-region gathers and retain their exact emitted source order.
 * Generated optical, brow and lash ownership removes only its enrolled native
 * incidence. Each remaining part and its correspondence use the same retained
 * region and canonical corner table; a compact gather cannot silently inherit
 * the original region's render numbering. Original physical-source admission,
 * reflectance composition, part identity and hair input ownership are preserved.
 */
export function createHumanFaceResidentParts(basis: IAutoMovieHumanFaceBasis) {
  const surfaces = basis.surfaces.map((surface) => {
    const source = surface.sourcePartition;
    if (source !== undefined) {
      if (source.generation.trim() === "")
        throw new Error(
          "Facial physical registration needs a nonempty source generation.",
        );
      const extent =
        source.originalVertices +
        source.intersections.length +
        (source.refinements?.length ?? 0);
      if (
        !Number.isSafeInteger(source.originalVertices) ||
        source.originalVertices < 3 ||
        !Number.isSafeInteger(extent) ||
        source.samples.length !== surface.positions.length / 3 ||
        Array.from(source.samples).some(
          (sample) =>
            !Number.isSafeInteger(sample) || sample < 0 || sample >= extent,
        )
      )
        throw new Error(
          "Facial physical registration needs dense samples in its declared safe canonical source domain.",
        );
    }
    return {
      surface,
      regions: surface.regions.map((region) => ({
        region,
        evaluate: createHumanBasisRegion(region),
        sources: humanBasisRegionCorners(region).sources,
      })),
    };
  });
  return (input: IHumanFaceResidentPartsInput): IHumanFaceResidentParts => {
    const { document, pose } = input;
    const evaluated = new Map<string, readonly number[]>();
    const sourceRegions: IHumanFaceResidentSourceRegion[] = [];
    const parts = surfaces.flatMap(({ surface, regions }) => {
      if (pose.oral !== undefined && surface.id === pose.oral.dentalSurface)
        return [];
      const fields = Object.hasOwn(document.skin ?? {}, surface.id)
        ? document.skin![surface.id]
        : undefined;
      const colors = createHumanFaceSurfaceColours(
        surface,
        fields,
        input.fibreTints.get(surface.id),
        input.skinGains.get(surface.id),
      );
      const positions = pose.positions.get(surface.id)!;
      const normals = pose.normals.get(surface.id)!;
      evaluated.set(surface.id, positions);
      const replaced = new Set([
        ...(pose.optics ?? [])
          .filter((eye) => eye.surface === surface.id)
          .flatMap((eye) => [...eye.vertices]),
        ...(input.browReplacements.get(surface.id) ?? []),
      ]);
      return regions.flatMap(({ region, evaluate, sources }) => {
        if (input.replacedLashes.has(region.id)) return [];
        const retained = selectHumanFaceRetainedRegion(region, replaced);
        if (retained === undefined) return [];
        const gather =
          retained === region ? evaluate : createHumanBasisRegion(retained);
        sourceRegions.push({
          surface: surface.id,
          part: region.id,
          sources:
            retained === region
              ? sources
              : humanBasisRegionCorners(retained).sources,
        });
        return [
          {
            id: region.id,
            name: region.id,
            material: region.material,
            geometry: {
              type: "mesh" as const,
              mesh: gather(
                positions,
                normals,
                colors,
                surface.sourcePartition === undefined
                  ? undefined
                  : {
                      domain: humanPhysicalSourceDomain(
                        document.id,
                        surface.sourcePartition.generation,
                      ),
                      samples: surface.sourcePartition.samples,
                    },
              ),
            },
            attachedBone: null,
            transform: null,
          },
        ];
      });
    });
    return { parts, evaluated, sourceRegions };
  };
}
