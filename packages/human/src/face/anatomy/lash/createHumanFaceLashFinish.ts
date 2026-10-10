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
 * The source card's alpha-weighted linear foreground colour supplies the
 * neutral shaft pigment; explicit pigment overrides replace it. Solid shafts
 * carry no card texture or coverage cutoff. Legacy density is transported as
 * uniform alpha gain capped by its existing unit opacity, so it changes the
 * visibility of the constructed shafts without changing their explicit count.
 * That alpha conversion is an appearance approximation, not follicle density.
 * A zero population emits no part or finish. Each shaft mesh takes the actual
 * export owner's Float32 geometry admission before publication.
 */
export function createHumanFaceLashFinish(basis: IAutoMovieHumanFaceBasis) {
  const colors = new Map<string, number[]>();
  for (const side of ["left", "right"] as const)
    for (const row of ["upper", "lower"] as const) {
      const registration = basis.periocular?.[side].lashes;
      if (registration === undefined) continue;
      const id =
        row === "upper" ? registration.upperRegion : registration.lowerRegion;
      const region = basis.surfaces
        .find((s) => s.id === registration.surface)
        ?.regions.find((r) => r.id === id);
      const material = basis.materials.find((m) => m.id === region?.material);
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
      const source = materials.find((material) => material.id === row.material);
      const pigment =
        document.materials?.[row.material]?.pigment ?? colors.get(row.material);
      if (source === undefined || pigment === undefined)
        throw new Error(
          "Numerical lashes need their source finish and pigment: " +
            row.material,
        );
      const opacity =
        source.opacity *
        Math.min(1, document.materials?.[row.material]?.density ?? 1);
      const id = humanFaceLashPartId(row.side, row.row);
      const gain = [source.baseColor.r, source.baseColor.g, source.baseColor.b];
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
