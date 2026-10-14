import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceResidentParts } from "./IHumanFaceResidentParts";
import type { IHumanFaceResidentPartsInput } from "./IHumanFaceResidentPartsInput";
import type { IHumanFaceResidentSourceRegion } from "./IHumanFaceResidentSourceRegion";
import { createHumanFaceSurfaceColours } from "./createHumanFaceSurfaceColours";
import { selectHumanFaceRetainedRegion } from "./selectHumanFaceRetainedRegion";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported, IAutoMovieHumanFaceBasisRegion as IAutoMovieHumanFaceBasisRegionImported, IHumanPhysicalSampleRegistration as IHumanPhysicalSampleRegistrationImported, IPortraitColourField as IPortraitColourFieldImported } from "../../index";
import type { IAutoMovieMesh as IAutoMovieMeshImported } from "@automovie/interface";
import type { IAutoMovieHumanBasisSourcePartition as IAutoMovieHumanBasisSourcePartitionImported } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IHumanFaceOpticalAssembly as IHumanFaceOpticalAssemblyImported } from "../anatomy/eye/structures/IHumanFaceOpticalAssembly";


/**
 * Compile native face-region gathers and retain their exact emitted source order.
 * Generated optical, brow and lash ownership removes only its enrolled native
 * incidence. Each remaining part and its correspondence use the same retained
 * region and canonical corner table; a compact gather cannot silently inherit
 * the original region's render numbering. Original physical-source admission,
 * reflectance composition, part identity and hair input ownership are preserved.
 *
 * @evidence contracts/common.md#principled-implementation Admitted source partitions and canonical region corner tables gather corrected positions/common normals with the same retained incidence. Registered optical/brow vertices, complete lash regions and the replaced dental surface are removed by their actual owners; document/generation domains preserve physical sample identity independently from render aliases.
 * @evidence contracts/common.md#clear-and-simple-design Compilation retains full-region gathers/source orders; per-request replacement selection recompiles only changed incidence and records the exact emitted correspondence beside each part. Appearance gains and geometric gather stay with their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dense safe source samples and nonempty generations refuse invalid registration. Removed incidence never inherits old compact render numbering; seam duplication preserves common geometry/normals and supplies no cross-part collision or clinical proof.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies replacement scope, canonical emitted order, physical source ownership, part identity and preservation of original reflectance/hair inputs.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans source samples and region corners; requests scan resident surfaces/regions, build replacement sets, compose V colour gains and gather emitted corners. Changed region incidence pays fresh gather/source-table construction, while unchanged regions reuse compiled indexing.
 * @evidence contracts/performance.md#reuse-equivalent-work Full-region evaluators and corner orders are fixed-basis compiled once; retained-identical regions reuse them, while optical/brow/lash changes choose a fresh retained gather. Current posed positions/normals and pigmentation are request-specific and remain distinct from cached indexing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder retains fixed source surfaces, compiled gathers and source orders; new part arrays, evaluated surface references and correspondence records transfer to the current stage. No previous model history, viewer or external handle is retained here.
 */
export function createHumanFaceResidentParts(basis: IAutoMovieHumanFaceBasis): (input: IHumanFaceResidentPartsInput) => IHumanFaceResidentParts  {
  const surfaces: { surface: IAutoMovieHumanFaceBasisSurfaceImported; regions: { region: IAutoMovieHumanFaceBasisRegionImported; evaluate: (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistrationImported) => IAutoMovieMeshImported; sources: number[]; }[]; }[] = basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported): { surface: IAutoMovieHumanFaceBasisSurfaceImported; regions: { region: IAutoMovieHumanFaceBasisRegionImported; evaluate: (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistrationImported) => IAutoMovieMeshImported; sources: number[]; }[]; }  => {
    const source: IAutoMovieHumanBasisSourcePartitionImported | undefined = surface.sourcePartition;
    if (source !== undefined) {
      if (source.generation.trim() === "")
        throw new Error(
          "Facial physical registration needs a nonempty source generation.",
        );
      const extent: number =
        source.originalVertices +
        source.intersections.length +
        (source.refinements?.length ?? 0);
      if (
        !Number.isSafeInteger(source.originalVertices) ||
        source.originalVertices < 3 ||
        !Number.isSafeInteger(extent) ||
        source.samples.length !== surface.positions.length / 3 ||
        Array.from(source.samples).some(
          (sample: number): boolean  =>
            !Number.isSafeInteger(sample) || sample < 0 || sample >= extent,
        )
      )
        throw new Error(
          "Facial physical registration needs dense samples in its declared safe canonical source domain.",
        );
    }
    return {
      surface,
      regions: surface.regions.map((region: IAutoMovieHumanFaceBasisRegionImported): { region: IAutoMovieHumanFaceBasisRegionImported; evaluate: (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistrationImported) => IAutoMovieMeshImported; sources: number[]; }  => ({
        region,
        evaluate: createHumanBasisRegion(region),
        sources: humanBasisRegionCorners(region).sources,
      })),
    };
  });
  return (input: IHumanFaceResidentPartsInput): IHumanFaceResidentParts => {
    const { document, pose }: IHumanFaceResidentPartsInput = input;
    const evaluated: Map<string, readonly number[]> = new Map<string, readonly number[]>();
    const sourceRegions: IHumanFaceResidentSourceRegion[] = [];
    const parts: { id: string; name: string; material: string; geometry: { type: "mesh"; mesh: IAutoMovieMeshImported; }; attachedBone: null; transform: null; }[] = surfaces.flatMap(({ surface, regions }: { surface: IAutoMovieHumanFaceBasisSurfaceImported; regions: { region: IAutoMovieHumanFaceBasisRegionImported; evaluate: (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistrationImported) => IAutoMovieMeshImported; sources: number[]; }[]; }): { id: string; name: string; material: string; geometry: { type: "mesh"; mesh: IAutoMovieMeshImported; }; attachedBone: null; transform: null; }[]  => {
      if (pose.oral !== undefined && surface.id === pose.oral.dentalSurface)
        return [];
      const fields: IPortraitColourFieldImported[] | undefined = Object.hasOwn(document.skin ?? {}, surface.id)
        ? document.skin![surface.id]
        : undefined;
      const colors: number[] | undefined = createHumanFaceSurfaceColours(
        surface,
        fields,
        input.fibreTints.get(surface.id),
        input.skinGains.get(surface.id),
      );
      const positions: readonly number[] = pose.positions.get(surface.id)!;
      const normals: readonly number[] = pose.normals.get(surface.id)!;
      evaluated.set(surface.id, positions);
      const replaced: Set<number> = new Set([
        ...(pose.optics ?? [])
          .filter((eye: IHumanFaceOpticalAssemblyImported): boolean  => eye.surface === surface.id)
          .flatMap((eye: IHumanFaceOpticalAssemblyImported): number[]  => [...eye.vertices]),
        ...(input.browReplacements.get(surface.id) ?? []),
      ]);
      return regions.flatMap(({ region, evaluate, sources }: { region: IAutoMovieHumanFaceBasisRegionImported; evaluate: (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistrationImported) => IAutoMovieMeshImported; sources: number[]; }): { id: string; name: string; material: string; geometry: { type: "mesh"; mesh: IAutoMovieMeshImported; }; attachedBone: null; transform: null; }[]  => {
        if (input.replacedLashes.has(region.id)) return [];
        const retained: IAutoMovieHumanFaceBasisRegionImported | undefined = selectHumanFaceRetainedRegion(region, replaced);
        if (retained === undefined) return [];
        const gather: (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistrationImported) => IAutoMovieMeshImported =
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
