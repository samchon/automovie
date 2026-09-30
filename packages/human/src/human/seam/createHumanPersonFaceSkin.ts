import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";
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
 * - at azimuth `a` about the neck the body's retained loop has weights
 *   interpolated between the two loop vertices that bracket `a`
 *   (`createHumanLoopAzimuth`), the collar's weights on that side;
 * - the neck's skin ends where the mandible's begins. `jawVertices` are the
 *   face skin vertices the jaw carries (attachment weight above
 *   `HUMAN_PERSON_SEAM.jawShare`), and the blend length is the least height
 *   any of them stands above the face loop at its own azimuth, in this face's
 *   own shape: the chin's underside, so a long chin gives a long blend and a
 *   short one a short one, and the chin is rigid with the head whatever the
 *   face's proportions (with a floor of `minimumBlendMetres`);
 * - a face vertex at height `y` above the loop's height at its azimuth is
 *   `t = (y - loop) / blend` of the way from the neck to the head, blended
 *   with the C2 smootherstep `t^3 (10 - 15 t + 6 t^2)`, so it takes the loop's
 *   weights at the cut and the head alone from the blend length up;
 * - at most four influences are kept per vertex (the largest; ties keep the
 *   head first, then the body table's order) and renormalized, which is
 *   what dual quaternion skinning here accepts.
 *
 * `face` is the evaluated face skin before it is posed, so the heights are the
 * document's own; `body` is the body's neutral skin, which only its loop's
 * azimuths are read from. The weights of a vertex far above the cut are exactly
 * the head's, so the whole cranium, jaw and everything the face builder
 * attaches to it is rigid with the head bone, as the face already is.
 *
 * The result has the shape the body's skin table has, so the body's own dual
 * quaternion skinning poses the face skin unchanged. `joints` lists the bones
 * the table names, the head first.
 *
 * @evidence contracts/common.md#principled-implementation Reading the collar's weights by azimuth and rising to the head by a smooth function of the distance above the cut is what makes both skins follow the same transform at the seam and the head alone above it; ending the blend at the mandible's lowest carried vertex ties it to the face's own anatomy; C2 smootherstep keeps the weights, and so the skin's strain, continuous across the blend, and pruning to four influences with renormalization keeps each weight vector a convex combination.
 * @evidence contracts/common.md#clear-and-simple-design The function is one pass over the face vertices with the azimuth lookup and the loop height as its only geometric inputs, after one pass over the jaw's vertices for the blend length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is special-cased and no length is supplied: the blend is measured on the document's own face, the weights are read from the body's authored table, and the only fixed values are the named thresholds.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the face needs the body's weights, the rules that build them, where the blend ends and why, and the influence limit.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, angle from +Z towards +X about the seam's axis; weights are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The seam's two skins take one transform at the cut because the face's weights there are the body loop's, which is the definition both sides share; the face's weights stay the head's above the blend length, so the join is valid for any pose of the head, neck and chest and opens only where the body's weights at the collar differ strongly between adjacent loop vertices.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function computes weights for one existing part and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it emits a weight table.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the blend is measured from the face's jaw attachment and the collar weights are the body's.
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
  /** Face skin vertices the mandible carries, by shared vertex number. */
  jawVertices: readonly number[];
}): {
  joints: AutoMovieHumanoidBone[];
  boneIndices: number[];
  weights: number[];
} {
  const { seam, face, body, bodySkin, jawVertices } = props;
  if (jawVertices.length === 0)
    throw new Error(
      "The face skin has no jaw-carried vertex to end the neck at.",
    );
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
  const blend = Math.max(
    HUMAN_PERSON_SEAM.minimumBlendMetres,
    Math.min(
      ...jawVertices.map((vertex) => {
        const p = point(face, vertex);
        return p.y - loopHeight(angleOf(p));
      }),
    ),
  );
  const collar = createHumanLoopAzimuth(
    seam.bodyLoop.map((vertex) => point(body, vertex)),
    seam.axis,
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
  const bodyWeights = (vertex: number): Map<AutoMovieHumanoidBone, number> => {
    const found = new Map<AutoMovieHumanoidBone, number>();
    for (let k = 0; k < 4; k++) {
      const weight = bodySkin.weights[vertex * 4 + k];
      if (weight === 0) continue;
      const bone = bodySkin.joints[bodySkin.boneIndices[vertex * 4 + k]];
      found.set(bone, (found.get(bone) ?? 0) + weight);
    }
    return found;
  };
  const count = face.length / 3;
  const boneIndices = new Array<number>(count * 4).fill(0);
  const weights = new Array<number>(count * 4).fill(0);
  for (let vertex = 0; vertex < count; vertex++) {
    const p = point(face, vertex);
    const angle = angleOf(p);
    const t = Math.min(1, Math.max(0, (p.y - loopHeight(angle)) / blend));
    if (t >= 1) {
      weights[vertex * 4] = 1;
      continue;
    }
    const smooth = t * t * t * (10 - 15 * t + 6 * t * t);
    const { low, high, along } = collar.bracket(angle);
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
