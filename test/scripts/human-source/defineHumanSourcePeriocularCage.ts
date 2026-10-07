import type { IAutoMovieHumanFacePeriocularCage } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularCage";

import { HUMAN_FACE_LID_SEAT } from "@automovie/human/face/anatomy/eye/HUMAN_FACE_LID_SEAT";

import { HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION } from "./HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION.ts";
import { HUMAN_SOURCE_TARSAL_CONVENTION } from "./HUMAN_SOURCE_TARSAL_CONVENTION.ts";
import { defineHumanSourceMedialBed } from "./defineHumanSourceMedialBed.ts";
import { compileHumanSourcePeriocularAttachmentCharts } from "./compileHumanSourcePeriocularAttachmentCharts.ts";
import { compileHumanSourceLidDisplacementPatch } from "./compileHumanSourceLidDisplacementPatch.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";

/**
 * Publish the source-authored coarse lid rows through the canonical skin map.
 * Native station and column identity survive the source mirror and head crop;
 * coordinates, normals and endpoint transport remain owned by that live skin.
 * Section roles are authored conventions. This registration supplies no
 * clinical thickness.
 *
 * Two registrations are measured along the posterior margin of the neutral
 * skin it is given. The tarsal extent is the authored plate outline
 * (`HUMAN_SOURCE_TARSAL_CONVENTION`) read at each lid column's distance from
 * the middle of its lid, zero at both joins. The ciliated columns are those
 * at least the medial bed length (`HUMAN_FACE_LID_SEAT.medialBedMetres`) from
 * the medial join along their lid, the joins excluded, so lashes start where
 * the margin has come to rest on the globe. Both are authored conventions on
 * this source and claim no follicle count or plate measurement. The medial
 * bed owner registers the actual connected skin pocket and its plica support
 * path as source authoring conventions, not histological boundaries.
 */
export function defineHumanSourcePeriocularCage(
  side: "left" | "right",
  generation: string,
  mirror: IHumanSourceMirror,
  nativeToFace: (vertex: number) => number,
  nativeToSource: (vertex: number) => number,
  material: string,
  sourceSha256: string[],
  positions: readonly number[],
  indices: readonly number[],
  sourceSamples: readonly number[],
): IAutoMovieHumanFacePeriocularCage {
  const selection = HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION;
  const native = (vertices: number[]): number[] =>
    side === "left" ? [...vertices] : vertices.map((vertex) => mirror.twin[vertex]);
  const stations = selection.stations.map((station) => {
    const nativeVertices = native(station.nativeVertices);
    if (nativeVertices.some((vertex) => !Number.isSafeInteger(vertex) || vertex < 0) ||
        new Set(nativeVertices).size !== nativeVertices.length)
      throw new Error(`Periocular cage: ${side}/${station.role} lacks a distinct native row.`);
    return { role: station.role, nativeVertices, sourceVertices: nativeVertices.map(nativeToSource), vertices: nativeVertices.map(nativeToFace) };
  });
  const width = stations[0]?.vertices.length ?? 0;
  if (width === 0 || stations.some((station) => station.vertices.length !== width) ||
      new Set(stations.map((station) => station.role)).size !== stations.length)
    throw new Error(`Periocular cage: ${side} station correspondence is incomplete.`);
  for (const columns of [selection.upperColumns, selection.lowerColumns])
    if (columns[0] !== selection.medialColumn || columns[columns.length - 1] !== selection.lateralColumn ||
        columns.some((column) => !Number.isSafeInteger(column) || column < 0 || column >= width) ||
        new Set(columns).size !== columns.length)
      throw new Error(`Periocular cage: ${side} section columns do not share valid canthal joins.`);
  const margin = stations[0].vertices;
  const along = (columns: readonly number[]): number[] => {
    const lengths = [0];
    for (let at = 1; at < columns.length; at++) {
      const a = margin[columns[at - 1]], b = margin[columns[at]];
      lengths.push(lengths[at - 1] + Math.hypot(positions[3 * a] - positions[3 * b], positions[3 * a + 1] - positions[3 * b + 1], positions[3 * a + 2] - positions[3 * b + 2]));
    }
    if (lengths.some((value) => !Number.isFinite(value))) throw new Error(`Periocular cage: ${side} margin has a nonfinite length.`);
    return lengths;
  };
  const convention = HUMAN_SOURCE_TARSAL_CONVENTION;
  const fraction = (distance: number): number => {
    const widths = convention.halfWidthsMetres, fractions = convention.heightFractions;
    if (distance <= widths[0]) return fractions[0];
    for (let at = 1; at < widths.length; at++)
      if (distance <= widths[at])
        return fractions[at - 1] + ((fractions[at] - fractions[at - 1]) * (distance - widths[at - 1])) / (widths[at] - widths[at - 1]);
    return fractions[fractions.length - 1];
  };
  const extent = (columns: readonly number[], height: number): number[] => {
    const lengths = along(columns);
    const middle = lengths[lengths.length - 1] / 2;
    return lengths.map((length, at) => at === 0 || at === lengths.length - 1 ? 0 : height * fraction(Math.abs(length - middle)));
  };
  const ciliated = new Set<number>();
  for (const columns of [selection.upperColumns, selection.lowerColumns])
    along(columns).forEach((length, at) => {
      if (at !== 0 && at !== columns.length - 1 && length >= HUMAN_FACE_LID_SEAT.medialBedMetres) ciliated.add(columns[at]);
    });
  return {
    sourceId: selection.sourceId,
    generation,
    frame: "head-metres-y-up-z-anterior",
    surface: "Human",
    material,
    sourceSha256: [...new Set([...selection.sourceSha256, ...sourceSha256])],
    stations,
    medialColumn: selection.medialColumn,
    lateralColumn: selection.lateralColumn,
    upperColumns: [...selection.upperColumns],
    lowerColumns: [...selection.lowerColumns],
    canthalSupport: selection.canthalSupport,
    ciliatedColumns: [...ciliated].sort((a, b) => a - b),
    ciliatedQualification: "authoredConvention",
    tarsalExtent: {
      upperArcMetres: extent(selection.upperColumns, convention.upperHeightMetres),
      lowerArcMetres: extent(selection.lowerColumns, convention.lowerHeightMetres),
      qualification: "authoredConvention",
    },
    medialBed: defineHumanSourceMedialBed(positions, indices, margin, selection.upperColumns, selection.lowerColumns, generation, "Human"),
    attachmentCharts: compileHumanSourcePeriocularAttachmentCharts(generation, "Human", indices, sourceSamples, stations, selection.upperColumns, selection.lowerColumns),
    displacementPatch: compileHumanSourceLidDisplacementPatch({ generation, surface: "Human", indices, samples: sourceSamples,
      posteriorStations: stations.find((station) => station.role === "posteriorMargin")!.vertices,
      preseptalStations: stations.find((station) => station.role === "preseptal")!.vertices,
      interiorStations: stations.filter((station) => ["anteriorMargin", "pretarsal", "crease", "hood"].includes(station.role)).flatMap((station) => station.vertices) }),
  };
}
