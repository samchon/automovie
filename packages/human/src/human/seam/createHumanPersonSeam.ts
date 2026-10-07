import type { IAutoMovieVector3 } from "@automovie/interface";

import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { createHumanLoopHeight } from "./createHumanLoopHeight";
import { createHumanLoopParameterLookup } from "./createHumanLoopParameterLookup";
import { createHumanPersonCut } from "./createHumanPersonCut";
import { evaluateHumanPersonCut } from "./evaluateHumanPersonCut";
import { findHumanBoundaryLoops } from "./findHumanBoundaryLoops";
import { humanPersonCutBoneWeights } from "./humanPersonCutBoneWeights";
import { measureHumanHeadReach } from "./measureHumanHeadReach";
import { measureHumanNeckReach } from "./measureHumanNeckReach";
import { measureHumanSurfaceDistances } from "./measureHumanSurfaceDistances";
import { mergeHumanBoundaryLoops } from "./mergeHumanBoundaryLoops";
import { projectHumanLoopPoint } from "./projectHumanLoopPoint";

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
 *    its own azimuth is covered. The vertex-sampled signed height/radial
 *    margins define an affine scalar field on each source triangle. Clipping
 *    keeps its nonpositive portion with shared frozen edge intersections,
 *    avoiding a staircase boundary through lower source rows. This sampled
 *    cut approximates the analytic angular profile rather than reproducing it;
 * 3. the retained body boundary must be one loop, which `mergeHumanBoundaryLoops`
 *    joins to the face loop, in the order the body's vertices stand along it,
 *    with a logical adjacency stencil of the loops' own vertices. The person
 *    builder subdivides the two skins onto one boundary before display;
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
 * height profile requires the face loop to surround the axis once. The clipped
 * body contour may have local radial reversals; its nearest-face follow must
 * instead be cyclically ordered, as the merge owner strictly requires. The band
 * brackets that same projected face-edge coordinate, so a boundary source
 * reads its own displacement without assuming a radial body contour. The
 * decision embeds both revisions and reads no document, so it is derived once
 * per basis pair and every shape and pose after it only moves vertices.
 * Refusals name the cause: not one open loop on each skin, a retained body
 * boundary that is not one loop, or a retained loop that does not run along the
 * face loop in order.
 *
 * @evidence contracts/common.md#principled-implementation The covered interior is sampled from height against azimuth and the radial guard, then extended as a piecewise-linear scalar over source triangles; shared crossing stencils retain the lower portion rather than exposing a staircase row, without claiming an exact analytic angular cut; the merge, the loop walk and the Wendland weight each state their own premises, and the joined skin is checked to be an oriented manifold along the seam so a misoriented ribbon refuses instead of shipping.
 * @evidence contracts/common.md#clear-and-simple-design The function sequences named owners (loops, azimuth, distances, merge) in the order the data dependence forces and computes the frozen cut, its retained-loop follow table and the compact-support band.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex number, loop length or subject is special-cased; the constants are named in `HUMAN_PERSON_SEAM` with their status, and every unmet precondition refuses.
 * @evidence contracts/common.md#meaningful-documentation The comment states the four steps, the vertical-tube assumption, the refusals and that the result depends on the neutral surfaces only.
 * @evidence contracts/modeling.md#part-identity-and-grouping The seam relates the two existing skin surfaces by boundary source identities; its logical ribbon supplies adjacency rather than a third displayed skin part.
 * @evidence contracts/modeling.md#emitted-geometry The cut appends one vertex per strict crossing edge and retains at most two triangles per source triangle; the logical cross-loop stencil has one triangle per loop edge, and displayed subdivision is owned by stitchHumanPersonBoundary.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, +Z anterior, +X anatomical left, the frame both bases share; azimuth is about the vertical through the face loop's centroid.
 * @evidence contracts/modeling.md#shared-boundaries Each body crossing has one undirected-edge affine stencil shared by adjacent triangles and regions. The follow table associates the retained sampled contour with the face loop; collar alignment and stitchHumanPersonBoundary establish the final displayed common polyline, while the sampled contour is not the exact analytic angular cut.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel and varies with nothing but the two neutral surfaces.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The seam carries no anatomical value of its own; its reach is read from the body basis's authored skin weights (`measureHumanNeckReach`).
 * @evidenceExclude contracts/anatomy.md#permitted-range The function bounds no anatomical value; the composed documents' ranges are their owners'.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function createHumanPersonSeam(props: {
  face: { basis: string; surface: Skin };
  body: { basis: string; surface: Skin };
  reachMetres?: number;
  headReachMetres?: number;
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
    Math.max(
      ...bodyLoops[0].map((vertex) => around(point(body.surface, vertex))),
    );
  // Positive samples identify the height/radial covered interior; zero is retained.
  // Its affine extension inside each triangle is the declared approximation,
  // not an exact evaluation of the angular profile between source vertices.
  const margins = Array.from(
    { length: body.surface.positions.length / 3 },
    (_, vertex) => {
      const p = point(body.surface, vertex);
      return Math.min(
        guard - around(p),
        p.y - faceHeight(Math.atan2(p.x - centre.x, p.z - centre.z)),
      );
    },
  );
  const covered = [...new Set(body.surface.indices)]
    .filter((vertex) => margins[vertex] > 0)
    .sort((a, b) => a - b);
  const cut = createHumanPersonCut(body.surface.indices, margins);
  const kept = cut.indices;
  const bodySurface = {
    ...body.surface,
    positions: evaluateHumanPersonCut(body.surface.positions, cut),
  };
  const retained = findHumanBoundaryLoops(kept);
  if (retained.length !== 1)
    throw new Error(
      "Covering the overlap leaves " +
        retained.length +
        " open loops on the body skin; the seam needs exactly one.",
    );
  const bodyLoop = retained[0];
  const bodyPoints = bodyLoop.map((vertex) => point(bodySurface, vertex));
  const follow = bodyPoints.map((p) => projectHumanLoopPoint(facePoints, p));

  // each retained loop vertex stands at a position along the face loop, and
  // the two loops are merged in that order
  const ribbon = mergeHumanBoundaryLoops(
    facePoints.length,
    follow.map(({ edge, fraction }) => edge + fraction),
  );
  // The joined skin must be an oriented manifold along the seam: the ribbon
  // runs opposite to every surface edge it meets, and a directed edge held
  // twice (a misoriented loop) refuses in the boundary walk.
  const faceCount = face.surface.positions.length / 3;
  findHumanBoundaryLoops([
    ...face.surface.indices,
    ...kept.map((vertex) => vertex + faceCount),
    ...ribbon.map((local) =>
      local < faceLoop.length
        ? faceLoop[local]
        : bodyLoop[local - faceLoop.length] + faceCount,
    ),
  ]);

  const distance = measureHumanSurfaceDistances(
    bodySurface.positions,
    kept,
    bodyLoop,
  );
  const reachMetres =
    props.reachMetres ??
    (body.surface.skin === undefined
      ? Number.NaN
      : measureHumanNeckReach(distance, (vertex) => {
          const weights = humanPersonCutBoneWeights(
            body.surface.skin!,
            vertex,
            cut,
          );
          const bone = [...weights].sort((a, b) => b[1] - a[1])[0][0];
          return bone === "neck" || bone === "head";
        }));
  if (!(reachMetres > 0) || !Number.isFinite(reachMetres))
    throw new Error(
      "The seam needs a positive finite reach, given or read from the body's skin weights.",
    );
  const headReachMetres =
    props.headReachMetres ??
    (body.surface.skin === undefined
      ? Number.NaN
      : measureHumanHeadReach(
          distance,
          (vertex) => {
            return (
              humanPersonCutBoneWeights(body.surface.skin!, vertex, cut).get(
                "head",
              ) ?? 0
            );
          },
          reachMetres,
        ));
  if (!(headReachMetres > 0) || !Number.isFinite(headReachMetres))
    throw new Error(
      "The seam needs a positive finite head reach, given or read from the body's skin weights.",
    );
  const bracket = createHumanLoopParameterLookup(
    follow.map(({ edge, fraction }) => edge + fraction),
    faceLoop.length,
  );
  const boundaryAt = new Map(bodyLoop.map((vertex, index) => [vertex, index]));
  const band: IAutoMovieHumanPersonSeam["collar"]["band"] = [];
  for (let vertex = 0; vertex < distance.length; vertex++) {
    if (!(distance[vertex] < reachMetres)) continue;
    const p = point(bodySurface, vertex);
    const projected = projectHumanLoopPoint(facePoints, p);
    // Boundary sources retain their own Dirichlet displacement even when two
    // native points project to the same face sample. Interior lookup uses the
    // last tied resident; final collapsed samples belong to the stitch owner.
    const boundary = boundaryAt.get(vertex);
    const { low, high, along } =
      boundary === undefined
        ? bracket(projected.edge + projected.fraction)
        : { low: boundary, high: boundary, along: 0 };
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
    cut,
    ribbon,
    collar: { reachMetres, headReachMetres, follow, band },
  };
}
