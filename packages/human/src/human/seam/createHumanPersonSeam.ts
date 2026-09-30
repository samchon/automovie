import type { IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { countHumanRibbonFolds } from "./countHumanRibbonFolds";
import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";
import { createHumanLoopHeight } from "./createHumanLoopHeight";
import { findHumanBoundaryLoops } from "./findHumanBoundaryLoops";
import { measureHumanNeckReach } from "./measureHumanNeckReach";
import { measureHumanSurfaceDistances } from "./measureHumanSurfaceDistances";
import { zipHumanBoundaryLoops } from "./zipHumanBoundaryLoops";

/** One connected skin surface as a basis holds it: shared vertices and oriented triangles. */
type Skin = {
  id: string;
  positions: readonly number[];
  indices: readonly number[];
  /** Four-influence skin weights per vertex, when the surface is skinned. */
  skin?: {
    joints: readonly string[];
    boneIndices: readonly number[];
    weights: readonly number[];
  };
};

/**
 * Decide, from the neutral surfaces alone, how a face skin and a body skin
 * become one skin at the neck.
 *
 * The face's skin ends in one open loop under the chin and the body's in one
 * open loop above the shoulders, and both describe the same neck: the body's
 * loop lies above the face's, so the two overlap in a band a few millimetres
 * high, which as two layers would show a seam of double skin. The face owns
 * the neck's form, so the body gives that band up:
 *
 * 1. the face loop's height is read as a function of azimuth about the neck
 *    axis (the vertical through the loop's centroid, `createHumanLoopAzimuth`);
 * 2. every body vertex near the neck (within `HUMAN_PERSON_SEAM.radialGuard`
 *    times the body loop's greatest radius) that lies above that height at
 *    its own azimuth is covered, and every triangle touching one is removed,
 *    which leaves every retained boundary vertex at or below the face loop
 *    and so a ribbon that never runs back over the face's own triangles;
 * 3. the retained body boundary must be one loop, which `zipHumanBoundaryLoops`
 *    joins to the face loop with a ribbon of the loops' own vertices;
 * 4. the retained loop follows the nearest face loop edge, and body skin
 *    within the reach along the surface (the extent of the neck by the body's
 *    own skin weights, `measureHumanNeckReach`, unless `reachMetres` is given)
 *    follows the loop with a C2
 *    compact-support weight (Wendland's (1 - r)^4 (4 r + 1), one at the loop
 *    and smooth to zero at the reach), so a face whose neck differs from the
 *    body's is met without moving the shoulder.
 *
 * The neck is taken to be a roughly vertical tube at the neutral, which the
 * frame's Y-up convention and the anatomical position give; the azimuth
 * parameterization refuses a loop that does not surround the axis once. The
 * decision embeds both revisions and reads no document, so it is derived once
 * per basis pair and every shape and pose after it only moves vertices.
 * Refusals name the cause: not one open loop on each skin, a retained body
 * boundary that is not one loop, or a ribbon whose triangles face against the
 * surfaces at the neutral.
 *
 * @evidence contracts/common.md#principled-implementation The covered set is the body skin above the face's cut, decided by height against azimuth, which is the one relation two overlapping cuts of one vertical tube determine; the zipper, the loop walk and the Wendland weight each state their own premises, and the ribbon check compares its triangle normals with the neck's outward direction so a fold at the neutral refuses instead of shipping.
 * @evidence contracts/common.md#clear-and-simple-design The function sequences named owners (loops, azimuth, distances, zipper) in the order the data dependence forces and computes only the covered set, the follow table and the band itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex number, loop length or subject is special-cased; the constants are named in `HUMAN_PERSON_SEAM` with their status, and every unmet precondition refuses.
 * @evidence contracts/common.md#meaningful-documentation The comment states the four steps, the vertical-tube assumption, the refusals and that the result depends on the neutral surfaces only.
 * @evidence contracts/modeling.md#part-identity-and-grouping The seam is a relation between two existing parts, the face skin and the body skin; it adds a ribbon that belongs to neither, named in the composed model as its own part.
 * @evidence contracts/modeling.md#emitted-geometry The ribbon has one triangle per loop edge, the fewest a strip between two closed loops can have, and no other geometry is emitted.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, +Z anterior, +X anatomical left, the frame both bases share; azimuth is about the vertical through the face loop's centroid.
 * @evidence contracts/modeling.md#shared-boundaries The ribbon's vertices are the two loops' own, so both sides share one definition of the boundary and the seam has no vertex of its own that could disagree; covering the overlap leaves no double layer at the neutral.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel and varies with nothing but the two neutral surfaces.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The seam carries no anatomical value of its own; its reach is read from the body basis's authored skin weights (`measureHumanNeckReach`).
 * @evidenceExclude contracts/anatomy.md#permitted-range The function bounds no anatomical value; the composed documents' ranges are their owners'.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function createHumanPersonSeam(props: {
  face: { basis: string; surface: Skin };
  body: { basis: string; surface: Skin };
  reachMetres?: number;
}): IAutoMovieHumanPersonSeam {
  const { face, body } = props;
  const point = (skin: Skin, vertex: number): IAutoMovieVector3 => ({
    x: skin.positions[vertex * 3],
    y: skin.positions[vertex * 3 + 1],
    z: skin.positions[vertex * 3 + 2],
  });
  const faceLoops = findHumanBoundaryLoops(face.surface.indices);
  const bodyLoops = findHumanBoundaryLoops(body.surface.indices);
  if (faceLoops.length !== 1 || bodyLoops.length !== 1)
    throw new Error(
      "The seam needs one open loop on each skin: the face has " +
        faceLoops.length +
        " and the body " +
        bodyLoops.length +
        ".",
    );
  const faceLoop = faceLoops[0];
  const facePoints = faceLoop.map((vertex) => point(face.surface, vertex));
  const centre = {
    x: facePoints.reduce((sum, p) => sum + p.x, 0) / facePoints.length,
    z: facePoints.reduce((sum, p) => sum + p.z, 0) / facePoints.length,
  };
  const around = (p: IAutoMovieVector3): number =>
    Math.hypot(p.x - centre.x, p.z - centre.z);
  const faceHeight = createHumanLoopHeight(facePoints, centre);

  const guard =
    HUMAN_PERSON_SEAM.radialGuard *
    Math.max(...bodyLoops[0].map((vertex) => around(point(body.surface, vertex))));
  const used = new Set(body.surface.indices);
  const covered: number[] = [];
  for (const vertex of [...used].sort((a, b) => a - b)) {
    const p = point(body.surface, vertex);
    if (
      around(p) <= guard &&
      p.y > faceHeight(Math.atan2(p.x - centre.x, p.z - centre.z))
    )
      covered.push(vertex);
  }
  const removed = new Set(covered);
  const kept: number[] = [];
  for (let corner = 0; corner < body.surface.indices.length; corner += 3) {
    const triangle = body.surface.indices.slice(corner, corner + 3);
    if (!triangle.some((vertex) => removed.has(vertex))) kept.push(...triangle);
  }
  const retained = findHumanBoundaryLoops(kept);
  if (retained.length !== 1)
    throw new Error(
      "Covering the overlap leaves " +
        retained.length +
        " open loops on the body skin; the seam needs exactly one.",
    );
  const bodyLoop = retained[0];
  const bodyPoints = bodyLoop.map((vertex) => point(body.surface, vertex));
  const bodyAzimuth = createHumanLoopAzimuth(bodyPoints, centre);

  const ribbon = zipHumanBoundaryLoops(facePoints, bodyPoints);
  // A ribbon triangle must face as the skin it joins does at each corner.
  const faceNormals = areaWeightedNormals(
    Array.from(face.surface.positions),
    Array.from(face.surface.indices),
  );
  const bodyNormals = areaWeightedNormals(
    Array.from(body.surface.positions),
    kept,
  );
  const { folded } = countHumanRibbonFolds(
    ribbon,
    [...facePoints, ...bodyPoints],
    [
      ...faceLoop.flatMap((vertex) => faceNormals.slice(vertex * 3, vertex * 3 + 3)),
      ...bodyLoop.flatMap((vertex) => bodyNormals.slice(vertex * 3, vertex * 3 + 3)),
    ],
  );
  if (folded > 0)
    throw new Error(
      "The ribbon folds against the neck in " +
        folded +
        " triangles at the neutral.",
    );

  const follow = bodyPoints.map((p) => {
    let best = { edge: 0, fraction: 0, distance: Infinity };
    for (let edge = 0; edge < facePoints.length; edge++) {
      const a = facePoints[edge];
      const b = facePoints[(edge + 1) % facePoints.length];
      const along = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
      const length = along.x * along.x + along.y * along.y + along.z * along.z;
      const raw =
        length === 0
          ? 0
          : ((p.x - a.x) * along.x +
              (p.y - a.y) * along.y +
              (p.z - a.z) * along.z) /
            length;
      const fraction = Math.min(1, Math.max(0, raw));
      const distance = Math.hypot(
        p.x - (a.x + along.x * fraction),
        p.y - (a.y + along.y * fraction),
        p.z - (a.z + along.z * fraction),
      );
      if (distance < best.distance) best = { edge, fraction, distance };
    }
    return { edge: best.edge, fraction: best.fraction };
  });

  const distance = measureHumanSurfaceDistances(
    body.surface.positions,
    kept,
    bodyLoop,
  );
  const reachMetres =
    props.reachMetres ??
    (body.surface.skin === undefined
      ? Number.NaN
      : measureHumanNeckReach(distance, (vertex) => {
          const skin = body.surface.skin!;
          let dominant = 0;
          for (let k = 1; k < 4; k++)
            if (skin.weights[vertex * 4 + k] > skin.weights[vertex * 4 + dominant])
              dominant = k;
          const bone = skin.joints[skin.boneIndices[vertex * 4 + dominant]];
          return bone === "neck" || bone === "head";
        }));
  if (!(reachMetres > 0) || !Number.isFinite(reachMetres))
    throw new Error(
      "The seam needs a positive finite reach, given or read from the body's skin weights.",
    );
  const band: IAutoMovieHumanPersonSeam["collar"]["band"] = [];
  for (let vertex = 0; vertex < distance.length; vertex++) {
    if (!(distance[vertex] < reachMetres)) continue;
    const p = point(body.surface, vertex);
    const { low, high, along } = bodyAzimuth.bracket(
      Math.atan2(p.x - centre.x, p.z - centre.z),
    );
    const r = distance[vertex] / reachMetres;
    band.push({
      vertex,
      low,
      high,
      along,
      weight: (1 - r) ** 4 * (4 * r + 1),
    });
  }
  return {
    axis: centre,
    faceBasis: face.basis,
    bodyBasis: body.basis,
    faceSurface: face.surface.id,
    bodySurface: body.surface.id,
    faceLoop,
    bodyLoop,
    covered,
    ribbon,
    collar: { reachMetres, follow, band },
  };
}
