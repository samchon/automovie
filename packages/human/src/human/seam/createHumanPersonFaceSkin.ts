import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";
import { createHumanLoopHeight } from "./createHumanLoopHeight";
import { createHumanLoopParameterLookup } from "./createHumanLoopParameterLookup";
import { humanPersonCutBoneWeights } from "./humanPersonCutBoneWeights";
import { projectHumanLoopPoint } from "./projectHumanLoopPoint";

/**
 * Four-influence skin weights for the face's skin surface, so that its neck is
 * carried by the same bones as the body skin it meets.
 *
 * The face is built in the head's frame and rides the head. Its skin below the
 * chin is neck, though, and a head turned by forty degrees turns the body's
 * collar only partly (the body's own weights there give the head about a fifth
 * of the movement and the neck bone most of the rest), so a face that followed
 * the head alone would tear away from the collar it is joined to. The weights
 * that fix this are read from the body itself:
 *
 * - at the face's nearest polyline parameter the body's retained loop has
 *   weights interpolated between the corresponding two follow samples
 *   (`createHumanLoopParameterLookup`), the collar's weights on that side. A frozen
 *   cut intersection reads its original endpoints' complete bone-wise affine
 *   map before this face owner's final four-influence limit;
 * - the mandible's skin is the head's whole. `jawVertices` are the face skin
 *   vertices the jaw carries (attachment weight above
 *   `HUMAN_PERSON_SEAM.jawShare`), and they take the head alone whatever their
 *   height above the cut: the chin does not slide under the collar, and the
 *   fold under it is where the skin of the neck starts;
 * - a face vertex at height `y` above the loop's height at its azimuth is
 *   `t = (y - loop) / reach` of the way from the neck to the head, blended with
 *   the C2 smootherstep `t^3 (10 - 15 t + 6 t^2)`, so it takes the loop's
 *   weights at the cut and the head alone from `reach` up, where `reach` is the
 *   length over which the body's own weights let the head go
 *   (`seam.collar.headReachMetres`, `measureHumanHeadReach`), so the neck's
 *   twist is spread as long as the body spreads it;
 * - at most four influences are kept per vertex (the largest; ties keep the
 *   head first, then the body table's order) and renormalized, which is
 *   what dual quaternion skinning here accepts.
 *
 * `face` is the evaluated face skin before it is posed, so the heights are the
 * document's own. Caller-authored seams without a cut retain the original
 * angular lookup on `body`, the neutral skin. Generated cuts read the shared
 * ordered nearest-face correspondence, even when their native body contour
 * is not radial. The weights of a vertex far above the cut are exactly
 * the head's, so the whole cranium, jaw and everything the face builder
 * attaches to it is rigid with the head bone, as the face already is.
 *
 * The result has the shape the body's skin table has, so the body's own dual
 * quaternion skinning poses the face skin unchanged. `joints` lists the bones
 * the table names, the head first.
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
  const { seam, face, body, bodySkin, jawVertices } = props;
  const point = (positions: readonly number[], vertex: number) => ({
    x: positions[vertex * 3],
    y: positions[vertex * 3 + 1],
    z: positions[vertex * 3 + 2],
  });
  const angleOf = (p: { x: number; z: number }): number =>
    Math.atan2(p.x - seam.axis.x, p.z - seam.axis.z);
  const loopHeight = createHumanLoopHeight(
    seam.faceLoop.map((vertex) => point(face, vertex)),
    seam.axis,
  );
  const reach = seam.collar.headReachMetres;
  const jaw = new Set(jawVertices);
  const facePoints = seam.faceLoop.map((vertex) => point(face, vertex));
  // Caller-authored seams without a cut retain their original angular lookup.
  // Generated cuts use the ordered shared face correspondence rather than
  // requiring a clipped native body contour to be a radial graph.
  const bracket =
    seam.cut === undefined
      ? createHumanLoopAzimuth(
          seam.bodyLoop.map((vertex) => point(body, vertex)),
          seam.axis,
        ).bracket
      : createHumanLoopParameterLookup(
          seam.collar.follow.map(({ edge, fraction }) => edge + fraction),
          seam.faceLoop.length,
        );
  const joints: AutoMovieHumanoidBone[] = ["head"];
  const boneOf = (bone: AutoMovieHumanoidBone): number => {
    let index = joints.indexOf(bone);
    if (index < 0) {
      index = joints.length;
      joints.push(bone);
    }
    return index;
  };
  /** The body's weights at a vertex, by bone. */
  const bodyWeights = (vertex: number): Map<AutoMovieHumanoidBone, number> =>
    humanPersonCutBoneWeights(bodySkin, vertex, seam.cut);
  const count = face.length / 3;
  const boneIndices = new Array<number>(count * 4).fill(0);
  const weights = new Array<number>(count * 4).fill(0);
  for (let vertex = 0; vertex < count; vertex++) {
    const p = point(face, vertex);
    const angle = angleOf(p);
    const t = jaw.has(vertex)
      ? 1
      : Math.min(1, Math.max(0, (p.y - loopHeight(angle)) / reach));
    if (t >= 1) {
      weights[vertex * 4] = 1;
      continue;
    }
    const smooth = t * t * t * (10 - 15 * t + 6 * t * t);
    const projected = projectHumanLoopPoint(facePoints, p);
    const { low, high, along } = bracket(
      seam.cut === undefined ? angle : projected.edge + projected.fraction,
    );
    const mixed = new Map<AutoMovieHumanoidBone, number>([["head", smooth]]);
    for (const [loop, share] of [
      [low, 1 - along],
      [high, along],
    ] as const)
      for (const [bone, weight] of bodyWeights(seam.bodyLoop[loop]))
        mixed.set(bone, (mixed.get(bone) ?? 0) + (1 - smooth) * share * weight);
    const kept = [...mixed]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([bone, weight]) => ({ index: boneOf(bone), weight }));
    const total = kept.reduce((sum, one) => sum + one.weight, 0);
    kept.forEach(({ index, weight }, k) => {
      boneIndices[vertex * 4 + k] = index;
      weights[vertex * 4 + k] = weight / total;
    });
  }
  return { joints, boneIndices, weights };
}
