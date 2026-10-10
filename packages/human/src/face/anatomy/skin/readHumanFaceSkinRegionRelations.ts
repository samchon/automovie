import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanFaceAssemblyCensusInput } from "../../basis/IHumanFaceAssemblyCensusInput";
import { measureHumanFaceClearance } from "../../basis/measureHumanFaceClearance";

/**
 * Observe how each named area of the face skin lies against the rest of the
 * same skin.
 *
 * The auricle, the nostril and the other areas the basis names are not parts:
 * they are vertices of the one skin surface, so no part-against-part relation
 * sees them. For every named area on the performed skin this reader splits
 * the surface's triangles into the area (every corner in the area) and the
 * remainder (no corner strictly inside the area), and reads the area against
 * the remainder as an open sheet:
 *
 * - The signed distance of the area's vertices says how far the area stands
 *   off the skin around it. For an auricle its extremes are the projection of
 *   the pinna and the depth of the groove behind it; a negative minimum means
 *   the area dips under the surrounding skin.
 * - The triangle crossings say whether the area passes through the skin
 *   around it, which localizes the skin's self-crossings to an area.
 * - Vertices whose nearest feature of the remainder is its rim, the hole the
 *   area was cut from, are counted as boundary vertices: they are where the
 *   area attaches and they read no side.
 *
 * Triangles with corners both inside and outside the area belong to neither
 * side, so the attachment ring is not read against itself. Every reading is
 * report-only: no bound for any of these relations has been read from a
 * source, and the numbers exist so an owner can state one. An area without a
 * triangle of its own, or one that leaves no remainder, produces a reading
 * marked unavailable instead of being skipped.
 */
export function readHumanFaceSkinRegionRelations(
  input: IHumanFaceAssemblyCensusInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  const { basis, pose } = input;
  const tolerance = basis.contact?.toleranceMetres ?? 0;
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  for (const [name, area] of Object.entries(basis.skinRegions ?? {})) {
    const surface = basis.surfaces[area.surface];
    const points =
      surface === undefined ? undefined : pose.positions.get(surface.id);
    if (surface === undefined || points === undefined) continue;
    const members = new Set(area.vertices);
    const inside: number[] = [],
      outside: number[] = [];
    for (let at = 0; at < surface.indices.length; at += 3) {
      const corners = surface.indices.slice(at, at + 3);
      const count = corners.filter((vertex) => members.has(vertex)).length;
      if (count === 3) inside.push(...corners);
      else if (count === 0) outside.push(...corners);
    }
    const mesh = (indices: number[]): IAutoMovieMesh => ({
      positions: [...points],
      indices,
      normals: null,
      uvs: null,
      skin: null,
    });
    const request = {
      owner: "skin-regions",
      state: "performed" as const,
      subject: surface.id + ":" + name,
      against: surface.id + ":outside:" + name,
      judged: false,
      toleranceMetres: tolerance,
    };
    if (inside.length === 0 || outside.length === 0) {
      readings.push({
        ...request,
        refused: false,
        vertices: 0,
        insideVertices: 0,
        outsideVertices: 0,
        boundaryVertices: 0,
        minimumSignedMetres: null,
        maximumSignedMetres: null,
        worstVertex: null,
        worstPoint: null,
        crossings: null,
        unavailable:
          "The named skin area has no triangle of its own or leaves no remainder.",
      });
      continue;
    }
    readings.push(
      measureHumanFaceClearance({
        ...request,
        mesh: mesh(inside),
        exterior: mesh(outside),
        boundary: "open",
      }),
    );
  }
  return readings;
}
