import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularCage } from "../structures/IAutoMovieHumanFacePeriocularCage";

/**
 * Admit a source cage against the actual host's canonical native samples.
 * Matching generation labels alone are insufficient: every station column
 * must carry the canonical source-tree identity of its head-view vertex. The
 * separate original native ordinals remain qualified by the source receipt.
 * Both anatomical
 * halves cover one closed row with only their shared canthal endpoints.
 * Tissue roles and eligibility remain publisher-qualified authoring choices.
 */
export function assertHumanFacePeriocularCage(
  basis: IAutoMovieHumanFaceBasis,
  cage: IAutoMovieHumanFacePeriocularCage,
): void {
  const host = basis.surfaces.find((surface) => surface.id === cage.surface),
    samples = host?.sourcePartition?.samples;
  const width = cage.stations[0]?.vertices.length ?? 0;
  if (
    samples === undefined ||
    cage.frame !== "head-metres-y-up-z-anterior" ||
    cage.sourceId.trim() === "" ||
    cage.generation !== basis.periocular?.generation ||
    cage.generation !== host!.sourcePartition!.generation ||
    cage.sourceSha256.length === 0 ||
    cage.sourceSha256.some((sha) => !/^[0-9a-f]{64}$/u.test(sha)) ||
    !basis.materials.some((material) => material.id === cage.material)
  )
    throw new Error(
      "Periocular cage needs its actual same-generation source receipt and host finish.",
    );
  if (
    width < 4 ||
    new Set(cage.stations.map((station) => station.role)).size !==
      cage.stations.length ||
    cage.stations.some(
      (station) =>
        station.vertices.length !== width ||
        station.sourceVertices.length !== width ||
        station.nativeVertices.length !== width ||
        new Set(station.vertices).size !== width ||
        new Set(station.nativeVertices).size !== width ||
        new Set(station.sourceVertices).size !== width ||
        station.vertices.some(
          (vertex, column) =>
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
  const upper = cage.upperColumns,
    lower = cage.lowerColumns;
  if (
    upper.length < 3 ||
    lower.length < 3 ||
    new Set(upper).size !== upper.length ||
    new Set(lower).size !== lower.length ||
    [upper[0], lower[0]].some((column) => column !== cage.medialColumn) ||
    [upper.at(-1), lower.at(-1)].some(
      (column) => column !== cage.lateralColumn,
    ) ||
    new Set([...upper, ...lower]).size !== width ||
    [...upper, ...lower].some(
      (column) =>
        !Number.isSafeInteger(column) || column < 0 || column >= width,
    ) ||
    upper.slice(1, -1).some((column) => lower.includes(column))
  )
    throw new Error(
      "Periocular cage halves must cover one closed row with exact shared canthi.",
    );
}
