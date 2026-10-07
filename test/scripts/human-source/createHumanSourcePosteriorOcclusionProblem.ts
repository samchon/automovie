import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import { resolveHumanFaceOralArchFrame } from "@automovie/human/face/anatomy/oral/resolveHumanFaceOralArchFrame";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { measureHumanSourceCrownDimensions } from "./measureHumanSourceCrownDimensions.ts";
import { createHumanSourceCrownAffineFrames } from "./createHumanSourceCrownAffineFrames.ts";
import { createHumanSourceCrownTopology } from "./createHumanSourceCrownTopology.ts";
import { measureHumanSourceIncisorRelation } from "./measureHumanSourceIncisorRelation.ts";
import type { IHumanSourcePosteriorOcclusionProblem } from "./structures/IHumanSourcePosteriorOcclusionProblem.ts";

/** Authored source neutral incisor targets, metres; not population means. */
const OVERBITE = 0.0028, OVERJET = 0.003;

/**
 * Freeze all native source crown axes before coupled occlusion search.
 *
 * Each native crown has independent source width/depth/height about its actual
 * cervical centroid. Paired anatomical sides share scales. The one lower-arch
 * OB/OJ placement is recomputed after each candidate geometry, preserving the
 * unchanged incisor targets rather than freezing anterior contacts beyond
 * every control. Positive axis scales preserve mathematical orientation/rank.
 * Finite-arithmetic failure still refuses in the actual mesh-query owner.
 *
 * Frames are formed once from the immutable original, so search order
 * introduces no cumulative deformation. These geometric source axes are not
 * a clinical gingival/cusp protocol; no unknown height is filled by a mean.
 */
export function createHumanSourcePosteriorOcclusionProblem(face: IAutoMovieHumanFaceBasis): IHumanSourcePosteriorOcclusionProblem {
  const dental = face.surfaces.find((surface) => surface.id === "Human.teeth_base");
  if (dental === undefined) throw new Error("Posterior occlusion needs the source dental surface.");
  const crowns = readHumanFaceOralCrowns(face);
  const frame = resolveHumanFaceOralArchFrame(crowns.filter((crown) => !crown.mandibular), dental.positions, false);
  const direction = frame.apical.map((value) => -value), forward = [...frame.forward];
  const relation = measureHumanSourceIncisorRelation(face, dental.positions, direction, forward);
  const translation = direction.map((value, axis) =>
    (relation.overbiteMetres - OVERBITE) * value - (OVERJET - relation.overjetMetres) * forward[axis]);
  const owned = new Set((dental.attachments ?? []).filter((attachment) => attachment.owner === "jaw")
    .flatMap((attachment) => attachment.rows.filter((_, at) => at % 2 === 0)));
  if (owned.size === 0) throw new Error("Posterior occlusion needs actual mandibular dental ownership.");
  const base = [...dental.positions];
  for (const vertex of owned)
    for (let axis = 0; axis < 3; axis++) base[3 * vertex + axis] += translation[axis];
  const dimensions = measureHumanSourceCrownDimensions(face);
  const frames = createHumanSourceCrownAffineFrames(face);
  const parameters = ["U", "L"].flatMap((arch) => Array.from({ length: 8 }, (_, at) => ["width", "depth", "height"].map((axis) => `${arch}${at + 1}:${axis}`)).flat());
  for (const crown of crowns) {
    if (crown.vertices.some((vertex) => owned.has(vertex) !== crown.mandibular))
      throw new Error(`Crown ${crown.id} disagrees with its source mandibular ownership.`);
  }
  return { face, crownTopology: createHumanSourceCrownTopology(face), originalPositions: [...dental.positions], basePositions: base, parameters, dimensions, frames,
    direction, forward, mandibularTranslationMetres: translation, mandibularVertices: [...owned].sort((a, b) => a - b),
    overbiteTargetMetres: OVERBITE, overjetTargetMetres: OVERJET };
}
