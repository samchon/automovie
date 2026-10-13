import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";
import { createHumanLoopHeight } from "./createHumanLoopHeight";
import { createHumanLoopParameterLookup } from "./createHumanLoopParameterLookup";
import { humanPersonCutBoneWeights } from "./humanPersonCutBoneWeights";
import { projectHumanLoopPoint } from "./projectHumanLoopPoint";

/**
 * Build four-influence face skin weights from the actual body collar source maps. Generated cuts bracket captured nearest-face polyline coordinates; caller-authored seams without cuts retain legacy angular lookup on neutral body geometry. Cut intersections accumulate complete endpoint bone maps before this owner's final top-four truncation.
 *
 * Pre-pose face height supplies t=clamp((y-loopHeight)/headReach,0,1), with dimensionless C2 smootherstep t³(10-15t+6t²). Explicit jaw vertices and samples at/above reach take the head alone; remaining samples blend collar maps with head influence. Stable weight sorting retains head-first then map insertion order on ties and normalizes the retained sum. Finite positive reach, valid source weights/nonzero total and aligned rows remain admitted input premises.
 *
 * Coordinates/reach use metres; weights are rig conventions, not measured tissue mechanics or clinical rotational capacity. The downstream body skinning owner applies these weights, including its position-dependent twist behavior; a head-only weight does not establish unconditional rigid behavior for every optional pose operator. No current displayed collar has been observed.
 *
 * @evidence contracts/common.md#principled-implementation Actual body source/cut bone maps and current face height determine the source-backed collar-to-head rig transition.
 * @evidence contracts/common.md#clear-and-simple-design Shared angular/polyline lookup and cut map readers own correspondence; this function owns smootherstep mixing, stable influence selection and four-slot output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixed empirical head-turn fraction replaces source weights, source maps remain complete before truncation, and conventional rig weights are not claimed clinical tissue or global seam acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact fade, jaw/head-only behavior, metre/dimensionless domains, legacy/generated branches and admitted finite-weight premises.
 * @evidence contracts/performance.md#efficient-algorithms Lookup setup follows boundary size; each non-head-only face sample pays binary bracket, nearest-face edge scan and small bone-map sorting, so total follows actual face/boundary populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One height/bracket setup and borrowed cut/source tables serve all face vertices without recomputing the seam or source crossing registration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned joints/four-slot arrays escape, while lookup/maps are call-local; no source evaluator, asset task or render resource is retained.
 */
export function createHumanPersonFaceSkin(props: {
  seam: IAutoMovieHumanPersonSeam;
  /** The face skin surface's evaluated positions, before posing. */
  face: readonly number[];
  /** The body skin surface's neutral positions. */
  body: readonly number[];
  /** The body skin's authored weight table. */
  bodySkin: {
    joints: readonly AutoMovieHumanoidBone[];
    boneIndices: readonly number[];
    weights: readonly number[];
  };
  /** Face skin vertices the mandible carries, by shared vertex number; they take the head whole. */
  jawVertices: readonly number[];
}): {
  joints: AutoMovieHumanoidBone[];
  boneIndices: number[];
  weights: number[];
} {
  const { seam, face, body, bodySkin, jawVertices }: typeof props = props;
  const point: (positions: readonly number[], vertex: number) => IAutoMovieVector3 = (positions: readonly number[], vertex: number): IAutoMovieVector3 => ({
    x: positions[vertex * 3],
    y: positions[vertex * 3 + 1],
    z: positions[vertex * 3 + 2],
  });
  const angleOf: (p: { x: number; z: number }) => number = (p: { x: number; z: number }): number =>
    Math.atan2(p.x - seam.axis.x, p.z - seam.axis.z);
  const loopHeight: ReturnType<typeof createHumanLoopHeight> = createHumanLoopHeight(
    seam.faceLoop.map((vertex: number): IAutoMovieVector3 => point(face, vertex)),
    seam.axis,
  );
  const reach: number = seam.collar.headReachMetres;
  const jaw: Set<number> = new Set(jawVertices);
  const facePoints: IAutoMovieVector3[] = seam.faceLoop.map((vertex: number): IAutoMovieVector3 => point(face, vertex));
  // Caller-authored seams without a cut retain their original angular lookup.
  // Generated cuts use the ordered shared face correspondence rather than
  // requiring a clipped native body contour to be a radial graph.
  const bracket: ReturnType<typeof createHumanLoopParameterLookup> =
    seam.cut === undefined
      ? createHumanLoopAzimuth(
          seam.bodyLoop.map((vertex: number): IAutoMovieVector3 => point(body, vertex)),
          seam.axis,
        ).bracket
      : createHumanLoopParameterLookup(
          seam.collar.follow.map(({ edge, fraction }: (typeof seam.collar.follow)[number]): number => edge + fraction),
          seam.faceLoop.length,
        );
  const joints: AutoMovieHumanoidBone[] = ["head"];
  const boneOf: (bone: AutoMovieHumanoidBone) => number = (bone: AutoMovieHumanoidBone): number => {
    let index: number = joints.indexOf(bone);
    if (index < 0) {
      index = joints.length;
      joints.push(bone);
    }
    return index;
  };
  /** The body's weights at a vertex, by bone. */
  const bodyWeights: (vertex: number) => Map<AutoMovieHumanoidBone, number> = (vertex: number): Map<AutoMovieHumanoidBone, number> =>
    humanPersonCutBoneWeights(bodySkin, vertex, seam.cut);
  const count: number = face.length / 3;
  const boneIndices: number[] = new Array<number>(count * 4).fill(0);
  const weights: number[] = new Array<number>(count * 4).fill(0);
  for (let vertex: number = 0; vertex < count; vertex++) {
    const p: IAutoMovieVector3 = point(face, vertex);
    const angle: number = angleOf(p);
    const t: number = jaw.has(vertex)
      ? 1
      : Math.min(1, Math.max(0, (p.y - loopHeight(angle)) / reach));
    if (t >= 1) {
      weights[vertex * 4] = 1;
      continue;
    }
    const smooth: number = t * t * t * (10 - 15 * t + 6 * t * t);
    const projected: ReturnType<typeof projectHumanLoopPoint> = projectHumanLoopPoint(facePoints, p);
    const { low, high, along }: ReturnType<typeof bracket> = bracket(
      seam.cut === undefined ? angle : projected.edge + projected.fraction,
    );
    const mixed: Map<AutoMovieHumanoidBone, number> = new Map<AutoMovieHumanoidBone, number>([["head", smooth]]);
    for (const [loop, share] of [
      [low, 1 - along],
      [high, along],
    ] as const)
      for (const [bone, weight] of bodyWeights(seam.bodyLoop[loop]))
        mixed.set(bone, (mixed.get(bone) ?? 0) + (1 - smooth) * share * weight);
    const kept: { index: number; weight: number }[] = [...mixed]
      .sort((a: [AutoMovieHumanoidBone, number], b: [AutoMovieHumanoidBone, number]): number => b[1] - a[1])
      .slice(0, 4)
      .map(([bone, weight]: [AutoMovieHumanoidBone, number]): { index: number; weight: number } => ({ index: boneOf(bone), weight }));
    const total: number = kept.reduce((sum: number, one: { index: number; weight: number }): number => sum + one.weight, 0);
    kept.forEach(({ index, weight }: { index: number; weight: number }, k: number): void => {
      boneIndices[vertex * 4 + k] = index;
      weights[vertex * 4 + k] = weight / total;
    });
  }
  return { joints, boneIndices, weights };
}
