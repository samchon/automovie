import type { IAutoMovieHumanFacePeriocularLashes as ImportedIAutoMovieHumanFacePeriocularLashes, IAutoMovieHumanFaceBasisRegion as ImportedIAutoMovieHumanFaceBasisRegion, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface } from "@automovie/human";
import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { readHumanFaceFibrePigment } from "../../basis/readHumanFaceFibrePigment";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../structures/IAutoMovieHumanFaceBasisDocument";
import { humanFaceLashPartId } from "./humanFaceLashPartId";
import type { IHumanFaceLashRow } from "./structures/IHumanFaceLashRow";

/**
 * Finish actual shaft geometry with its source-controlled fibre pigmentation.
 *
 * The source card's alpha-weighted linear foreground colour supplies the neutral shaft pigment; explicit pigment overrides replace it. Solid shafts carry no card texture or coverage cutoff. Legacy density is transported as uniform alpha gain capped by its existing unit opacity, so it changes the visibility of the constructed shafts without changing their explicit count. That alpha conversion is an appearance approximation, not follicle density. A zero population emits no part or finish. Each shaft mesh takes the actual export owner's Float32 geometry admission before publication.
 *
 * @evidence contracts/common.md#principled-implementation Registered source fibre pigment or explicit overrides finish the actual generated solid shafts.
 * @evidence contracts/common.md#clear-and-simple-design Finish identity shares one side/row owner with final-output readers and population remains geometry-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Alpha gain is a legacy appearance approximation, not changed follicle density; missing finishes/pigment and Float32 admission failures refuse.
 * @evidence contracts/common.md#meaningful-documentation Zero rows allocate no finish; output has solid-shaft material without source-card texture or coverage cutoff.
 * @evidence contracts/performance.md#efficient-algorithms Compilation searches the small registered row palette; each evaluation searches resident finishes and clones emitted shaft buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Neutral source pigment is compiled once per material and reused across compatible document evaluations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains derived pigment arrays; returned materials/meshes are owned. Float32 admission leaves the generated row mesh unchanged and its temporary typed buffers expire because this caller uses only the admission result.
 */
export function createHumanFaceLashFinish(basis: IAutoMovieHumanFaceBasis): (document: IAutoMovieHumanFaceBasisDocument, rows: readonly IHumanFaceLashRow[], materials: readonly IAutoMovieMaterial[]) => Pick<IAutoMovieModel, "parts" | "materials"> {
  const colors: Map<string, number[]> = new Map<string, number[]>();
  for (const side of ["left", "right"] as const)
    for (const row of ["upper", "lower"] as const) {
      const registration: ImportedIAutoMovieHumanFacePeriocularLashes | undefined = basis.periocular?.[side].lashes;
      if (registration === undefined) continue;
      const id: string =
        row === "upper" ? registration.upperRegion : registration.lowerRegion;
      const region: ImportedIAutoMovieHumanFaceBasisRegion | undefined = basis.surfaces
        .find((s: ImportedIAutoMovieHumanFaceBasisSurface): boolean => s.id === registration.surface)
        ?.regions.find((r: ImportedIAutoMovieHumanFaceBasisRegion): boolean => r.id === id);
      const material: IAutoMovieMaterial | undefined = basis.materials.find((m: IAutoMovieMaterial): boolean => m.id === region?.material);
      if (material === undefined || colors.has(material.id)) continue;
      colors.set(material.id, readHumanFaceFibrePigment(material));
    }
  return (
    document: IAutoMovieHumanFaceBasisDocument,
    rows: readonly IHumanFaceLashRow[],
    materials: readonly IAutoMovieMaterial[],
  ): Pick<IAutoMovieModel, "parts" | "materials"> => {
    const result: Pick<IAutoMovieModel, "parts" | "materials"> = {
      parts: [],
      materials: [],
    };
    for (const row of rows) {
      if (row.mesh === null) continue;
      float32MeshBuffers(row.mesh, humanFaceLashPartId(row.side, row.row));
      const source: IAutoMovieMaterial | undefined = materials.find((material: IAutoMovieMaterial): boolean => material.id === row.material);
      const pigment: number[] | undefined =
        document.materials?.[row.material]?.pigment ?? colors.get(row.material);
      if (source === undefined || pigment === undefined)
        throw new Error(
          "Numerical lashes need their source finish and pigment: " +
            row.material,
        );
      const opacity: number =
        source.opacity *
        Math.min(1, document.materials?.[row.material]?.density ?? 1);
      const id: string = humanFaceLashPartId(row.side, row.row);
      const gain: number[] = [source.baseColor.r, source.baseColor.g, source.baseColor.b];
      result.materials.push({
        id,
        name: id,
        baseColor: {
          r: pigment[0] * gain[0],
          g: pigment[1] * gain[1],
          b: pigment[2] * gain[2],
          a: opacity,
          hex: null,
        },
        roughness: source.roughness,
        metallic: 0,
        opacity,
        emissive: null,
        baseColorTexture: null,
        doubleSided: false,
        alphaMode: opacity < 1 ? "blend" : "opaque",
      });
      result.parts.push({
        id,
        name: id,
        material: id,
        geometry: { type: "mesh", mesh: structuredClone(row.mesh) },
        attachedBone: null,
        transform: null,
      });
    }
    return result;
  };
}
