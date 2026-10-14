import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanFaceAssemblyCensusInput } from "../../basis/IHumanFaceAssemblyCensusInput";
import { measureHumanFaceClearance } from "../../basis/measureHumanFaceClearance";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../../index";


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
 * A missing source surface or performed position buffer is currently skipped;
 * callers must separately admit the complete basis/pose population. Open-sheet
 * signs have only local geometric meaning, and this report states no reach bound.
 *
 * @evidence contracts/common.md#principled-implementation Named native vertex sets partition performed skin into complete inside and outside triangles, omitting mixed attachment-ring faces; the shared signed-distance/crossing reader reports geometry with judged false rather than an anatomical refusal.
 * @evidence contracts/common.md#clear-and-simple-design Region partitioning belongs here while publication precision, native queries and crossing census remain measureHumanFaceClearance responsibilities; assembly-census appends these region readings to its actual model reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty partitions emit unavailable observations, but missing source/pose buffers are currently skipped and require separate caller admission. No read source supplies anatomical limits or open-sheet reach, so report-only signs cannot certify validity.
 * @evidence contracts/common.md#meaningful-documentation The prose explains native region identity, mixed-face exclusion, rim-side uncertainty, report-only meaning, empty-partition handling and missing-buffer/local-sign limitations.
 * @evidence contracts/performance.md#efficient-algorithms For A named areas the reader scans each area's T source triangles and copies V positions for both query meshes; shared clearance cost includes selected-vertex nearest traversal, distance sorting and triangle crossing census. This reports complete subsets rather than stopping at the first negative point.
 * @evidence contracts/performance.md#reuse-equivalent-work Within an area, membership Set lookups reuse its native vertex set; newly constructed outside meshes differ between areas, so this reader introduces no cross-area query cache that could mistake different partitions as equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary subsets/mesh copies are area-local and shared clearance retains references only through its weak-key owner; returned reading records belong to the census caller and no strong global region/task population is added here.
 */
export function readHumanFaceSkinRegionRelations(
  input: IHumanFaceAssemblyCensusInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  const { basis, pose }: IHumanFaceAssemblyCensusInput = input;
  const tolerance: number = basis.contact?.toleranceMetres ?? 0;
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  for (const [name, area] of Object.entries(basis.skinRegions ?? {})) {
    const surface: IAutoMovieHumanFaceBasisSurfaceImported = basis.surfaces[area.surface];
    const points: readonly number[] | undefined =
      surface === undefined ? undefined : pose.positions.get(surface.id);
    if (surface === undefined || points === undefined) continue;
    const members: Set<number> = new Set(area.vertices);
    const inside: number[] = [],
      outside: number[] = [];
    for (let at: number = 0; at < surface.indices.length; at += 3) {
      const corners: number[] = surface.indices.slice(at, at + 3);
      const count: number = corners.filter((vertex: number): boolean  => members.has(vertex)).length;
      if (count === 3) inside.push(...corners);
      else if (count === 0) outside.push(...corners);
    }
    const mesh: (indices: number[]) => IAutoMovieMesh = (indices: number[]): IAutoMovieMesh => ({
      positions: [...points],
      indices,
      normals: null,
      uvs: null,
      skin: null,
    });
    const request: { owner: string; state: "performed"; subject: string; against: string; judged: boolean; toleranceMetres: number; } = {
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
