import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";

/**
 * Build the subcutaneous layer as the closed shell between two skin offsets.
 *
 * The shell's outer sheet is the dermal face with the skin's own triangles,
 * and its inner sheet is the fascial face with those triangles reversed, so
 * the solid between them is oriented outward on both sides. Where the skin
 * is open (the collar where the body meets the head), each open edge gets a
 * two-triangle strip joining the sheets, which closes the shell along the
 * actual rim, planar or not. The layer therefore has the skin's resolution,
 * its outer side is the dermis by definition, and its thickness varies
 * continuously with the field; it has no lattice and no staircase.
 *
 * The primitive count is fixed by the skin: twice its vertices, twice its
 * triangles and two triangles per open edge. The shell is a boundary surface
 * of a material region. It is not a tetrahedral solid, and where the
 * surfaces report offset orientation failures, the shell retains them for
 * inspection. A normal-ray ratio refusal alone does not prove a crossing.
 * Missing positive reach stays unknown. This builder establishes only the
 * manifold edge incidence needed for its strips, not global embedding.
 * Shading normals are recomputed on the actual emitted triangles: varying
 * thickness changes a sheet's tangent planes, so skin normals cannot be
 * carried unchanged to its offsets or rim strips.
 */
export function createHumanBodySubcutaneousShell(
  surfaces: IHumanBodyLayerSurfaces,
  indices: readonly number[],
): IAutoMovieMesh {
  const count = surfaces.dermis.length / 3;
  if (
    count === 0 ||
    surfaces.dermis.length % 3 !== 0 ||
    surfaces.fascia.length !== surfaces.dermis.length ||
    indices.length === 0 ||
    indices.length % 3 !== 0 ||
    ![surfaces.dermis, surfaces.fascia].every((values) =>
      values.every(Number.isFinite),
    ) ||
    indices.some(
      (index) => !Number.isSafeInteger(index) || index < 0 || index >= count,
    )
  )
    throw new Error(
      "The layer shell needs complete finite corresponding sheets and native indices.",
    );
  const positions = [...surfaces.dermis, ...surfaces.fascia];
  const triangles: number[] = [];
  // An edge used once, in the direction its one triangle runs it, is a rim.
  const rim = new Map<string, number[]>();
  const incidence = new Map<string, number>();
  for (let at = 0; at < indices.length; at += 3) {
    const [a, b, c] = [indices[at], indices[at + 1], indices[at + 2]];
    if (a === b || b === c || c === a)
      throw new Error(
        "The layer shell needs three distinct native corners per triangle.",
      );
    triangles.push(a, b, c, count + a, count + c, count + b);
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = Math.min(from, to) + ":" + Math.max(from, to);
      const uses = (incidence.get(key) ?? 0) + 1;
      incidence.set(key, uses);
      if (uses > 2 || rim.has(from + ":" + to))
        throw new Error(
          "The layer shell requires manifold oppositely oriented edge incidence.",
        );
      const opposite = to + ":" + from;
      if (rim.has(opposite)) rim.delete(opposite);
      else rim.set(from + ":" + to, [from, to]);
    }
  }
  for (const [from, to] of rim.values())
    triangles.push(to, from, count + from, to, count + from, count + to);
  return {
    positions,
    normals: areaWeightedNormals(positions, triangles),
    indices: triangles,
    uvs: null,
    skin: null,
  };
}
