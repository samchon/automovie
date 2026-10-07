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
 * @evidence contracts/common.md#principled-implementation Exact view-to-canonical-tree sample correspondence, complete joins, source receipts and the registered finish are checked without confusing native author ordinals with compacted tree IDs.
 * @evidence contracts/common.md#clear-and-simple-design One source admission owner serves lid, tissue and ocular generators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Labels or guessed indices do not replace native correspondence.
 * @evidence contracts/common.md#meaningful-documentation Separates actual source identity from anatomical qualifications this check cannot establish.
 * @evidence contracts/modeling.md#shared-boundaries Upper and lower rows share the exact declared canthi and complete source column population.
 * @evidence contracts/modeling.md#spatial-conventions Head-view indices map to canonical source-tree sample IDs; native author ordinals remain a separate receipt domain and no conversion is repeated.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads publisher-owned identities without defining parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no shape or motion control.
 * @evidenceExclude contracts/modeling.md#rendered-observation Preserves correspondence for the generator and viewer; claims no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Biological qualification remains with the source publisher.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no physiological quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
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
