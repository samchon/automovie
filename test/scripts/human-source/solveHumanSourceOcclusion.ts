import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { resolveHumanFaceOralArchFrame } from "@automovie/human/face/anatomy/oral/resolveHumanFaceOralArchFrame";
import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { createHumanSourceCrownSolids } from "./createHumanSourceCrownSolids.ts";
import { createHumanSourceCrownTopology } from "./createHumanSourceCrownTopology.ts";
import { measureHumanSourceIncisorRelation } from "./measureHumanSourceIncisorRelation.ts";
import type { IHumanSourceCrownSolid } from "./structures/IHumanSourceCrownSolid.ts";
import type { IHumanSourceOcclusionReceipt } from "./structures/IHumanSourceOcclusionReceipt.ts";
import type { IHumanSourceOcclusionToothReading } from "./structures/IHumanSourceOcclusionToothReading.ts";

/** Authored overbite tolerance of the neutral occlusion, metres (oral design 9.1, E3). */
const OVERBITE_MINIMUM_METRES = 0.0013;
const OVERBITE_MAXIMUM_METRES = 0.0043;
/** Authored overjet of the neutral occlusion, metres (oral design 9.1, E4). */
const OVERJET_TARGET_METRES = 0.003;
/** Largest opening the search tries before refusing, and its resolution, metres. */
const SEARCH_LIMIT_METRES = 0.008;
const SEARCH_STEP_METRES = 0.0005;
const SEARCH_RESOLUTION_METRES = 0.00001;

/**
 * Find the least rigid opening of the mandibular dentition that leaves no
 * maxillary crown overlapping a mandibular one, and read the occlusion there.
 *
 * The movement is one translation of every dental vertex the mandible owns,
 * in the maxillary arch frame the oral lining uses. Its sagittal part is
 * fixed first: the mandible is set back or forward along the arch's forward
 * direction until the central incisor overjet equals the authored target.
 * Its occlusal part, along the arch plane normal on the crown side, is then
 * the least opening that clears every pair. It has no lateral part, since
 * the source is bilaterally symmetric. Arch form and crown shape are kept. Two crowns overlap when a vertex of either lies inside the
 * other's closed solid or their surfaces cross. The search steps the
 * translation up until no pair overlaps and then bisects to ten micrometres,
 * assuming overlap does not return once cleared within the stepped range.
 *
 * Overbite is the vertical lap of the central incisors: the maxillary incisal
 * edge taken as the crown extreme toward the mandible, the mandibular one as
 * the extreme toward the maxilla, compared along the occlusal direction.
 * Overjet compares their most anterior points along the arch's forward
 * direction. The overbite tolerance is an authored product convention; these
 * low-resolution crowns carry no cusp anatomy and the reading validates no
 * intercuspation, guidance or clinical occlusion.
 *
 * Nothing is edited here; `authorHumanSourceOcclusion` applies the result.
 */
export function solveHumanSourceOcclusion(face: IAutoMovieHumanFaceBasis): IHumanSourceOcclusionReceipt {
  const dental = face.surfaces.find((surface) => surface.id === "Human.teeth_base");
  if (dental === undefined) throw new Error("Occlusion needs the dental surface.");
  const crowns = readHumanFaceOralCrowns(face);
  const crownTopology = createHumanSourceCrownTopology(face);
  const frame = resolveHumanFaceOralArchFrame(crowns.filter((crown) => !crown.mandibular), dental.positions, false);
  const direction = frame.apical.map((value) => -value);
  const owned = (dental.attachments ?? []).filter((attachment) => attachment.owner === "jaw").flatMap((attachment) => attachment.rows.filter((_, at) => at % 2 === 0));
  if (owned.length === 0) throw new Error("Occlusion needs the mandible's dental attachment.");
  const moved = (retrusion: number, opening: number): number[] => {
    const positions = [...dental.positions];
    for (const vertex of owned)
      for (let axis = 0; axis < 3; axis++) positions[3 * vertex + axis] += opening * direction[axis] - retrusion * frame.forward[axis];
    return positions;
  };
  const point = (positions: readonly number[], vertex: number): number[] => positions.slice(3 * vertex, 3 * vertex + 3);
  const split = (positions: readonly number[]): IHumanSourceCrownSolid[][] => {
    const solids = createHumanSourceCrownSolids(face, positions, crownTopology);
    return [solids.filter((solid) => !solid.mandibular), solids.filter((solid) => solid.mandibular)];
  };
  const inside = (from: IHumanSourceCrownSolid, into: IHumanSourceCrownSolid): boolean =>
    from.vertices.some((vertex) => {
      const distance = into.signedDistance(point(from.mesh.positions, vertex));
      return distance < 0;
    });
  const overlapping = (positions: readonly number[]): number => {
    const [upper, lower] = split(positions);
    let pairs = 0;
    for (const above of upper)
      for (const below of lower)
        if (inside(above, below) || inside(below, above) || measureAutoMovieMeshCrossings(above.mesh, below.mesh).length !== 0) pairs++;
    return pairs;
  };
  const relation = (positions: readonly number[]) => measureHumanSourceIncisorRelation(face, positions, direction, frame.forward);
  const overbite = (positions: readonly number[]): number => relation(positions).overbiteMetres;
  const overjet = (positions: readonly number[]): number => relation(positions).overjetMetres;
  const before = overlapping(dental.positions);
  const overjetBefore = overjet(dental.positions);
  // A rigid setback changes the overjet by exactly its own length.
  const retrusion = OVERJET_TARGET_METRES - overjetBefore;
  const opened = (opening: number): number[] => moved(retrusion, opening);
  let translation = 0;
  if (overlapping(opened(0)) !== 0) {
    let clear = SEARCH_STEP_METRES;
    while (overlapping(opened(clear)) !== 0) {
      clear += SEARCH_STEP_METRES;
      if (clear > SEARCH_LIMIT_METRES) throw new Error("No rigid opening within the search limit clears the neutral occlusion.");
    }
    let blocked = clear - SEARCH_STEP_METRES;
    while (clear - blocked > SEARCH_RESOLUTION_METRES) {
      const middle = (clear + blocked) / 2;
      if (overlapping(opened(middle)) === 0) clear = middle;
      else blocked = middle;
    }
    translation = clear;
  }
  const positions = opened(translation);
  const [upper, lower] = split(positions);
  const reading = (solid: IHumanSourceCrownSolid): IHumanSourceOcclusionToothReading => {
    let least = Infinity;
    for (const vertex of solid.vertices)
      for (const above of upper) {
        const distance = above.signedDistance(point(positions, vertex));
        least = Math.min(least, distance);
      }
    return { crown: solid.id, distanceMetres: least };
  };
  const after = overbite(positions);
  return {
    direction, translationMetres: translation,
    overlappingPairsBefore: before, overlappingPairsAfter: overlapping(positions),
    overbiteBeforeMetres: overbite(dental.positions), overbiteAfterMetres: after,
    forward: [...frame.forward], retrusionMetres: retrusion,
    overjetBeforeMetres: overjetBefore, overjetAfterMetres: overjet(positions),
    posteriorContacts: lower.filter((solid) => Number(solid.id[1]) >= 4).map(reading),
    anteriorClearances: lower.filter((solid) => Number(solid.id[1]) <= 3).map(reading),
    mandibularVertices: owned.length,
    overbiteWithinTolerance: after >= OVERBITE_MINIMUM_METRES && after <= OVERBITE_MAXIMUM_METRES,
    qualification: "Rigid opening of the registered low-resolution crowns to a non-overlapping neutral; no intercuspation, guidance, tooth-height reauthoring or clinical occlusion.",
  };
}
