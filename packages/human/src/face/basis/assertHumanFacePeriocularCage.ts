import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularCage } from "../structures/IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieMaterial as IAutoMovieMaterialImported } from "@automovie/interface";
import type { IAutoMovieHumanFacePeriocularStation as IAutoMovieHumanFacePeriocularStationImported } from "../structures/IAutoMovieHumanFacePeriocularStation";
import type { AutoMovieHumanFacePeriocularStationRole as AutoMovieHumanFacePeriocularStationRoleImported } from "../structures/AutoMovieHumanFacePeriocularStationRole";


/**
 * Admit a source cage against the actual host's canonical native samples.
 * Matching generation labels alone are insufficient: every station column
 * must carry the canonical source-tree identity of its head-view vertex. The
 * separate original native ordinals remain qualified by the source receipt.
 * Both anatomical
 * halves cover one closed row with only their shared canthal endpoints.
 * Tissue roles and eligibility remain publisher-qualified authoring choices.
 *
 * @evidence contracts/common.md#principled-implementation Source generation, receipt digests and resident finish accompany exact station view-to-source sample equality; upper/lower column sets cover one row with only their native canthi shared.
 * @evidence contracts/common.md#clear-and-simple-design One gate joins receipt/frame metadata, station correspondence and row partition; actual tissue production keeps role eligibility and geometric shape with its publisher.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generation labels alone do not admit incidence; source-tree equality is checked per vertex and separate native receipt ordinals remain provenance-qualified rather than inferred from coordinates. Digest syntax is structural, not a new file-hash comparison.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes source/view/native domains, canthal sharing and unverified tissue role choices.
 * @evidence contracts/performance.md#efficient-algorithms S stations of width W require expected O(SW) Set construction/membership; shared upper/lower Sets make coverage and interior-disjointness checks expected O(W), without rebuilding tissue geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Host canonical samples and fixed width are shared by all stations; per-station uniqueness populations differ and are checked separately.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Station/column Sets are validation-local and bounded by supplied registrations; source buffers remain unchanged and no handle/cache escapes.
 */
export function assertHumanFacePeriocularCage(
  basis: IAutoMovieHumanFaceBasis,
  cage: IAutoMovieHumanFacePeriocularCage,
): void {
  const host: IAutoMovieHumanFaceBasisSurfaceImported | undefined = basis.surfaces.find((surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean  => surface.id === cage.surface),
    samples: readonly number[] | undefined = host?.sourcePartition?.samples;
  const width: number = cage.stations[0]?.vertices.length ?? 0;
  if (
    samples === undefined ||
    cage.frame !== "head-metres-y-up-z-anterior" ||
    cage.sourceId.trim() === "" ||
    cage.generation !== basis.periocular?.generation ||
    cage.generation !== host!.sourcePartition!.generation ||
    cage.sourceSha256.length === 0 ||
    cage.sourceSha256.some((sha: string): boolean  => !/^[0-9a-f]{64}$/u.test(sha)) ||
    !basis.materials.some((material: IAutoMovieMaterialImported): boolean  => material.id === cage.material)
  )
    throw new Error(
      "Periocular cage needs its actual same-generation source receipt and host finish.",
    );
  if (
    width < 4 ||
    new Set(cage.stations.map((station: IAutoMovieHumanFacePeriocularStationImported): AutoMovieHumanFacePeriocularStationRoleImported  => station.role)).size !==
      cage.stations.length ||
    cage.stations.some(
      (station: IAutoMovieHumanFacePeriocularStationImported): boolean  =>
        station.vertices.length !== width ||
        station.sourceVertices.length !== width ||
        station.nativeVertices.length !== width ||
        new Set(station.vertices).size !== width ||
        new Set(station.nativeVertices).size !== width ||
        new Set(station.sourceVertices).size !== width ||
        station.vertices.some(
          (vertex: number, column: number): boolean  =>
            !Number.isSafeInteger(vertex) ||
            vertex < 0 ||
            vertex >= samples.length ||
            !Number.isSafeInteger(station.nativeVertices[column]) ||
            station.nativeVertices[column] < 0 ||
            !Number.isSafeInteger(station.sourceVertices[column]) ||
            samples[vertex] !== station.sourceVertices[column],
        ),
    )
  )
    throw new Error(
      "Periocular cage station needs exact view-to-source-tree correspondence and separate native receipt ordinals.",
    );
  const upper: number[] = cage.upperColumns,
    lower: number[] = cage.lowerColumns;
  const upperColumns: Set<number> = new Set(upper),
    lowerColumns: Set<number> = new Set(lower);
  if (
    upper.length < 3 ||
    lower.length < 3 ||
    upperColumns.size !== upper.length ||
    lowerColumns.size !== lower.length ||
    [upper[0], lower[0]].some((column: number): boolean  => column !== cage.medialColumn) ||
    [upper.at(-1), lower.at(-1)].some(
      (column: number | undefined): boolean  => column !== cage.lateralColumn,
    ) ||
    new Set([...upper, ...lower]).size !== width ||
    [...upper, ...lower].some(
      (column: number): boolean  =>
        !Number.isSafeInteger(column) || column < 0 || column >= width,
    ) ||
    upper.slice(1, -1).some((column: number): boolean  => lowerColumns.has(column))
  )
    throw new Error(
      "Periocular cage halves must cover one closed row with exact shared canthi.",
    );
}
