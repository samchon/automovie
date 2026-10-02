import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { humanPersonCutBoneWeights } from "./humanPersonCutBoneWeights";
import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";
import { createHumanLoopParameterLookup } from "./createHumanLoopParameterLookup";
import { projectHumanLoopPoint } from "./projectHumanLoopPoint";
import { createHumanLoopHeight } from "./createHumanLoopHeight";

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
 *
 * @evidence contracts/common.md#principled-implementation Reading the body's complete collar weight map through the shared nearest-face correspondence and rising to the head by a smooth function of height above the cut spreads neck motion while retaining the head alone above it; final positional continuity belongs to the collar and stitch owners rather than assuming nonlinear skinning commutes with interpolation; taking the ramp's length from the body's own head weights makes the twist spread over the length the body spreads it over, and forcing the mandible's skin to the head keeps the chin rigid; C2 smootherstep keeps the weights, and so the skin's strain, continuous across the ramp, and pruning to four influences with renormalization keeps each weight vector a convex combination.
 * @evidence contracts/common.md#clear-and-simple-design The function is one pass over the face vertices with the shared correspondence lookup and the loop height as its geometric inputs, after the jaw's vertices are marked.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is special-cased and no length is supplied: the ramp length is the body's measured head reach, the jaw's vertices are the face's own attachment, and the weights are read from the body's authored table.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the face needs the body's weights, the rules that build them, the ramp and its length, why the jaw is rigid, and the influence limit.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, angle from +Z towards +X about the seam's axis; weights are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The face reads the body's complete bone-wise affine weight field at frozen cut intersections before its final four-influence limit. These weights spread neck motion; they do not make nonlinear skinning commute with edge interpolation. Final posed positional continuity belongs to conformHumanPersonCollar and stitchHumanPersonBoundary, and unsupported folds remain their admission failures.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function computes weights for one existing part and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it emits a weight table.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the ramp length and the collar weights are the body's and the jaw attachment is the face's.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
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
  const bracket = seam.cut === undefined
    ? createHumanLoopAzimuth(seam.bodyLoop.map((vertex) => point(body, vertex)), seam.axis).bracket
    : createHumanLoopParameterLookup(seam.collar.follow.map(({ edge, fraction }) => edge + fraction), seam.faceLoop.length);
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
    const { low, high, along } = bracket(seam.cut === undefined ? angle : projected.edge + projected.fraction);
    const mixed = new Map<AutoMovieHumanoidBone, number>([["head", smooth]]);
    for (const [loop, share] of [
      [low, 1 - along],
      [high, along],
    ] as const)
      for (const [bone, weight] of bodyWeights(seam.bodyLoop[loop]))
        mixed.set(
          bone,
          (mixed.get(bone) ?? 0) + (1 - smooth) * share * weight,
        );
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
