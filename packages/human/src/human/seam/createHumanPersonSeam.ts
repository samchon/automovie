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
 * Compile one captured neck correspondence from admitted neutral face/body skin in a common metre Y-up frame. Each source must expose one open loop. The face loop's centroid defines the vertical axis and sampled angular height; the caller supplies its radial single-turn geometry. Body coverage is the minimum of height margin and radial margin, with guard 1.5 times original body-loop radius. Its affine triangle cut retains nonpositive margins and approximates the analytic profile.
 *
 * The retained body contour must remain one loop and project cyclically onto nearest face edges. A logical ribbon checks directed boundary compatibility; it is not emitted surface geometry or a complete manifold/embedding certificate. Downstream stitching creates common boundary samples and refuses unsupported registered insertions. Source IDs here remain indices of captured tables rather than newly authenticated physical lineage.
 *
 * Dijkstra edge-chain distances define transition reach. Absent explicit metre overrides, sampled dominant-bone count uses neckShare=0.5 and sampled head-weight mass uses headShare=0.95; these source rig conventions are not clinical neck limits or area-weighted geodesic measurements. Positive finite reaches are required. Band weights use (1-r)^4(4r+1); each boundary source keeps its own fixed weight-one displacement even when follow coordinates tie. Interior follows the shared projected parameter bracket. Large later mismatch can fold/compress the band and requires actual geometry/visual review.
 *
 * The result owns captured cut/loop/follow/band arrays but does not runtime-freeze them. Source context and captured records must remain unchanged for later documents. This compilation observes no current healthy Human pixels or anatomical measurement.
 *
 * @evidence contracts/common.md#principled-implementation Actual source incidence, sampled face profile, affine body cut and source bone weights determine one reusable boundary/fade correspondence.
 * @evidence contracts/common.md#clear-and-simple-design Boundary walking, scalar cut, cyclic merge, edge distances and rig reach remain shared owners; this compiler composes them and fixes boundary/interior band records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/incompatible loops or nonpositive/nonfinite reach refuse, logical ribbon checks are not promoted into a rendered/global manifold proof, and sampled source rig conventions do not invent clinical reach.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact guard/share/fade constants, edge-chain distance, captured-array premises, fixed boundary ties and later mismatch limits.
 * @evidence contracts/performance.md#efficient-algorithms Source incidence/cut scans, per-vertex profile brackets, nearest-face edge projections, heap distance traversal and reach sorts pay their actual populations; no constant-cost or linear-only compilation is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted source pair supplies captured cut/follow/band records to repeated document evaluation without rebuilding topology or reach on each pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned source-sized cut/loop/band arrays own their storage; coordinate/heap/projection workspace is call-local and no worker, asset fetch or render resource is acquired.
 */
