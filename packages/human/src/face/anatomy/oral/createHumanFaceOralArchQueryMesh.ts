import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceOralPart } from "./IHumanFaceOralPart";

/**
 * Assemble one physical arch sheet independently of its drawing materials.
 * Gingiva and palate/floor are regions of one lining, and its vestibular wall
 * shares the exact indexed outer rim. A material boundary cannot define an
 * independent signed sheet: cutting triangles there can disconnect a vertex
 * link even while the complete arch has a single manifold link.
 *
 * Only triangle-used points are assembled, by the lining owner's stable
 * physical identities. Equal coordinates with different identities are not
 * joined. One identity with differing coordinates refuses, so this operation
 * cannot repair a gap, move a point or hide an inconsistent boundary. Source
 * crown queries retain their independent numerical cervical closures; final
 * performed lip strips remain soft tissue outside these rigid queries.
 *
 * @evidence contracts/common.md#principled-implementation Physical identities assemble all oriented triangles of one arch without changing coordinates or incidence; the downstream signed-query owner admits the resulting complete sheet.
 * @evidence contracts/common.md#clear-and-simple-design One identity assembler separates physical query boundaries from rendering material regions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate welding, triangle omission, generated cap or policy tolerance repairs supplied topology.
 * @evidence contracts/common.md#meaningful-documentation States physical identity admission, immutable input, material-region independence and separate crown and soft-strip responsibilities.
 * @evidence contracts/modeling.md#part-identity-and-grouping Consumes every non-enamel rigid region under one supplied head or jaw owner as a single physical arch query.
 * @evidence contracts/modeling.md#emitted-geometry The query has exactly the supplied arch triangles and one indexed point per triangle-used physical identity; it adds no surface primitive.
 * @evidence contracts/modeling.md#spatial-conventions Preserves supplied rest coordinates in head-frame metres with no conversion.
 * @evidence contracts/modeling.md#shared-boundaries Shared rim and material-region identities become one indexed query vertex, and unequal coordinates for one identity refuse.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports existing part incidence without introducing a shape or performance control.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly owns visible geometry and its coupled observation; this numerical query assembler changes no displayed surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Preserves geometry supplied by the oral assembly and establishes no anatomical value or tissue acquisition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The assembly admits authored dimensions and the signed-query owner admits topology; this helper adds no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes existing source-owned physical identities and adds no personal authoring input.
 */
export function createHumanFaceOralArchQueryMesh(
  parts: readonly IHumanFaceOralPart[],
  owner: "head" | "jaw",
  observePointIds?: (ids: readonly string[]) => void,
): IAutoMovieMesh {
  const identities = new Map<string, number>();
  const positions: number[] = [],
    indices: number[] = [];
  for (const part of parts) {
    if (part.owner !== owner || part.materialRole === "enamel") continue;
    for (const vertex of part.mesh.indices!) {
      const identity = part.physicalPoints[vertex];
      if (identity === undefined)
        throw new Error(
          "Oral arch query needs every triangle point's physical identity.",
        );
      const point = part.mesh.positions.slice(3 * vertex, 3 * vertex + 3);
      let at = identities.get(identity);
      if (at === undefined) {
        at = identities.size;
        identities.set(identity, at);
        positions.push(...point);
      } else if (
        point.some((value, axis) => value !== positions[3 * at! + axis])
      )
        throw new Error(
          "Oral arch physical identity has inconsistent boundary coordinates: " +
            identity,
        );
      indices.push(at);
    }
  }
  if (indices.length === 0)
    throw new Error("Oral arch query needs its complete nonempty lining.");
  observePointIds?.([...identities.keys()]);
  return { positions, indices, normals: null, uvs: null, skin: null };
}
