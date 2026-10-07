import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { measureHumanFaceMarginGaps } from "@automovie/human/face/basis/measureHumanFaceMarginGaps";
import { resolveHumanFaceApertureUp } from "@automovie/human/face/basis/resolveHumanFaceApertureUp";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieMesh } from "@automovie/interface";

import { createHumanSourceCrownSolids } from "./createHumanSourceCrownSolids.ts";
import type { IHumanSourceOralCensus } from "./structures/IHumanSourceOralCensus.ts";
import type { IHumanSourceOralCrownReading } from "./structures/IHumanSourceOralCrownReading.ts";
import type { IHumanSourceOralPairReading } from "./structures/IHumanSourceOralPairReading.ts";

/**
 * Measure the tongue against every crown, and every maxillary crown against
 * every mandibular crown, at the source neutral.
 *
 * Crowns are the closed solids of `createHumanSourceCrownSolids`. A vertex is
 * inside when its signed distance to a solid is negative, and a crossing is a
 * transversal triangle pair from the engine's crossing measure. Both are
 * reported, because a surface can cross another without any vertex ending
 * inside it.
 *
 * Only source neutral positions are read: no shape channel, jaw articulation
 * or contact pass. A penetration found here is therefore authored into the
 * source and not a channel that fails to carry a part. Tongue rest height,
 * occlusion and tissue contact are not judged; the reading only locates where
 * two source solids occupy the same space.
 */
export function measureHumanSourceOralSpace(
  face: IAutoMovieHumanFaceBasis,
): IHumanSourceOralCensus {
  const support = face.oralSupport;
  if (support === undefined)
    throw new Error("The face basis registers no oral support.");
  const dental = face.surfaces.find(
    (surface) => surface.id === support.dentalSurface,
  );
  const tongue = face.surfaces.find(
    (surface) => surface.id === support.tongueSurface,
  );
  if (dental === undefined || tongue === undefined)
    throw new Error("The oral census needs the dental and tongue surfaces.");
  const solids = createHumanSourceCrownSolids(face, dental.positions);
  const pointsOf = (
    positions: readonly number[],
    vertices: Iterable<number>,
  ): number[][] =>
    Array.from(vertices, (vertex) =>
      positions.slice(3 * vertex, 3 * vertex + 3),
    );
  const tongueMesh: IAutoMovieMesh = {
    positions: tongue.positions,
    indices: tongue.indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  const tonguePoints = pointsOf(tongue.positions, new Set(tongue.indices));
  const readings = solids.map((solid): IHumanSourceOralCrownReading => {
    let inside = 0,
      deepest = 0,
      boundary = 0;
    for (const point of tonguePoints) {
      const hit = solid.query(point);
      if (hit.boundary) {
        boundary++;
        continue;
      }
      const distance = hit.signedDistance;
      if (distance < 0) {
        inside++;
        deepest = Math.max(deepest, -distance);
      }
    }
    if (boundary !== 0)
      throw new Error(
        `Closed source crown ${solid.id} left ${boundary} tongue query sides undefined.`,
      );
    return {
      crown: solid.id,
      owner: solid.mandibular ? "jaw" : "head",
      tongueVerticesInside: inside,
      tongueDeepestMetres: deepest,
      tongueCrossingTriangles: measureAutoMovieMeshCrossings(
        tongueMesh,
        solid.mesh,
      ).length,
      boundaryVertices: boundary,
    };
  });
  const upper = solids.filter((solid) => !solid.mandibular),
    lower = solids.filter((solid) => solid.mandibular);
  const pairs: IHumanSourceOralPairReading[] = [];
  for (const above of upper)
    for (const below of lower) {
      let upperInside = 0,
        lowerInside = 0,
        deepest = 0;
      for (const point of pointsOf(dental.positions, above.vertices)) {
        const distance = below.signedDistance(point);
        if (distance < 0) {
          upperInside++;
          deepest = Math.max(deepest, -distance);
        }
      }
      for (const point of pointsOf(dental.positions, below.vertices)) {
        const distance = above.signedDistance(point);
        if (distance < 0) {
          lowerInside++;
          deepest = Math.max(deepest, -distance);
        }
      }
      const crossing = measureAutoMovieMeshCrossings(
        above.mesh,
        below.mesh,
      ).length;
      if (upperInside !== 0 || lowerInside !== 0 || crossing !== 0)
        pairs.push({
          upper: above.id,
          lower: below.id,
          upperVerticesInsideLower: upperInside,
          lowerVerticesInsideUpper: lowerInside,
          deepestMetres: deepest,
          crossingTriangles: crossing,
        });
    }
  let lipMarginGapsMetres: number[] | null = null;
  if (face.contact?.margin !== undefined && face.articulation !== undefined) {
    const skin = face.surfaces.find(
      (surface) => surface.id === face.contact!.lips.surface,
    );
    if (skin === undefined)
      throw new Error("Oral source margin has no registered host skin.");
    lipMarginGapsMetres = measureHumanFaceMarginGaps(
      skin.positions,
      face.contact.margin,
      face.articulation.jaw.axis,
      resolveHumanFaceApertureUp(face.articulation.jaw.axis),
    );
  }
  return {
    tongueSurface: support.tongueSurface,
    dentalSurface: support.dentalSurface,
    crowns: readings,
    antagonistPairsTested: upper.length * lower.length,
    antagonistPairs: pairs,
    lipMarginGapsMetres,
    lipContactToleranceMetres: face.contact?.toleranceMetres ?? null,
  };
}