export function createHumanPersonSeam(props: {
  face: { basis: string; surface: Skin };
  body: { basis: string; surface: Skin };
  reachMetres?: number;
  headReachMetres?: number;
}): IAutoMovieHumanPersonSeam {
  const { face, body }: typeof props = props;
  const point: (skin: Skin, vertex: number) => IAutoMovieVector3 = (skin: Skin, vertex: number): IAutoMovieVector3 => ({
    x: skin.positions[vertex * 3],
    y: skin.positions[vertex * 3 + 1],
    z: skin.positions[vertex * 3 + 2],
  });
  const faceLoops: number[][] = findHumanBoundaryLoops(face.surface.indices);
  const bodyLoops: number[][] = findHumanBoundaryLoops(body.surface.indices);
  if (faceLoops.length !== 1 || bodyLoops.length !== 1)
    throw new Error(
      "The seam needs one open loop on each skin: the face has " +
        faceLoops.length +
        " and the body " +
        bodyLoops.length +
        ".",
    );
  const faceLoop: number[] = faceLoops[0];
  const facePoints: IAutoMovieVector3[] = faceLoop.map((vertex: number): IAutoMovieVector3 => point(face.surface, vertex));
  const centre: { x: number; z: number } = {
    x: facePoints.reduce((sum: number, p: IAutoMovieVector3): number => sum + p.x, 0) / facePoints.length,
    z: facePoints.reduce((sum: number, p: IAutoMovieVector3): number => sum + p.z, 0) / facePoints.length,
  };
  const around: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number =>
    Math.hypot(p.x - centre.x, p.z - centre.z);
  const faceHeight: ReturnType<typeof createHumanLoopHeight> = createHumanLoopHeight(facePoints, centre);

  const guard: number =
    HUMAN_PERSON_SEAM.radialGuard *
    Math.max(
      ...bodyLoops[0].map((vertex: number): number => around(point(body.surface, vertex))),
    );
  // Positive samples identify the height/radial covered interior; zero is retained.
  // Its affine extension inside each triangle is the declared approximation,
  // not an exact evaluation of the angular profile between source vertices.
  const margins: number[] = Array.from(
    { length: body.surface.positions.length / 3 },
    (_: unknown, vertex: number): number => {
      const p: IAutoMovieVector3 = point(body.surface, vertex);
      return Math.min(
        guard - around(p),
        p.y - faceHeight(Math.atan2(p.x - centre.x, p.z - centre.z)),
      );
    },
  );
  const covered: number[] = [...new Set(body.surface.indices)]
    .filter((vertex: number): boolean => margins[vertex] > 0)
    .sort((a: number, b: number): number => a - b);
  const cut: ReturnType<typeof createHumanPersonCut> = createHumanPersonCut(body.surface.indices, margins);
  const kept: number[] = cut.indices;
  const bodySurface: Skin = {
    ...body.surface,
    positions: evaluateHumanPersonCut(body.surface.positions, cut),
  };
  const retained: number[][] = findHumanBoundaryLoops(kept);
  if (retained.length !== 1)
    throw new Error(
      "Covering the overlap leaves " +
        retained.length +
        " open loops on the body skin; the seam needs exactly one.",
    );
  const bodyLoop: number[] = retained[0];
  const bodyPoints: IAutoMovieVector3[] = bodyLoop.map((vertex: number): IAutoMovieVector3 => point(bodySurface, vertex));
  const follow: ReturnType<typeof projectHumanLoopPoint>[] = bodyPoints.map((p: IAutoMovieVector3): ReturnType<typeof projectHumanLoopPoint> => projectHumanLoopPoint(facePoints, p));

  // each retained loop vertex stands at a position along the face loop, and
  // the two loops are merged in that order
  const ribbon: number[] = mergeHumanBoundaryLoops(
    facePoints.length,
    follow.map(({ edge, fraction }: ReturnType<typeof projectHumanLoopPoint>): number => edge + fraction),
  );
  // Check directed boundary compatibility of the logical ribbon; this does not certify global embedding/manifoldness.
  const faceCount: number = face.surface.positions.length / 3;
  findHumanBoundaryLoops([
    ...face.surface.indices,
    ...kept.map((vertex: number): number => vertex + faceCount),
    ...ribbon.map((local: number): number =>
      local < faceLoop.length
        ? faceLoop[local]
        : bodyLoop[local - faceLoop.length] + faceCount,
    ),
  ]);

  const distance: Float64Array = measureHumanSurfaceDistances(
    bodySurface.positions,
    kept,
    bodyLoop,
  );
  const reachMetres: number =
    props.reachMetres ??
    (body.surface.skin === undefined
      ? Number.NaN
      : measureHumanNeckReach(distance, (vertex: number): boolean => {
          const weights: Map<string, number> = humanPersonCutBoneWeights(
            body.surface.skin!,
            vertex,
            cut,
          );
          const bone: string = [...weights].sort((a: [string, number], b: [string, number]): number => b[1] - a[1])[0][0];
          return bone === "neck" || bone === "head";
        }));
  if (!(reachMetres > 0) || !Number.isFinite(reachMetres))
    throw new Error(
      "The seam needs a positive finite reach, given or read from the body's skin weights.",
    );
  const headReachMetres: number =
    props.headReachMetres ??
    (body.surface.skin === undefined
      ? Number.NaN
      : measureHumanHeadReach(
          distance,
          (vertex: number): number => {
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
  const bracket: ReturnType<typeof createHumanLoopParameterLookup> = createHumanLoopParameterLookup(
    follow.map(({ edge, fraction }: ReturnType<typeof projectHumanLoopPoint>): number => edge + fraction),
    faceLoop.length,
  );
  const boundaryAt: Map<number, number> = new Map(bodyLoop.map((vertex: number, index: number): [number, number] => [vertex, index]));
  const band: IAutoMovieHumanPersonSeam["collar"]["band"] = [];
  for (let vertex: number = 0; vertex < distance.length; vertex++) {
    if (!(distance[vertex] < reachMetres)) continue;
    const p: IAutoMovieVector3 = point(bodySurface, vertex);
    const projected: ReturnType<typeof projectHumanLoopPoint> = projectHumanLoopPoint(facePoints, p);
    // Boundary sources retain their own Dirichlet displacement even when two
    // native points project to the same face sample. Interior lookup uses the
    // last tied resident; final collapsed samples belong to the stitch owner.
    const boundary: number | undefined = boundaryAt.get(vertex);
    const { low, high, along }: ReturnType<typeof bracket> =
      boundary === undefined
        ? bracket(projected.edge + projected.fraction)
        : { low: boundary, high: boundary, along: 0 };
    const r: number = distance[vertex] / reachMetres;
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
