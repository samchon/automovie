import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularStationBoundary } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularStationBoundary";

import { compileHumanSourceLidDisplacementPatch } from "./compileHumanSourceLidDisplacementPatch.ts";
import { readHumanSourceAttachmentTopology } from "./readHumanSourceAttachmentTopology.ts";
import { readHumanSourceNativeEdgeCycle } from "./readHumanSourceNativeEdgeCycle.ts";

/**
 * Make each authored anterior station row an explicit native skin-edge course.
 * The existing posterior/preseptal owner first admits the same source annulus.
 * Its interior incidence bounds the deterministic station path, which cannot
 * cross another section's anchors. Original row anchors and column order are
 * retained, with every intermediate native knot and actual source sample.
 * This concretizes the licensed source's authored turning-border convention;
 * minimum edge count alone supplies no clinical or histological boundary.
 * Existing registrations must exactly match a fresh incidence reconstruction.
 * Positions, targets, source generation and posterior-origin extents are read
 * without modification. Optional absent cages introduce no registration;
 * publication callers decide whether both cages are required. The parsed
 * basis is owned by the publishing caller.
 *
 * @author Samchon
 */
export function registerHumanSourcePeriocularBoundaryCourses(
  basis: IAutoMovieHumanFaceBasis,
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (basis.periocular === undefined) return counts;
  for (const side of ["left", "right"] as const) {
    const cage = basis.periocular[side].cage;
    if (cage === undefined) continue;
    const host = basis.surfaces.find((surface) => surface.id === cage.surface);
    if (host?.sourcePartition === undefined ||
        host.sourcePartition.generation !== cage.generation)
      throw new Error("Station boundary registration needs same-generation native skin.");
    const anterior = cage.stations.find((station) => station.role === "anteriorMargin"),
      posterior = cage.stations.find((station) => station.role === "posteriorMargin"),
      preseptal = cage.stations.find((station) => station.role === "preseptal");
    if (anterior === undefined || posterior === undefined || preseptal === undefined)
      throw new Error("Station boundary registration lacks its source-authored rows.");
    if (cage.stations.some((station) => station.role !== "anteriorMargin" && station.boundary !== undefined))
      throw new Error("This source owner registers only the authored anterior turning-border course.");
    const samples = host.sourcePartition.samples;
    if (anterior.vertices.length < 3 ||
        new Set(anterior.vertices).size !== anterior.vertices.length ||
        anterior.vertices.length !== anterior.nativeVertices.length ||
        anterior.vertices.length !== anterior.sourceVertices.length ||
        anterior.vertices.some((vertex, at) => samples[vertex] !== anterior.sourceVertices[at]))
      throw new Error("Anterior station columns have different canonical source samples.");
    const patch = compileHumanSourceLidDisplacementPatch({
      generation: cage.generation,
      surface: cage.surface,
      indices: host.indices,
      samples,
      posteriorStations: posterior.vertices,
      preseptalStations: preseptal.vertices,
      interiorStations: cage.stations.filter((station) =>
        ["anteriorMargin", "pretarsal", "crease", "hood"].includes(station.role),
      ).flatMap((station) => station.vertices),
    });
    if (cage.displacementPatch !== undefined &&
        JSON.stringify(cage.displacementPatch) !== JSON.stringify(patch))
      throw new Error("Anterior boundary registration cannot replace a different native annulus.");
    cage.displacementPatch = patch;
    const topology = readHumanSourceAttachmentTopology(
      patch.triangles.flatMap((triangle) => host.indices.slice(3 * triangle, 3 * triangle + 3)),
      samples.length,
    );
    const forbidden = new Set(cage.stations.flatMap((station) => station.vertices));
    const vertices = readHumanSourceNativeEdgeCycle({
      topology,
      stations: anterior.vertices,
      forbidden,
      occupied: new Set<number>(),
    });
    const anchorOffsets = anterior.vertices.map((vertex) => vertices.indexOf(vertex));
    if (new Set(vertices).size !== vertices.length ||
        anchorOffsets.some((offset, at) => offset < 0 || (at > 0 && offset <= anchorOffsets[at - 1])))
      throw new Error("Anterior native course does not preserve every ordered source column.");
    const boundary: IAutoMovieHumanFacePeriocularStationBoundary = {
      vertices,
      sourceSamples: vertices.map((vertex) => samples[vertex]),
      anchorOffsets,
      qualification: "authoredConvention",
    };
    if (anterior.boundary !== undefined &&
        JSON.stringify(anterior.boundary) !== JSON.stringify(boundary))
      throw new Error("Existing anterior boundary differs from actual source incidence.");
    anterior.boundary = boundary;
    counts[`${side}:anteriorBoundary:anchors`] = anterior.vertices.length;
    counts[`${side}:anteriorBoundary:vertices`] = vertices.length;
  }
  return counts;
}
